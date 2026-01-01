import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation helpers
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

const isValidPhone = (phone: string): boolean => {
  // Allow digits, spaces, +, -, and parentheses
  const phoneRegex = /^[\d\s\+\-\(\)]{7,20}$/;
  return phoneRegex.test(phone);
};

// Improved sanitization for customer names - allow Unicode letters, spaces, hyphens, apostrophes, periods
const sanitizeName = (str: string, maxLength: number): string => {
  return str.trim()
    .slice(0, maxLength)
    // Remove control characters and potentially dangerous chars but allow Unicode letters
    .replace(/[\x00-\x1f\x7f<>{}[\]\\`]/g, '')
    // Normalize multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
};

// Improved sanitization for addresses - more permissive for special chars but still safe
const sanitizeAddress = (str: string, maxLength: number): string => {
  return str.trim()
    .slice(0, maxLength)
    // Remove control characters, angle brackets, and script-related chars
    .replace(/[\x00-\x1f\x7f<>{}[\]\\`]/g, '')
    // Normalize multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
};

// General string sanitization
const sanitizeString = (str: string, maxLength: number): string => {
  return str.trim()
    .slice(0, maxLength)
    .replace(/[\x00-\x1f\x7f<>{}[\]\\`]/g, '')
    .trim();
};

// Product prices - server-side source of truth (all prices include taxes)
const PRODUCT_PRICES: Record<string, number> = {
  "noir-intense": 444,
  "blanc-elegance": 444,
  "rouge-passion": 444,
  "oud-royal": 444,
  "velvet-night": 444,
  "divine-rose": 444,
  "amber-elixir": 444,
  "citrus-aura": 444,
};

const VALID_PRODUCT_IDS = Object.keys(PRODUCT_PRICES);

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface ShippingAddress {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface OrderRequest {
  user_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: ShippingAddress;
  items: OrderItem[];
  payment_method: string;
  payment_status?: string; // For COD with prepaid shipping
  coupon_code?: string | null;
  affiliate_code?: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing order creation request");

    const orderRequest: OrderRequest = await req.json();
    console.log("Received order request for:", orderRequest.customer_email);

    // Validate required fields exist
    if (!orderRequest.customer_name || !orderRequest.customer_email || 
        !orderRequest.customer_phone || !orderRequest.shipping_address || 
        !orderRequest.items || !orderRequest.payment_method) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and sanitize customer data
    const customerEmail = sanitizeString(orderRequest.customer_email, 255).toLowerCase();
    if (!isValidEmail(customerEmail)) {
      console.error("Invalid email format:", customerEmail);
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const customerPhone = sanitizeString(orderRequest.customer_phone, 20);
    if (!isValidPhone(customerPhone)) {
      console.error("Invalid phone format:", customerPhone);
      return new Response(
        JSON.stringify({ error: "Invalid phone number format" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use improved name sanitization
    const customerName = sanitizeName(orderRequest.customer_name, 100);
    if (customerName.length < 2) {
      console.error("Customer name too short");
      return new Response(
        JSON.stringify({ error: "Customer name must be at least 2 characters" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate shipping address with improved sanitization
    const shippingAddress: ShippingAddress = {
      address: sanitizeAddress(orderRequest.shipping_address.address || '', 200),
      city: sanitizeName(orderRequest.shipping_address.city || '', 100),
      state: sanitizeName(orderRequest.shipping_address.state || '', 100),
      zipCode: sanitizeString(orderRequest.shipping_address.zipCode || '', 20).replace(/[^a-zA-Z0-9\s\-]/g, ''),
      country: sanitizeName(orderRequest.shipping_address.country || '', 100),
    };

    if (!shippingAddress.address || !shippingAddress.city || 
        !shippingAddress.state || !shippingAddress.zipCode || !shippingAddress.country) {
      console.error("Incomplete shipping address");
      return new Response(
        JSON.stringify({ error: "Complete shipping address is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate items and recalculate prices server-side
    if (!Array.isArray(orderRequest.items) || orderRequest.items.length === 0) {
      console.error("No items in order");
      return new Response(
        JSON.stringify({ error: "Order must contain at least one item" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (orderRequest.items.length > 50) {
      console.error("Too many items in order");
      return new Response(
        JSON.stringify({ error: "Order cannot contain more than 50 items" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let subtotal = 0;
    const validatedItems: OrderItem[] = [];

    for (const item of orderRequest.items) {
      if (!VALID_PRODUCT_IDS.includes(item.productId)) {
        console.error("Invalid product ID:", item.productId);
        return new Response(
          JSON.stringify({ error: `Invalid product: ${item.productId}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const quantity = Math.floor(Number(item.quantity));
      if (quantity < 1 || quantity > 10) {
        console.error("Invalid quantity for product:", item.productId, quantity);
        return new Response(
          JSON.stringify({ error: `Invalid quantity for ${item.productId}. Must be 1-10.` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Use server-side price, not client-provided price
      const serverPrice = PRODUCT_PRICES[item.productId];
      subtotal += serverPrice * quantity;

      validatedItems.push({
        productId: item.productId,
        name: sanitizeName(item.name || '', 100),
        price: serverPrice,
        quantity: quantity,
      });
    }

    // Validate payment method
    const validPaymentMethods = ['cod', 'razorpay'];
    if (!validPaymentMethods.includes(orderRequest.payment_method)) {
      console.error("Invalid payment method:", orderRequest.payment_method);
      return new Response(
        JSON.stringify({ error: "Invalid payment method" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate shipping - FREE for online payment, ₹79 for COD under ₹999
    const shipping = orderRequest.payment_method === 'razorpay' ? 0 : (subtotal >= 999 ? 0 : 79);

    // Initialize Supabase client with service role for inserting
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle coupon discount
    let discount = 0;
    let validCouponCode: string | null = null;

    if (orderRequest.coupon_code) {
      const couponCode = sanitizeString(orderRequest.coupon_code, 50).toUpperCase();
      console.log("Validating coupon:", couponCode);

      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode)
        .eq('is_active', true)
        .single();

      if (!couponError && coupon) {
        // Check expiry
        if (!coupon.expires_at || new Date(coupon.expires_at) > new Date()) {
          // Check usage limit
          if (!coupon.max_uses || (coupon.current_uses || 0) < coupon.max_uses) {
            // Check minimum order
            if (!coupon.min_order_amount || subtotal >= coupon.min_order_amount) {
              discount = (subtotal * coupon.discount_percent) / 100;
              validCouponCode = couponCode;
              console.log("Coupon applied, discount:", discount);

              // Increment coupon usage
              await supabase
                .from('coupons')
                .update({ current_uses: (coupon.current_uses || 0) + 1 })
                .eq('id', coupon.id);
            }
          }
        }
      }
    }

    // Handle affiliate discount
    let validAffiliateCode: string | null = null;

    if (orderRequest.affiliate_code && !validCouponCode) {
      const affiliateCode = sanitizeString(orderRequest.affiliate_code, 50).toUpperCase();
      console.log("Validating affiliate code:", affiliateCode);

      const { data: affiliate, error: affiliateError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('code', affiliateCode)
        .eq('is_active', true)
        .single();

      if (!affiliateError && affiliate) {
        discount = (subtotal * (affiliate.coupon_discount_percent || 10)) / 100;
        validAffiliateCode = affiliateCode;
        console.log("Affiliate discount applied:", discount);

        // Update affiliate stats
        const commission = (subtotal * (affiliate.commission_percent || 10)) / 100;
        await supabase
          .from('affiliates')
          .update({
            total_referrals: (affiliate.total_referrals || 0) + 1,
            total_earnings: (affiliate.total_earnings || 0) + commission,
          })
          .eq('id', affiliate.id);
      }
    }

    // Calculate total
    const total = subtotal - discount + shipping;

    // Generate order number
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create order
    const orderData = {
      order_number: orderNumber,
      user_id: orderRequest.user_id || null,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      shipping_address: shippingAddress,
      items: validatedItems,
      subtotal: subtotal,
      discount: discount,
      shipping: shipping,
      total: total,
      payment_method: orderRequest.payment_method,
      coupon_code: validCouponCode,
      affiliate_code: validAffiliateCode,
      payment_status: orderRequest.payment_status || 'pending',
      order_status: orderRequest.payment_status === 'shipping_paid' ? 'confirmed' : 'pending',
    };

    console.log("Creating order:", orderNumber);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to create order" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Order created successfully:", order.order_number);

    // Send order confirmation email (fire and forget)
    try {
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      
      const emailPayload = {
        order_number: order.order_number,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        items: validatedItems,
        subtotal: subtotal,
        discount: discount,
        shipping: shipping,
        total: total,
        shipping_address: shippingAddress,
        payment_method: orderRequest.payment_method,
        coupon_code: validCouponCode,
        affiliate_code: validAffiliateCode,
      };

      // Send email confirmation asynchronously
      fetch(`${supabaseUrl}/functions/v1/send-order-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(emailPayload),
      }).then(res => {
        console.log("Email confirmation sent, status:", res.status);
      }).catch(err => {
        console.error("Failed to send email confirmation:", err);
      });
    } catch (emailError) {
      console.error("Error initiating email send:", emailError);
      // Don't fail the order if email fails
    }

    // Generate loyalty coupon for the customer (fire and forget)
    if (orderRequest.user_id) {
      try {
        const supabaseAnonKeyForLoyalty = Deno.env.get('SUPABASE_ANON_KEY')!;
        fetch(`${supabaseUrl}/functions/v1/generate-loyalty-coupon`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKeyForLoyalty}`,
          },
          body: JSON.stringify({
            user_id: orderRequest.user_id,
            customer_email: customerEmail,
            customer_name: customerName,
            order_number: order.order_number,
          }),
        }).then(res => {
          console.log("Loyalty coupon generation triggered, status:", res.status);
        }).catch(err => {
          console.error("Failed to trigger loyalty coupon:", err);
        });
      } catch (loyaltyError) {
        console.error("Error initiating loyalty coupon generation:", loyaltyError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        order: {
          id: order.id,
          order_number: order.order_number,
          total: order.total,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in create-order function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

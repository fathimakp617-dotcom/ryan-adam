import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOW_STOCK_THRESHOLD = 10;

const parseEmailList = (value: string | undefined | null): string[] => {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const sendLowStockAlert = async (params: {
  productId: string;
  productName?: string;
  newStock: number;
  orderNumber?: string;
  recipients: string[];
  supabaseUrl: string;
  supabaseServiceKey: string;
}) => {
  const { productId, productName, newStock, orderNumber, recipients, supabaseUrl, supabaseServiceKey } = params;
  if (newStock >= LOW_STOCK_THRESHOLD) return;
  if (!recipients.length) return;

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY missing; skipping low stock email');
      return;
    }

    const resend = new Resend(resendApiKey);
    const subject = `⚠️ Low stock: ${productName ?? productId} (${newStock} left)`;
    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height: 1.5;">
        <h2 style="margin: 0 0 12px;">Low stock alert</h2>
        <p style="margin: 0 0 8px;"><strong>Product:</strong> ${productName ?? productId}</p>
        <p style="margin: 0 0 8px;"><strong>Product ID:</strong> ${productId}</p>
        <p style="margin: 0 0 8px;"><strong>Remaining stock:</strong> ${newStock}</p>
        ${orderNumber ? `<p style="margin: 0 0 8px;"><strong>Triggered by order:</strong> ${orderNumber}</p>` : ''}
        <p style="margin: 16px 0 0; color: #555;">This is an automated alert.</p>
      </div>
    `;

    const emailRes = await resend.emails.send({
      from: 'Rayn Adam <notifications@raynadamperfume.com>',
      to: recipients,
      subject,
      html,
    });

    console.log('Low stock email sent:', { productId, newStock, emailRes });

    // Log in staff_notifications for audit/debugging
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await supabase.from('staff_notifications').insert({
      staff_email: 'system',
      notification_type: 'low_stock_alert',
      subject,
      recipients,
      sent_by: 'system',
      order_number: orderNumber ?? null,
      details: { product_id: productId, product_name: productName ?? null, stock_quantity: newStock },
    });
  } catch (err) {
    console.error('Failed to send low stock alert:', err);
  }
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
  "elite": 444,
  "amber-crown": 444,
  "legacy": 444,
  "combo": 444,
  "elite-combo": 888,
  "amber-crown-combo": 888,
};

const VALID_PRODUCT_IDS = Object.keys(PRODUCT_PRICES);

// Bulk discount tiers - must match frontend
const BULK_DISCOUNT_TIERS = [
  { minQty: 100, discountPercent: 30 },
  { minQty: 50, discountPercent: 20 },
  { minQty: 25, discountPercent: 10 },
];

const getBulkDiscountPercent = (totalQuantity: number): number => {
  for (const tier of BULK_DISCOUNT_TIERS) {
    if (totalQuantity >= tier.minQty) {
      return tier.discountPercent;
    }
  }
  return 0;
};

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

    // Initialize Supabase client early for stock checks
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let subtotal = 0;
    let totalQuantity = 0;
     const validatedItems: OrderItem[] = [];
     const stockUpdates: { productId: string; productName?: string; beforeStock: number; quantity: number }[] = [];

    for (const item of orderRequest.items) {
      if (!VALID_PRODUCT_IDS.includes(item.productId)) {
        console.error("Invalid product ID:", item.productId);
        return new Response(
          JSON.stringify({ error: `Invalid product: ${item.productId}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const quantity = Math.floor(Number(item.quantity));
      if (quantity < 1 || quantity > 1000) {
        console.error("Invalid quantity for product:", item.productId, quantity);
        return new Response(
          JSON.stringify({ error: `Invalid quantity for ${item.productId}. Must be 1-1000.` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check stock availability
       const { data: product, error: productError } = await supabase
        .from('products')
         .select('stock_quantity, is_active, name')
        .eq('id', item.productId)
        .maybeSingle();

      if (productError) {
        console.error("Error checking stock for:", item.productId, productError);
      }

      // If product exists in DB, check stock
      if (product) {
        if (!product.is_active) {
          console.error("Product is not active:", item.productId);
          return new Response(
            JSON.stringify({ error: `Product ${item.productId} is currently unavailable` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (product.stock_quantity < quantity) {
          console.error("Insufficient stock for:", item.productId, "requested:", quantity, "available:", product.stock_quantity);
          return new Response(
            JSON.stringify({ error: `Insufficient stock for ${item.productId}. Only ${product.stock_quantity} available.` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

         // Track stock update for this product
         stockUpdates.push({
           productId: item.productId,
           productName: product.name ?? undefined,
           beforeStock: product.stock_quantity,
           quantity,
         });
      }

      // Use server-side price, not client-provided price
      const serverPrice = PRODUCT_PRICES[item.productId];
      subtotal += serverPrice * quantity;
      totalQuantity += quantity;

      validatedItems.push({
        productId: item.productId,
        name: sanitizeName(item.name || '', 100),
        price: serverPrice,
        quantity: quantity,
      });
    }

    // Calculate bulk discount
    const bulkDiscountPercent = getBulkDiscountPercent(totalQuantity);
    const bulkDiscount = Math.round(subtotal * (bulkDiscountPercent / 100));
    console.log(`Bulk discount: ${bulkDiscountPercent}% on ${totalQuantity} items = ${bulkDiscount}`);

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
    const priceAfterBulk = subtotal - bulkDiscount;
    const shipping = orderRequest.payment_method === 'razorpay' ? 0 : (priceAfterBulk >= 999 ? 0 : 79);

    // Handle coupon discount (only if NO bulk discount applied)
    let couponDiscount = 0;
    let validCouponCode: string | null = null;

    if (orderRequest.coupon_code && bulkDiscountPercent === 0) {
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
            // Check minimum order (on price after bulk discount)
            if (!coupon.min_order_amount || priceAfterBulk >= coupon.min_order_amount) {
              couponDiscount = Math.round(priceAfterBulk * (coupon.discount_percent / 100));
              validCouponCode = couponCode;
              console.log("Coupon applied, discount:", couponDiscount);

              // Increment coupon usage
              await supabase
                .from('coupons')
                .update({ current_uses: (coupon.current_uses || 0) + 1 })
                .eq('id', coupon.id);
            }
          }
        }
      }
    } else if (orderRequest.coupon_code && bulkDiscountPercent > 0) {
      console.log("Coupon ignored - bulk discount active");
    }

    // Handle affiliate discount (only if NO bulk discount AND no coupon applied)
    let affiliateDiscount = 0;
    let validAffiliateCode: string | null = null;

    if (orderRequest.affiliate_code && !validCouponCode && bulkDiscountPercent === 0) {
      const affiliateCode = sanitizeString(orderRequest.affiliate_code, 50).toUpperCase();
      console.log("Validating affiliate code:", affiliateCode);

      const { data: affiliate, error: affiliateError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('code', affiliateCode)
        .eq('is_active', true)
        .single();

      if (!affiliateError && affiliate) {
        // Block self-referral: user cannot use their own affiliate code
        const isSelfReferral =
          (orderRequest.user_id && affiliate.user_id && orderRequest.user_id === affiliate.user_id) ||
          (affiliate.email && affiliate.email.toLowerCase() === customerEmail.toLowerCase());

        if (isSelfReferral) {
          console.log("Self-referral blocked for affiliate code:", affiliateCode, "user:", customerEmail);
        } else {
          affiliateDiscount = Math.round(priceAfterBulk * ((affiliate.coupon_discount_percent || 10) / 100));
          validAffiliateCode = affiliateCode;
          console.log("Affiliate discount applied:", affiliateDiscount);

          // Update affiliate stats
          const commission = Math.round((subtotal * (affiliate.commission_percent || 10)) / 100);
          const newTotalEarnings = (affiliate.total_earnings || 0) + commission;
          const newTotalReferrals = (affiliate.total_referrals || 0) + 1;
          await supabase
            .from('affiliates')
            .update({
              total_referrals: newTotalReferrals,
              total_earnings: newTotalEarnings,
            })
            .eq('id', affiliate.id);

          // Send commission notification email to affiliate owner (fire and forget)
          try {
            const resendApiKey = Deno.env.get('RESEND_API_KEY');
            if (resendApiKey && affiliate.email) {
              const resendForAffiliate = new Resend(resendApiKey);
              const affiliateName = affiliate.name || 'Partner';
              const itemsList = validatedItems.map(i => `${i.name} × ${i.quantity}`).join(', ');

              await resendForAffiliate.emails.send({
                from: 'Rayn Adam <notifications@raynadamperfume.com>',
                to: [affiliate.email],
                subject: `🎉 New sale! You earned ₹${commission} commission`,
                html: `
                  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 28px 24px; text-align: center;">
                      <h1 style="margin: 0; color: #c9a96e; font-size: 22px; letter-spacing: 1px;">RAYN ADAM</h1>
                      <p style="margin: 8px 0 0; color: #d4d4d8; font-size: 13px;">Affiliate Commission Notification</p>
                    </div>
                    <div style="padding: 28px 24px;">
                      <p style="margin: 0 0 16px; color: #374151; font-size: 15px;">Hi <strong>${affiliateName}</strong>,</p>
                      <p style="margin: 0 0 20px; color: #374151; font-size: 15px;">Great news! Someone just made a purchase using your affiliate code <strong>${affiliateCode}</strong>.</p>
                      
                      <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Order Details</p>
                        <p style="margin: 0 0 6px; color: #374151; font-size: 14px;"><strong>Items:</strong> ${itemsList}</p>
                        <p style="margin: 0; color: #374151; font-size: 14px;"><strong>Order Value:</strong> ₹${subtotal}</p>
                      </div>

                      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <p style="margin: 0 0 8px; font-size: 13px; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Your Earnings</p>
                        <p style="margin: 0 0 6px; color: #166534; font-size: 20px; font-weight: 700;">+ ₹${commission}</p>
                        <p style="margin: 0; color: #15803d; font-size: 13px;">Commission rate: ${affiliate.commission_percent || 10}%</p>
                      </div>

                      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <p style="margin: 0 0 4px; font-size: 13px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">Available Balance</p>
                        <p style="margin: 0 0 4px; color: #92400e; font-size: 20px; font-weight: 700;">₹${newTotalEarnings}</p>
                        <p style="margin: 0; color: #a16207; font-size: 12px;">Total referrals: ${newTotalReferrals}</p>
                      </div>

                      <p style="margin: 0; color: #6b7280; font-size: 13px;">You can request a withdrawal from your account dashboard once your balance reaches ₹500.</p>
                    </div>
                    <div style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #9ca3af; font-size: 11px;">© Rayn Adam Perfume • This is an automated notification</p>
                    </div>
                  </div>
                `,
              });
              console.log('Affiliate commission email sent to:', affiliate.email, 'commission:', commission);
            }
          } catch (emailErr) {
            console.error('Failed to send affiliate commission email:', emailErr);
          }
        }
      }
    } else if (orderRequest.affiliate_code && bulkDiscountPercent > 0) {
      console.log("Affiliate code ignored - bulk discount active");
    }

    // Calculate total discount and final total
    const totalDiscount = bulkDiscount + couponDiscount + affiliateDiscount;
    const total = subtotal - totalDiscount + shipping;
    console.log(`Order totals: subtotal=${subtotal}, bulkDiscount=${bulkDiscount}, couponDiscount=${couponDiscount}, affiliateDiscount=${affiliateDiscount}, shipping=${shipping}, total=${total}`);

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
      discount: totalDiscount,
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

     const lowStockRecipients = (() => {
       const adminOrderEmails = parseEmailList(Deno.env.get('ADMIN_ORDER_EMAIL'));
       const adminEmails = parseEmailList(Deno.env.get('ADMIN_EMAILS'));
       return [...new Set([...adminOrderEmails, ...adminEmails])];
     })();

     // Reduce stock for ordered products
     for (const stockUpdate of stockUpdates) {
      try {
        const { error: stockError } = await supabase.rpc('reduce_product_stock', {
          p_product_id: stockUpdate.productId,
          p_quantity: stockUpdate.quantity
        });
        
        if (stockError) {
          // If RPC doesn't exist, fall back to direct update
          console.log("RPC not available, using direct update for:", stockUpdate.productId);
          const { data: currentProduct } = await supabase
            .from('products')
            .select('stock_quantity')
            .eq('id', stockUpdate.productId)
            .single();
          
          if (currentProduct) {
            await supabase
              .from('products')
              .update({ 
                stock_quantity: Math.max(0, currentProduct.stock_quantity - stockUpdate.quantity),
                updated_at: new Date().toISOString()
              })
              .eq('id', stockUpdate.productId);
          }
        }
        console.log(`Stock reduced for ${stockUpdate.productId}: -${stockUpdate.quantity}`);

         // Send alert only when crossing threshold (to avoid spamming on every order)
         const estimatedAfter = Math.max(0, stockUpdate.beforeStock - stockUpdate.quantity);
         if (stockUpdate.beforeStock >= LOW_STOCK_THRESHOLD && estimatedAfter < LOW_STOCK_THRESHOLD) {
           await sendLowStockAlert({
             productId: stockUpdate.productId,
             productName: stockUpdate.productName,
             newStock: estimatedAfter,
             orderNumber: order.order_number,
             recipients: lowStockRecipients,
             supabaseUrl,
             supabaseServiceKey,
           });
         }
      } catch (stockErr) {
        console.error(`Failed to reduce stock for ${stockUpdate.productId}:`, stockErr);
        // Don't fail the order if stock update fails
      }
    }

    try {
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      
      const emailPayload = {
        order_number: order.order_number,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        items: validatedItems,
        subtotal: subtotal,
        discount: totalDiscount,
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

    // Send bulk order notification to admin and shipping (fire and forget)
    if (totalQuantity >= 25) {
      try {
        console.log("Bulk order detected, sending notification to admin and shipping");
        const bulkNotifyAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        fetch(`${supabaseUrl}/functions/v1/send-bulk-order-notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bulkNotifyAnonKey}`,
          },
          body: JSON.stringify({
            order_number: order.order_number,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
            total_quantity: totalQuantity,
            subtotal: subtotal,
            bulk_discount: bulkDiscount,
            bulk_discount_percent: bulkDiscountPercent,
            total: total,
            items: validatedItems,
            shipping_address: shippingAddress,
            payment_method: orderRequest.payment_method,
          }),
        }).then(res => {
          console.log("Bulk order notification sent, status:", res.status);
        }).catch(err => {
          console.error("Failed to send bulk order notification:", err);
        });
      } catch (bulkNotifyError) {
        console.error("Error sending bulk order notification:", bulkNotifyError);
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

import { useState, useEffect, memo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Truck, Check, Lock, LogIn, AlertTriangle, Smartphone, Zap, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useAffiliate } from "@/contexts/AffiliateContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/data/products";
import { useToast } from "@/hooks/use-toast";
import { usePinCodeLookup } from "@/hooks/usePinCodeLookup";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CouponInput from "@/components/CouponInput";
import ShippingTermsDialog from "@/components/ShippingTermsDialog";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface SavedAddress {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const Checkout = () => {
  const { items, totalPrice, clearCart, totalItems, bulkDiscountPercent, bulkDiscountAmount } = useCart();
  const { affiliateCode, appliedCoupon, calculateDiscount, removeCoupon } = useAffiliate();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [savedAddress, setSavedAddress] = useState<SavedAddress | null>(null);
  const [isExpressMode, setIsExpressMode] = useState(false);
  const [loadingSavedAddress, setLoadingSavedAddress] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
  });

  // Load saved address for returning customers
  useEffect(() => {
    const loadSavedAddress = async () => {
      if (!user) {
        setLoadingSavedAddress(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('saved_address, first_name, last_name, phone')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        
        if (data?.saved_address && typeof data.saved_address === 'object' && !Array.isArray(data.saved_address)) {
          const addr = data.saved_address as unknown as SavedAddress;
          if (addr.firstName && addr.address && addr.city) {
            setSavedAddress(addr);
          }
        }
      } catch (error) {
        console.error('Error loading saved address:', error);
      } finally {
        setLoadingSavedAddress(false);
      }
    };
    
    loadSavedAddress();
  }, [user]);

  // Auto-fill user data when logged in
  useEffect(() => {
    if (user) {
      const metadata = user.user_metadata || {};
      setFormData(prev => ({
        ...prev,
        email: user.email || prev.email,
        firstName: metadata.first_name || prev.firstName,
        lastName: metadata.last_name || prev.lastName,
      }));
    }
  }, [user]);

  // Clear coupon if bulk discount is active (they are mutually exclusive)
  useEffect(() => {
    if (bulkDiscountPercent > 0 && appliedCoupon) {
      removeCoupon();
    }
  }, [bulkDiscountPercent, appliedCoupon, removeCoupon]);

  // Handle express checkout - auto-fill saved address
  const handleExpressCheckout = () => {
    if (!savedAddress) return;
    
    setFormData(prev => ({
      ...prev,
      firstName: savedAddress.firstName,
      lastName: savedAddress.lastName,
      phone: savedAddress.phone,
      address: savedAddress.address,
      city: savedAddress.city,
      state: savedAddress.state,
      zipCode: savedAddress.zipCode,
      country: savedAddress.country,
    }));
    setIsExpressMode(true);
    
    toast({
      title: "Express Checkout Activated",
      description: "Your saved address has been applied. Review and place your order!",
    });
    
    // Scroll to payment section
    setTimeout(() => {
      document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Save address after successful order
  const saveAddressToProfile = async () => {
    if (!user) return;
    
    try {
      const addressData: Record<string, string> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
      };
      
      await supabase
        .from('profiles')
        .update({ saved_address: addressData })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error saving address:', error);
    }
  };

  // Free shipping for online payment (UPI/Card), coupon with free shipping, or COD orders ≥₹999
  const hasFreeShipping = appliedCoupon?.freeShipping || paymentMethod === "upi" || paymentMethod === "card" || totalPrice >= 999;
  const shipping = hasFreeShipping ? 0 : 79;
  // Only apply coupon discount if no bulk discount is active
  const couponDiscount = bulkDiscountPercent > 0 ? 0 : calculateDiscount(totalPrice);
  const totalDiscount = bulkDiscountAmount + couponDiscount;
  const orderTotal = totalPrice - totalDiscount + shipping;

  // PIN code lookup hook
  const { isLoading: isPinLoading, lookupPinCode } = usePinCodeLookup();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePinCodeBlur = useCallback(async (pinCode: string) => {
    if (pinCode.length === 6) {
      const pinData = await lookupPinCode(pinCode);
      if (pinData) {
        setFormData((prev) => ({
          ...prev,
          city: pinData.city,
          state: pinData.state,
          country: pinData.country,
        }));
      }
    }
  }, [lookupPinCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Show terms dialog instead of directly processing
    setShowTermsDialog(true);
  };

  const handleConfirmOrder = async () => {
    setShowTermsDialog(false);
    if (paymentMethod === "upi" || paymentMethod === "card") {
      await handleRazorpayPayment(paymentMethod);
    } else {
      await handleCODOrder();
    }
  };

  const handleCODOrder = async () => {
    // For now, allow all COD orders without shipping prepayment
    // TODO: Enable Razorpay shipping prepayment when ready
    await createCODOrder(false);
  };

  const createCODOrder = async (shippingPaid = false) => {
    setIsProcessing(true);

    try {
      const orderData = {
        user_id: user.id,
        customer_name: `${formData.firstName} ${formData.lastName}`,
        customer_email: formData.email,
        customer_phone: formData.phone,
        shipping_address: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
        items: items.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        })),
        payment_method: "cod",
        payment_status: shippingPaid ? "shipping_paid" : "pending",
        coupon_code: appliedCoupon?.code || null,
        affiliate_code: affiliateCode || null,
      };

      const { data, error } = await supabase.functions.invoke('create-order', {
        body: orderData,
      });

      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Order Placed Successfully!",
        description: shippingPaid 
          ? `Order #${data.order.order_number}. Shipping paid - we'll dispatch your order soon!` 
          : `Order #${data.order.order_number}. You will receive a confirmation email shortly.`,
      });

      // Save address for future express checkout
      await saveAddressToProfile();
      
      clearCart();
      navigate(`/?order=${data.order.order_number}`);
    } catch (error) {
      console.error("Order error:", error);
      toast({
        title: "Error placing order",
        description: error instanceof Error ? error.message : "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCODShippingPayment = async () => {
    setIsProcessing(true);

    try {
      // Create Razorpay order for shipping charge only
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: shipping,
          currency: "INR",
          receipt: `cod_shipping_${Date.now()}`,
          notes: {
            customer_email: formData.email,
            customer_name: `${formData.firstName} ${formData.lastName}`,
            payment_type: "cod_shipping",
          },
        },
      });

      if (orderError || !orderData?.success) {
        throw new Error(orderData?.error || "Failed to create shipping payment order");
      }

      // Load Razorpay script if not loaded
      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Rayn Adam",
        description: "COD Shipping Charge",
        image: "https://uyrudydfpbisawgsepxd.supabase.co/storage/v1/object/public/assets/logo.png",
        order_id: orderData.order.id,
        handler: async (response: any) => {
          await verifyCODShippingAndCreateOrder(response);
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone,
          method: "upi",
        },
        remember_customer: true,
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay via UPI",
                instruments: [
                  { method: "upi", flows: ["qrcode", "collect", "intent"] },
                  { method: "upi", apps: ["google_pay", "phonepe", "paytm"] },
                ],
              },
              cards: {
                name: "Card Payment",
                instruments: [
                  { method: "card", types: ["credit", "debit"] },
                ],
              },
            },
            sequence: ["block.upi", "block.cards"],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        theme: {
          color: "#a87c39",
          backdrop_color: "rgba(28, 28, 28, 0.95)",
          hide_topbar: false,
        },
        modal: {
          confirm_close: true,
          escape: false,
          animation: true,
          backdropclose: false,
          ondismiss: () => {
            setIsProcessing(false);
            toast({
              title: "Shipping Payment Cancelled",
              description: "Please pay the shipping charge to place your COD order.",
              variant: "destructive",
            });
          },
        },
        retry: {
          enabled: true,
          max_count: 3,
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("COD Shipping payment error:", error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initiate shipping payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const verifyCODShippingAndCreateOrder = async (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    try {
      // Verify the shipping payment
      const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
        body: {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          is_shipping_only: true, // Flag to indicate this is just shipping verification
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || "Shipping payment verification failed");
      }

      toast({
        title: "Shipping Paid!",
        description: "Creating your COD order...",
      });

      // Now create the COD order with shipping marked as paid
      await createCODOrder(true);
    } catch (error) {
      console.error("Shipping verification error:", error);
      toast({
        title: "Payment Verification Failed",
        description: "Please contact support with your payment details.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleRazorpayPayment = async (method: "upi" | "card" = "upi") => {
    setIsProcessing(true);

    try {
      // Create Razorpay order
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: orderTotal,
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
          notes: {
            customer_email: formData.email,
            customer_name: `${formData.firstName} ${formData.lastName}`,
          },
        },
      });

      if (orderError || !orderData?.success) {
        throw new Error(orderData?.error || "Failed to create payment order");
      }

      // Load Razorpay script if not loaded
      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      const isUPI = method === "upi";
      const contactDigits = (formData.phone || "").replace(/\D/g, "");

      const options = {
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Rayn Adam",
        description: isUPI ? "UPI Payment - Luxury Perfume" : "Card/Netbanking - Luxury Perfume",
        image: "https://uyrudydfpbisawgsepxd.supabase.co/storage/v1/object/public/assets/logo.png",
        order_id: orderData.order.id,
        handler: async (response: any) => {
          await verifyAndCompleteOrder(response);
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: contactDigits,
        },
        // Enable saved cards/tokens
        remember_customer: true,
        // Keep fallback methods enabled to avoid "no appropriate payment method found".
        // We only *prioritize* UPI in the UI when the user selects it.
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          paylater: false,
        },
        config: {
          display: {
            hide: [{ method: "paylater" }],
            blocks: {
              upi: {
                name: "UPI",
                instruments: [{ method: "upi" }],
              },
              cards: {
                name: "Cards",
                instruments: [{ method: "card" }],
              },
              banks: {
                name: "Netbanking",
                instruments: [{ method: "netbanking" }],
              },
            },
            sequence: isUPI
              ? ["block.upi", "block.cards", "block.banks"]
              : ["block.cards", "block.banks", "block.upi"],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
        theme: {
          color: "#a87c39",
          backdrop_color: "rgba(28, 28, 28, 0.95)",
          hide_topbar: false,
        },
        modal: {
          confirm_close: true,
          escape: false,
          animation: true,
          backdropclose: false,
          ondismiss: () => {
            setIsProcessing(false);
            toast({
              title: "Payment Cancelled",
              description: "Your payment was cancelled. You can try again.",
              variant: "destructive",
            });
          },
        },
        readonly: {
          contact: false,
          email: false,
        },
        send_sms_hash: true,
        retry: {
          enabled: true,
          max_count: 3,
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (resp: any) => {
        const msg = resp?.error?.description || resp?.error?.reason || "Payment failed. Please try again.";
        console.error("Razorpay payment.failed:", resp);
        toast({
          title: resp?.error?.code || "Payment Failed",
          description: msg,
          variant: "destructive",
        });
      });
      razorpay.open();
    } catch (error) {
      console.error("Razorpay error:", error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const loadRazorpayScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay'));
      document.body.appendChild(script);
    });
  };

  const verifyAndCompleteOrder = async (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
        body: {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          order_data: {
            user_id: user?.id,
            customer_name: `${formData.firstName} ${formData.lastName}`,
            customer_email: formData.email,
            customer_phone: formData.phone,
            shipping_address: {
              address: formData.address,
              city: formData.city,
              state: formData.state,
              zipCode: formData.zipCode,
              country: formData.country,
            },
            items: items.map(item => ({
              productId: item.product.id,
              name: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
            })),
            coupon_code: appliedCoupon?.code || null,
            affiliate_code: affiliateCode || null,
          },
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || "Payment verification failed");
      }

      toast({
        title: "Payment Successful!",
        description: `Order #${data.order.order_number}. You will receive a confirmation email shortly.`,
      });

      // Save address for future express checkout
      await saveAddressToProfile();
      
      clearCart();
      navigate(`/?order=${data.order.order_number}`);
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Payment Verification Failed",
        description: "Please contact support with your payment details.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-32 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  // Require login to checkout
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto text-center"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogIn className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-heading text-foreground mb-4">Login Required</h1>
            <p className="text-muted-foreground mb-8">
              Please sign in to your account to complete your purchase. This helps us track your orders and provide better support.
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/auth?redirect=/checkout">Sign In to Continue</Link>
              </Button>
              <Button asChild variant="outline" className="w-full border-border hover:border-primary">
                <Link to="/shop">Continue Shopping</Link>
              </Button>
            </div>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="text-3xl font-heading text-foreground mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Add some products to checkout.</p>
          <Button asChild>
            <Link to="/shop">Continue Shopping</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>

          <h1 className="text-3xl md:text-4xl font-heading text-foreground mb-8">Checkout</h1>

          {/* Express Checkout Banner */}
          {savedAddress && !isExpressMode && !loadingSavedAddress && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 rounded-lg p-4 mb-8"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading text-foreground">Express Checkout</h3>
                    <p className="text-sm text-muted-foreground">
                      Use your saved address: {savedAddress.address}, {savedAddress.city}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleExpressCheckout}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Use Saved Address
                </Button>
              </div>
            </motion.div>
          )}

          {/* Express Mode Active Indicator */}
          {isExpressMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mb-8"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading text-emerald-500">Express Checkout Active</h3>
                  <p className="text-sm text-muted-foreground">
                    Your saved address has been applied. Just select payment and place your order!
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpressMode(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Edit Details
                </Button>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Left Column - Forms */}
              <div className="lg:col-span-2 space-y-8">
                {/* Contact Information */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-xl font-heading text-foreground mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                      1
                    </span>
                    Contact Information
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        required
                        className="mt-1 bg-input border-border"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+91 98765 43210"
                        required
                        className="mt-1 bg-input border-border"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-xl font-heading text-foreground mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                      2
                    </span>
                    Shipping Address
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="mt-1 bg-input border-border"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="mt-1 bg-input border-border"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Street Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        className="mt-1 bg-input border-border"
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="mt-1 bg-input border-border"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                        className="mt-1 bg-input border-border"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">PIN Code</Label>
                      <div className="relative mt-1">
                        <Input
                          id="zipCode"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          onBlur={(e) => handlePinCodeBlur(e.target.value)}
                          required
                          maxLength={6}
                          placeholder="6-digit PIN code"
                          className={`bg-input border-border ${isPinLoading ? "pr-10" : ""}`}
                        />
                        {isPinLoading && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter PIN to auto-fill city & state
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        required
                        className="mt-1 bg-input border-border"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div id="payment-section" className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-xl font-heading text-foreground mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                      3
                    </span>
                    Payment Method
                  </h2>

                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3 mb-6">
                    <div className="flex items-center space-x-3 bg-input border border-border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Smartphone className="w-5 h-5 text-primary" />
                        <div className="flex-1">
                          <span>UPI</span>
                          <p className="text-xs text-emerald-500 font-medium mt-0.5">
                            GPay, PhonePe, Paytm, QR Code • FREE Shipping
                          </p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 bg-input border border-border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                        <CreditCard className="w-5 h-5 text-primary" />
                        <div className="flex-1">
                          <span>Card / Netbanking</span>
                          <p className="text-xs text-emerald-500 font-medium mt-0.5">
                            Credit/Debit Cards, Net Banking • FREE Shipping
                          </p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 bg-input border border-border rounded-lg p-4 opacity-60 cursor-not-allowed">
                      <RadioGroupItem value="cod" id="cod" disabled />
                      <Label htmlFor="cod" className="flex items-center gap-2 cursor-not-allowed flex-1">
                        <Truck className="w-5 h-5 text-muted-foreground" />
                        <div className="flex-1">
                          <span className="text-muted-foreground">Cash on Delivery</span>
                          <p className="text-xs text-amber-500 font-medium mt-0.5">
                            Coming Soon
                          </p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
                    <Lock className="w-4 h-4" />
                    Your information is secured with SSL encryption
                  </div>
                </div>
              </div>

              {/* Right Column - Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
                  <h2 className="text-xl font-heading text-foreground mb-6">Order Summary</h2>

                  <div className="space-y-4 max-h-64 overflow-y-auto mb-6">
                    {items.map((item) => (
                      <div key={item.product.id} className="flex gap-4">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-foreground">{item.product.name}</h3>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm text-foreground">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* Coupon Input */}
                  <CouponInput />

                  <Separator className="my-4" />

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal ({totalItems} items)</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                    {bulkDiscountAmount > 0 && (
                      <div className="flex justify-between text-emerald-500">
                        <span>Bulk Discount ({bulkDiscountPercent}%)</span>
                        <span>-{formatPrice(bulkDiscountAmount)}</span>
                      </div>
                    )}
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-primary">
                        <span>Coupon Discount</span>
                        <span>-{formatPrice(couponDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Truck className="w-4 h-4" />
                        Shipping {totalPrice >= 999 && <span className="text-primary">(Free!)</span>}
                      </span>
                      <span>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between text-lg font-heading text-foreground mb-6">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(orderTotal)}</span>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    size="lg"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                        />
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Check className="w-5 h-5" />
                        Place Order
                      </span>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground mt-4">
                    By placing this order, you agree to our{" "}
                    <Link to="/terms" className="text-primary hover:underline">Terms & Conditions</Link>
                  </p>
                </div>
              </div>
            </div>
          </form>

          {/* Shipping Terms Dialog */}
          <ShippingTermsDialog
            open={showTermsDialog}
            onOpenChange={setShowTermsDialog}
            onConfirm={handleConfirmOrder}
            paymentMethod={paymentMethod}
            shippingCharge={shipping}
          />
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default memo(Checkout);

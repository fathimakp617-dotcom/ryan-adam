import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Truck, Check, Lock, LogIn } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CouponInput from "@/components/CouponInput";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { affiliateCode, appliedCoupon, calculateDiscount } = useAffiliate();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
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

  const shipping = totalPrice >= 999 ? 0 : 99;
  const discount = calculateDiscount(totalPrice);
  const orderTotal = totalPrice - discount + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (paymentMethod === "razorpay") {
      await handleRazorpayPayment();
    } else {
      await handleCODOrder();
    }
  };

  const handleCODOrder = async () => {
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
        description: `Order #${data.order.order_number}. You will receive a confirmation email shortly.`,
      });

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

  const handleRazorpayPayment = async () => {
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

      const options = {
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Rayn Adam",
        description: "Luxury Perfume Purchase",
        order_id: orderData.order.id,
        handler: async (response: any) => {
          await verifyAndCompleteOrder(response);
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#c9a962",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast({
              title: "Payment Cancelled",
              description: "Your payment was cancelled. You can try again.",
              variant: "destructive",
            });
          },
        },
      };

      const razorpay = new window.Razorpay(options);
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
                <Link to="/auth">Sign In to Continue</Link>
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
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        required
                        className="mt-1 bg-input border-border"
                      />
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
                <div className="bg-card border border-border rounded-lg p-6">
                  <h2 className="text-xl font-heading text-foreground mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                      3
                    </span>
                    Payment Method
                  </h2>

                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3 mb-6">
                    <div className="flex items-center space-x-3 bg-input border border-border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Truck className="w-5 h-5 text-primary" />
                        Cash on Delivery
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 bg-input border border-border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
                      <RadioGroupItem value="razorpay" id="razorpay" />
                      <Label htmlFor="razorpay" className="flex items-center gap-2 cursor-pointer flex-1">
                        <CreditCard className="w-5 h-5 text-primary" />
                        Pay Online (Razorpay)
                        <span className="ml-auto text-xs text-muted-foreground">UPI, Cards, Netbanking</span>
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
                      <span>Subtotal</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-primary">
                        <span>Discount</span>
                        <span>-{formatPrice(discount)}</span>
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
                    By placing this order, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;

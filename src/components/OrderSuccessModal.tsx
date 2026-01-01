import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X, Download, Mail, RefreshCw, Gift, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import OrderReceipt from "./OrderReceipt";

interface OrderData {
  order_number: string;
  customer_name: string;
  customer_email: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shipping_address: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  payment_method: string;
  created_at: string;
  user_id: string | null;
}

interface LoyaltyCoupon {
  code: string;
  discount_percent: number;
  is_bogo: boolean;
  expires_at: string;
}

const OrderSuccessModal = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const orderNumber = searchParams.get("order");
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loyaltyCoupon, setLoyaltyCoupon] = useState<LoyaltyCoupon | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (orderNumber) {
      fetchOrderData();
    }
  }, [orderNumber]);

  const fetchOrderData = async () => {
    if (!orderNumber) return;
    
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single();

      if (error) throw error;
      
      if (data) {
        setOrderData({
          order_number: data.order_number,
          customer_name: data.customer_name,
          customer_email: data.customer_email,
          items: data.items as OrderData['items'],
          subtotal: data.subtotal,
          discount: data.discount || 0,
          shipping: data.shipping || 0,
          total: data.total,
          shipping_address: data.shipping_address as OrderData['shipping_address'],
          payment_method: data.payment_method,
          created_at: data.created_at,
          user_id: data.user_id,
        });

        // If user is logged in, fetch their latest loyalty coupon
        if (data.user_id) {
          fetchLoyaltyCoupon(data.user_id);
        }
      }
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLoyaltyCoupon = async (userId: string) => {
    try {
      // Fetch the most recent unused loyalty coupon for this user
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('code, discount_percent, is_bogo, expires_at')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('current_uses', 0)
        .like('coupon_type', 'loyalty%')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && coupon) {
        setLoyaltyCoupon({
          code: coupon.code,
          discount_percent: coupon.discount_percent,
          is_bogo: coupon.is_bogo || false,
          expires_at: coupon.expires_at || '',
        });
      }
    } catch (error) {
      console.log("No loyalty coupon found");
    }
  };

  const handleCopyCoupon = () => {
    if (loyaltyCoupon) {
      navigator.clipboard.writeText(loyaltyCoupon.code);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Coupon code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResendEmail = async () => {
    if (!orderNumber) return;
    
    setIsResending(true);
    try {
      const { data, error } = await supabase.functions.invoke('resend-order-email', {
        body: { order_number: orderNumber },
      });

      if (error) throw error;
      
      toast({
        title: "Email Sent!",
        description: "Order confirmation email has been resent to your email address.",
      });
    } catch (error) {
      console.error("Error resending email:", error);
      toast({
        title: "Failed to resend email",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleClose = () => {
    searchParams.delete("order");
    setSearchParams(searchParams);
  };

  if (!orderNumber) return null;

  return (
    <AnimatePresence>
      {orderNumber && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-lg p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle className="w-10 h-10 text-primary" />
                </motion.div>

                <h2 className="text-2xl font-heading text-foreground mb-2">
                  Order Confirmed!
                </h2>
                <p className="text-muted-foreground mb-4">
                  Thank you for your purchase
                </p>

                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    Order Number
                  </p>
                  <p className="text-lg font-medium text-primary">{orderNumber}</p>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                  <Mail className="w-4 h-4" />
                  <span>Confirmation email sent</span>
                </div>

                {/* Loyalty Reward Coupon */}
                {loyaltyCoupon && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="w-5 h-5 text-primary" />
                      <p className="text-sm font-medium text-primary">Your Loyalty Reward!</p>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {loyaltyCoupon.is_bogo 
                        ? "Buy 1 Get 1 FREE on your next order!" 
                        : `${loyaltyCoupon.discount_percent}% off your next order!`}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-card border border-dashed border-primary/50 rounded-lg px-3 py-2">
                        <p className="text-sm font-mono font-bold text-foreground tracking-wider">
                          {loyaltyCoupon.code}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyCoupon}
                        className="border-primary/50 text-primary hover:bg-primary/10"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Single use only • Expires in 30 days
                    </p>
                  </motion.div>
                )}

                {isLoading ? (
                  <div className="flex justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : orderData ? (
                  <div className="space-y-3">
                    <Button
                      onClick={() => setShowReceipt(true)}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Receipt
                    </Button>
                    <Button
                      onClick={handleResendEmail}
                      variant="outline"
                      className="w-full border-border hover:border-primary"
                      disabled={isResending}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
                      {isResending ? 'Sending...' : 'Resend Email'}
                    </Button>
                    <Button
                      onClick={handleClose}
                      variant="ghost"
                      className="w-full"
                    >
                      Continue Shopping
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleClose}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Continue Shopping
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>

          {showReceipt && orderData && (
            <OrderReceipt
              orderNumber={orderData.order_number}
              customerName={orderData.customer_name}
              customerEmail={orderData.customer_email}
              items={orderData.items}
              subtotal={orderData.subtotal}
              discount={orderData.discount}
              shipping={orderData.shipping}
              total={orderData.total}
              shippingAddress={orderData.shipping_address}
              paymentMethod={orderData.payment_method}
              orderDate={orderData.created_at}
              onClose={() => setShowReceipt(false)}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default OrderSuccessModal;
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gift, Copy, Check, Loader2, Sparkles, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface LoyaltyCoupon {
  id: string;
  code: string;
  discount_percent: number;
  is_bogo: boolean;
  coupon_type: string;
  expires_at: string | null;
  current_uses: number;
  max_uses: number | null;
  is_active: boolean;
}

interface LoyaltyReward {
  order_count: number;
  last_coupon_order: number;
}

const LoyaltyCoupons = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<LoyaltyCoupon[]>([]);
  const [loyaltyInfo, setLoyaltyInfo] = useState<LoyaltyReward | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchLoyaltyCoupons();
      fetchLoyaltyInfo();
    }
  }, [user]);

  const fetchLoyaltyCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("user_id", user?.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Filter out expired and used coupons
      const validCoupons = (data || []).filter((coupon: LoyaltyCoupon) => {
        const isUsed = coupon.max_uses && coupon.current_uses >= coupon.max_uses;
        const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
        return !isUsed && !isExpired;
      });
      
      setCoupons(validCoupons);
    } catch (error) {
      console.error("Error fetching loyalty coupons:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLoyaltyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("loyalty_rewards")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setLoyaltyInfo(data);
    } catch (error) {
      console.error("Error fetching loyalty info:", error);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: "Copied!",
      description: "Coupon code copied to clipboard",
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getCouponLabel = (coupon: LoyaltyCoupon) => {
    if (coupon.is_bogo) return "BUY 1 GET 1";
    return `${coupon.discount_percent}% OFF`;
  };

  const getCouponDescription = (coupon: LoyaltyCoupon) => {
    if (coupon.coupon_type === "loyalty_20") return "Welcome reward for your 2nd order";
    if (coupon.coupon_type === "loyalty_10") return "Loyalty reward";
    if (coupon.coupon_type === "loyalty_bogo") return "Special 10th order reward!";
    return "Special discount";
  };

  const getNextReward = () => {
    if (!loyaltyInfo) return "Place your first order to start earning rewards!";
    const orderCount = loyaltyInfo.order_count;
    if (orderCount === 0) return "Place your first order to get 20% off your next purchase!";
    if (orderCount === 1) return "Use your 20% coupon on your next order!";
    if (orderCount >= 2 && orderCount < 9) return `${9 - orderCount} more orders until your Buy 1 Get 1 FREE reward!`;
    if (orderCount === 9) return "Use your BOGO coupon on your 10th order!";
    return "Thank you for being a loyal customer!";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Loyalty Progress */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-heading text-foreground">Loyalty Rewards</h3>
            <p className="text-sm text-muted-foreground">
              {loyaltyInfo ? `${loyaltyInfo.order_count} orders completed` : "Start earning rewards"}
            </p>
          </div>
        </div>
        
        {/* Progress indicator */}
        {loyaltyInfo && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Progress to BOGO reward</span>
              <span>{Math.min(loyaltyInfo.order_count, 10)}/10 orders</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((loyaltyInfo.order_count / 10) * 100, 100)}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
              />
            </div>
          </div>
        )}
        
        <p className="text-sm text-primary font-medium">{getNextReward()}</p>
      </div>

      {/* Available Coupons */}
      {coupons.length > 0 ? (
        <div className="space-y-4">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            Your Reward Coupons ({coupons.length})
          </h4>
          
          <div className="grid gap-3">
            {coupons.map((coupon) => (
              <motion.div
                key={coupon.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                  relative overflow-hidden border rounded-xl p-4
                  ${coupon.is_bogo 
                    ? "bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border-orange-500/30" 
                    : "bg-card border-border hover:border-primary/50"
                  }
                  transition-colors
                `}
              >
                {coupon.is_bogo && (
                  <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl">
                    SPECIAL
                  </div>
                )}
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm
                      ${coupon.is_bogo 
                        ? "bg-orange-500/20 text-orange-500" 
                        : "bg-primary/20 text-primary"
                      }
                    `}>
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`font-bold ${coupon.is_bogo ? "text-orange-500" : "text-primary"}`}>
                        {getCouponLabel(coupon)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getCouponDescription(coupon)}
                      </p>
                      {coupon.expires_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Expires: {new Date(coupon.expires_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="bg-muted/50 border border-dashed border-muted-foreground/30 rounded px-3 py-1.5">
                      <code className="text-xs font-mono text-foreground">{coupon.code}</code>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyCode(coupon.code)}
                      className="h-8 w-8 p-0"
                    >
                      {copiedCode === coupon.code ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No active coupons yet</p>
          <p className="text-sm mt-1">Place orders to earn loyalty rewards!</p>
        </div>
      )}

      {/* Rewards Info */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-2">
        <h4 className="font-medium text-foreground text-sm">How Loyalty Rewards Work</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• <span className="text-primary font-medium">After 1st order:</span> Get 20% off your 2nd order</li>
          <li>• <span className="text-primary font-medium">After 2nd-9th order:</span> Get 10% off your next order</li>
          <li>• <span className="text-orange-500 font-medium">10th order:</span> Buy 1 Get 1 FREE!</li>
        </ul>
      </div>
    </div>
  );
};

export default LoyaltyCoupons;

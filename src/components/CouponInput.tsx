import { useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, X, Check, Loader2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAffiliate } from "@/contexts/AffiliateContext";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

const CouponInput = forwardRef<HTMLDivElement>((_, ref) => {
  const {
    couponCode,
    setCouponCode,
    applyCoupon,
    removeCoupon,
    appliedCoupon,
    isLoading,
  } = useAffiliate();
  const { bulkDiscountPercent } = useCart();
  const [inputValue, setInputValue] = useState(couponCode);

  const isBulkDiscountActive = bulkDiscountPercent > 0;

  const handleApply = async () => {
    if (isBulkDiscountActive) {
      toast.error("Coupons cannot be combined with bulk discounts");
      return;
    }
    const result = await applyCoupon(inputValue);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleRemove = () => {
    removeCoupon();
    setInputValue("");
    toast.info("Coupon removed");
  };

  // If bulk discount is active, show a message instead of coupon input
  if (isBulkDiscountActive) {
    return (
      <div ref={ref} className="space-y-3">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Coupon / Affiliate Code</span>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
          <Gift className="w-4 h-4 text-emerald-500" />
          <span className="text-sm text-emerald-500">
            Bulk discount ({bulkDiscountPercent}% OFF) applied! Coupons not available with bulk orders.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="space-y-3">
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Coupon / Affiliate Code</span>
      </div>

      <AnimatePresence mode="wait">
        {appliedCoupon ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-lg p-3"
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {appliedCoupon.code} - {appliedCoupon.discountPercent}% OFF
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-2"
          >
            <Input
              placeholder="Enter code"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toUpperCase())}
              className="bg-input border-border uppercase"
            />
            <Button
              onClick={handleApply}
              disabled={isLoading || !inputValue.trim()}
              variant="outline"
              className="border-border hover:border-primary"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Apply"
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

CouponInput.displayName = "CouponInput";

export default CouponInput;

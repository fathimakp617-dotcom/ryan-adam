import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Truck, AlertTriangle, CreditCard } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface ShippingTermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  paymentMethod: string;
  shippingCharge: number;
}

const ShippingTermsDialog = ({
  open,
  onOpenChange,
  onConfirm,
  paymentMethod,
  shippingCharge,
}: ShippingTermsDialogProps) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [codTermsAccepted, setCodTermsAccepted] = useState(false);

  const isCOD = paymentMethod === "cod";
  // Only require COD terms checkbox if there's a shipping charge to prepay
  const canConfirm = termsAccepted && (!isCOD || shippingCharge === 0 || codTermsAccepted);

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm();
      // Reset states
      setTermsAccepted(false);
      setCodTermsAccepted(false);
    }
  };

  const handleClose = () => {
    setTermsAccepted(false);
    setCodTermsAccepted(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Truck className="h-5 w-5 text-primary" />
            Shipping & Payment Terms
          </DialogTitle>
          <DialogDescription>
            Please review and accept the terms before placing your order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Shipping Charge Notice */}
          {shippingCharge > 0 && (
            <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Additional Shipping Charge: ₹{shippingCharge}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This charge applies to orders below ₹999. Orders above ₹999 get FREE shipping.
                </p>
              </div>
            </div>
          )}

          {/* COD Special Notice */}
          {isCOD && shippingCharge > 0 && (
            <div className="flex items-start gap-3 p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
              <CreditCard className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Cash on Delivery - Shipping Prepayment Required
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  You will be redirected to <span className="text-orange-500 font-semibold">pay ₹{shippingCharge} shipping charge via Razorpay</span> first. 
                  After payment, your order will be confirmed and you'll pay the product amount (₹{shippingCharge > 0 ? "remaining" : "total"}) at delivery.
                </p>
              </div>
            </div>
          )}

          {isCOD && shippingCharge === 0 && (
            <div className="flex items-start gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
              <Truck className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Free Shipping - Cash on Delivery
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your order qualifies for free shipping! You'll pay the full amount at delivery.
                </p>
              </div>
            </div>
          )}

          {/* Terms Acceptance */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
              />
              <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                I have read and agree to the{" "}
                <Link to="/terms" target="_blank" className="text-primary hover:underline">
                  Terms & Conditions
                </Link>
                , including the shipping and return policies.
              </Label>
            </div>

            {isCOD && shippingCharge > 0 && (
              <div className="flex items-start gap-3">
                <Checkbox
                  id="cod-terms"
                  checked={codTermsAccepted}
                  onCheckedChange={(checked) => setCodTermsAccepted(checked === true)}
                />
                <Label htmlFor="cod-terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                  I understand that I will <span className="text-orange-500 font-medium">pay ₹{shippingCharge} shipping via Razorpay now</span>, and pay the product amount at delivery.
                </Label>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            Confirm & Place Order
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShippingTermsDialog;

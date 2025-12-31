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
  const canConfirm = termsAccepted && (!isCOD || codTermsAccepted);

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
          {isCOD && (
            <div className="flex items-start gap-3 p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
              <CreditCard className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Cash on Delivery Selected
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-orange-500 font-semibold">Important:</span> For COD orders, the shipping charge must be paid in advance before we dispatch your order. Our team will contact you to collect the shipping fee.
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

            {isCOD && (
              <div className="flex items-start gap-3">
                <Checkbox
                  id="cod-terms"
                  checked={codTermsAccepted}
                  onCheckedChange={(checked) => setCodTermsAccepted(checked === true)}
                />
                <Label htmlFor="cod-terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                  I understand that the <span className="text-orange-500 font-medium">shipping charge must be paid in advance</span> for Cash on Delivery orders, and my order will be shipped after payment confirmation.
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

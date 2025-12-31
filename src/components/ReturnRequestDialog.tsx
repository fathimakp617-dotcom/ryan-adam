import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RotateCcw, Package, AlertCircle, CheckCircle } from "lucide-react";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface ReturnRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  orderId: string;
  items: OrderItem[];
  onSubmit: (data: { reason: string; details: string }) => Promise<void>;
  isSubmitting: boolean;
}

const RETURN_REASONS = [
  { value: "damaged", label: "Product arrived damaged", description: "The item was broken or damaged during shipping" },
  { value: "wrong_item", label: "Wrong item received", description: "I received a different product than what I ordered" },
  { value: "not_as_described", label: "Not as described", description: "The product doesn't match the description or images" },
  { value: "quality_issue", label: "Quality issues", description: "The product quality is not up to expectations" },
  { value: "allergic_reaction", label: "Allergic reaction", description: "I had an allergic reaction to the product" },
  { value: "changed_mind", label: "Changed my mind", description: "I no longer want this product" },
  { value: "other", label: "Other reason", description: "A reason not listed above" },
];

const ReturnRequestDialog = ({
  isOpen,
  onClose,
  orderNumber,
  orderId,
  items,
  onSubmit,
  isSubmitting,
}: ReturnRequestDialogProps) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [details, setDetails] = useState("");
  const [step, setStep] = useState<"reason" | "details" | "confirm">("reason");

  const handleSubmit = async () => {
    if (!selectedReason) return;
    
    const reasonLabel = RETURN_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;
    await onSubmit({ reason: reasonLabel, details });
    
    // Reset form
    setSelectedReason("");
    setDetails("");
    setStep("reason");
  };

  const handleClose = () => {
    setSelectedReason("");
    setDetails("");
    setStep("reason");
    onClose();
  };

  const canProceedToDetails = selectedReason !== "";
  const canSubmit = selectedReason !== "" && (selectedReason !== "other" || details.trim() !== "");

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw size={20} className="text-primary" />
            Request Return
          </DialogTitle>
          <DialogDescription>
            Order #{orderNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Items being returned */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Package size={16} />
              Items in this order
            </h4>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{item.name} × {item.quantity}</span>
                  <span className="text-muted-foreground">₹{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {step === "reason" && (
            <>
              {/* Return Reason Selection */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Why are you returning this order?</Label>
                <RadioGroup value={selectedReason} onValueChange={setSelectedReason} className="space-y-3">
                  {RETURN_REASONS.map((reason) => (
                    <div
                      key={reason.value}
                      className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                        selectedReason === reason.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedReason(reason.value)}
                    >
                      <RadioGroupItem value={reason.value} id={reason.value} className="mt-0.5" />
                      <div className="flex-1">
                        <Label htmlFor={reason.value} className="font-medium cursor-pointer">
                          {reason.label}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-0.5">{reason.description}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={() => setStep("details")}
                  disabled={!canProceedToDetails}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
            </>
          )}

          {step === "details" && (
            <>
              {/* Additional Details */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle size={14} className="text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Selected: {RETURN_REASONS.find(r => r.value === selectedReason)?.label}
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor="return-details" className="text-base font-semibold mb-2 block">
                  Additional Details {selectedReason === "other" && <span className="text-destructive">*</span>}
                </Label>
                <Textarea
                  id="return-details"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Please provide more details about your return request. This helps us process your request faster."
                  className="min-h-[120px]"
                  required={selectedReason === "other"}
                />
                {selectedReason === "other" && !details.trim() && (
                  <p className="text-xs text-destructive mt-1">
                    Please provide details for your return reason
                  </p>
                )}
              </div>

              {/* Policy Notice */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle size={20} className="text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">Return Policy</p>
                    <ul className="text-muted-foreground space-y-1">
                      <li>• Returns must be initiated within 7 days of delivery</li>
                      <li>• Products must be unused and in original packaging</li>
                      <li>• Refunds are processed within 5-7 business days after approval</li>
                      <li>• Our team will contact you with pickup/shipping instructions</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("reason")} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep("confirm")} disabled={!canSubmit} className="flex-1">
                  Review Request
                </Button>
              </div>
            </>
          )}

          {step === "confirm" && (
            <>
              {/* Confirmation Summary */}
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Return Reason</p>
                    <p className="font-medium text-foreground">
                      {RETURN_REASONS.find(r => r.value === selectedReason)?.label}
                    </p>
                  </div>
                  {details && (
                    <div>
                      <p className="text-sm text-muted-foreground">Additional Details</p>
                      <p className="text-foreground">{details}</p>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <p className="text-sm text-yellow-600 dark:text-yellow-500">
                    <strong>Please note:</strong> Once submitted, our team will review your request and contact you within 24-48 hours with next steps.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep("details")} className="flex-1" disabled={isSubmitting}>
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    <>
                      <RotateCcw size={18} className="mr-2" />
                      Submit Return Request
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReturnRequestDialog;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { IndianRupee, Loader2, Building2, Smartphone } from "lucide-react";

interface WithdrawalRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affiliate: {
    id: string;
    total_earnings: number;
    email: string;
  };
  userId: string;
  userPhone?: string | null;
  userEmail: string;
  onSuccess: () => void;
}

export default function WithdrawalRequestDialog({
  open,
  onOpenChange,
  affiliate,
  userId,
  userPhone,
  userEmail,
  onSuccess,
}: WithdrawalRequestDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "upi">("bank_transfer");
  
  // Form state
  const [amount, setAmount] = useState(affiliate.total_earnings.toString());
  const [phone, setPhone] = useState(userPhone || "");
  const [email, setEmail] = useState(userEmail);
  
  // Bank details
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  
  // UPI details
  const [upiId, setUpiId] = useState("");

  const handleSubmit = async () => {
    // Validation
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 500) {
      toast({
        title: "Invalid Amount",
        description: "Minimum withdrawal amount is ₹500",
        variant: "destructive",
      });
      return;
    }

    if (amountNum > affiliate.total_earnings) {
      toast({
        title: "Insufficient Balance",
        description: "You cannot withdraw more than your available balance",
        variant: "destructive",
      });
      return;
    }

    if (!phone || phone.length < 10) {
      toast({
        title: "Phone Required",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "bank_transfer") {
      if (!bankName || !accountNumber || !ifscCode || !accountHolderName) {
        toast({
          title: "Bank Details Required",
          description: "Please fill in all bank details",
          variant: "destructive",
        });
        return;
      }
      if (accountNumber !== confirmAccountNumber) {
        toast({
          title: "Account Number Mismatch",
          description: "Account numbers do not match",
          variant: "destructive",
        });
        return;
      }
    } else if (paymentMethod === "upi") {
      if (!upiId || !upiId.includes("@")) {
        toast({
          title: "Invalid UPI ID",
          description: "Please enter a valid UPI ID (e.g., name@upi)",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("manage-withdrawals", {
        body: {
          action: "create",
          affiliate_id: affiliate.id,
          user_id: userId,
          amount: amountNum,
          payment_method: paymentMethod,
          bank_name: paymentMethod === "bank_transfer" ? bankName : null,
          account_number: paymentMethod === "bank_transfer" ? accountNumber : null,
          ifsc_code: paymentMethod === "bank_transfer" ? ifscCode : null,
          account_holder_name: paymentMethod === "bank_transfer" ? accountHolderName : null,
          upi_id: paymentMethod === "upi" ? upiId : null,
          phone,
          email,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Request Submitted",
        description: "Your withdrawal request has been submitted and is pending approval.",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Withdrawal request error:", error);
      toast({
        title: "Request Failed",
        description: error.message || "Failed to submit withdrawal request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-green-500" />
            Withdraw Earnings
          </DialogTitle>
          <DialogDescription>
            Available balance: ₹{affiliate.total_earnings.toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              min="500"
              max={affiliate.total_earnings}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount (min ₹500)"
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "bank_transfer" | "upi")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Bank Transfer
                  </div>
                </SelectItem>
                <SelectItem value="upi">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    UPI
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bank Transfer Details */}
          {paymentMethod === "bank_transfer" && (
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="accountHolderName">Account Holder Name</Label>
                <Input
                  id="accountHolderName"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="As per bank records"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g., State Bank of India"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter account number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmAccountNumber">Confirm Account Number</Label>
                <Input
                  id="confirmAccountNumber"
                  value={confirmAccountNumber}
                  onChange={(e) => setConfirmAccountNumber(e.target.value)}
                  placeholder="Re-enter account number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifscCode">IFSC Code</Label>
                <Input
                  id="ifscCode"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g., SBIN0001234"
                  maxLength={11}
                />
              </div>
            </div>
          )}

          {/* UPI Details */}
          {paymentMethod === "upi" && (
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="upiId">UPI ID</Label>
                <Input
                  id="upiId"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g., yourname@upi"
                />
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium text-sm text-foreground">Contact Information</h4>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Your phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <IndianRupee className="h-4 w-4 mr-2" />
                Request Withdrawal
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

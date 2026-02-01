import { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { User, X, Gift, Zap, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

const POPUP_STORAGE_KEY = "signup_prompt_dismissed";
const POPUP_DELAY_MS = 15000; // Show after 15 seconds of browsing

const SignUpPromptPopup = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't show if user is logged in or still loading
    if (isLoading || user) return;

    // Check if popup was dismissed recently (within 3 days)
    const dismissed = localStorage.getItem(POPUP_STORAGE_KEY);
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const now = Date.now();
      const daysElapsed = (now - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysElapsed < 3) return;
    }

    // Show popup after delay
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, POPUP_DELAY_MS);

    return () => clearTimeout(timer);
  }, [user, isLoading]);

  const handleDismiss = () => {
    localStorage.setItem(POPUP_STORAGE_KEY, Date.now().toString());
    setIsOpen(false);
  };

  const handleSignUp = () => {
    handleDismiss();
    navigate("/auth");
  };

  // Don't render if user is logged in
  if (user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
            <User className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            Join RAYN ADAM
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create an account for exclusive benefits and faster checkout!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Express Checkout</p>
              <p className="text-muted-foreground text-xs">
                Save your address for one-click ordering
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <ShoppingBag className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Order Tracking</p>
              <p className="text-muted-foreground text-xs">
                Track your orders and view purchase history
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Gift className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Loyalty Rewards</p>
              <p className="text-muted-foreground text-xs">
                Earn exclusive discounts with every purchase
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleSignUp}
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium"
            >
              <User className="w-4 h-4 mr-2" />
              Create Free Account
            </Button>
            <Button
              variant="ghost"
              onClick={handleDismiss}
              className="w-full h-10 text-muted-foreground hover:text-foreground text-sm"
            >
              Continue as Guest
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

SignUpPromptPopup.displayName = "SignUpPromptPopup";

export default SignUpPromptPopup;

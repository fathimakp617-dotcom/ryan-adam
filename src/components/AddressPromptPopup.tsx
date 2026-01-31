import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const POPUP_STORAGE_KEY = "address_prompt_dismissed";
const POPUP_DELAY_MS = 5000; // Show after 5 seconds

const AddressPromptPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAddress, setHasAddress] = useState(true);
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAddress = async () => {
      if (isLoading || !user) return;

      // Check if popup was dismissed recently (within 24 hours)
      const dismissed = localStorage.getItem(POPUP_STORAGE_KEY);
      if (dismissed) {
        const dismissedTime = parseInt(dismissed, 10);
        const now = Date.now();
        const hoursElapsed = (now - dismissedTime) / (1000 * 60 * 60);
        if (hoursElapsed < 24) return;
      }

      // Check if user has a saved address
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("saved_address")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking address:", error);
        return;
      }

      const savedAddress = profile?.saved_address as Record<string, string> | null;
      const addressExists = savedAddress && 
        (savedAddress.addressLine1 || savedAddress.city || savedAddress.pincode);

      setHasAddress(!!addressExists);

      // Show popup after delay if no address
      if (!addressExists) {
        console.log("No address found, showing popup in 5s");
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, POPUP_DELAY_MS);
        return () => clearTimeout(timer);
      }
    };

    checkAddress();
  }, [user, isLoading]);

  const handleDismiss = () => {
    localStorage.setItem(POPUP_STORAGE_KEY, Date.now().toString());
    setIsOpen(false);
  };

  const handleAddAddress = () => {
    handleDismiss();
    navigate("/account");
  };

  // Don't render if user has address or not logged in
  if (hasAddress || !user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md border-primary/20 bg-gradient-to-br from-background to-primary/5">
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            Add Your Shipping Address
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Save your address for a faster, seamless checkout experience!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Zap className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Express Checkout</p>
              <p className="text-muted-foreground text-xs">
                Skip entering your address every time you order
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleAddAddress}
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Add My Address
            </Button>
            <Button
              variant="ghost"
              onClick={handleDismiss}
              className="w-full h-11 text-muted-foreground hover:text-foreground"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddressPromptPopup;

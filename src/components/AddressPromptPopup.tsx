import { useState, useEffect, useRef, memo } from "react";
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
const JUST_LOGGED_IN_KEY = "rayn_just_logged_in";

const AddressPromptPopup = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAddress, setHasAddress] = useState(true);
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const previousUserRef = useRef<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    
    const checkAddress = async () => {
      if (isLoading || !user) {
        previousUserRef.current = null;
        return;
      }

      // Detect if user just logged in (user id changed from null to a value)
      const justLoggedIn = previousUserRef.current === null && user.id;
      const wasMarkedAsJustLoggedIn = sessionStorage.getItem(JUST_LOGGED_IN_KEY) === "true";
      
      // Update previous user ref
      previousUserRef.current = user.id;

      // Check if popup was dismissed recently (within 24 hours) - but skip this check if just logged in
      const dismissed = localStorage.getItem(POPUP_STORAGE_KEY);
      if (dismissed && !wasMarkedAsJustLoggedIn && !justLoggedIn) {
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
        (savedAddress.addressLine1 || savedAddress.address || savedAddress.city || savedAddress.pincode || savedAddress.zipCode);

      setHasAddress(!!addressExists);

      // If no address exists, show the popup
      if (!addressExists) {
        // Clear the flag now that we've processed it
        if (wasMarkedAsJustLoggedIn) {
          sessionStorage.removeItem(JUST_LOGGED_IN_KEY);
        }
        
        // If just logged in (either by flag or by detection), show popup immediately
        if (wasMarkedAsJustLoggedIn || justLoggedIn) {
          console.log("Just logged in, showing address popup immediately");
          setIsOpen(true);
          return;
        }
        
        // Otherwise, show popup after 5 second delay
        console.log("No address found, showing popup in 5s");
        timer = setTimeout(() => {
          setIsOpen(true);
        }, POPUP_DELAY_MS);
      } else {
        // Clear the just logged in flag if address exists
        sessionStorage.removeItem(JUST_LOGGED_IN_KEY);
      }
    };

    checkAddress();
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [user, isLoading]);

  const handleDismiss = () => {
    localStorage.setItem(POPUP_STORAGE_KEY, Date.now().toString());
    setIsOpen(false);
  };

  const handleAddAddress = () => {
    handleDismiss();
    navigate("/account?tab=address");
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
            Save Your Shipping Address
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Save your address now for a faster, seamless checkout experience!
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
});

AddressPromptPopup.displayName = "AddressPromptPopup";

// Export a function to mark that user just logged in
export const markJustLoggedIn = () => {
  sessionStorage.setItem(JUST_LOGGED_IN_KEY, "true");
};

export default AddressPromptPopup;

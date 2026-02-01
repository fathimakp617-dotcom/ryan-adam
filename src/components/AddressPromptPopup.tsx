import { useState, useEffect, useRef, memo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { MapPin, Zap, Building, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { usePinCodeLookup } from "@/hooks/usePinCodeLookup";
import { useToast } from "@/hooks/use-toast";

const POPUP_STORAGE_KEY = "address_prompt_dismissed";
const JUST_LOGGED_IN_KEY = "rayn_just_logged_in";

const AddressPromptPopup = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAddress, setHasAddress] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [addressForm, setAddressForm] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });
  const [postOfficeName, setPostOfficeName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const previousUserRef = useRef<string | null>(null);
  const { toast } = useToast();
  const { lookupPinCode, isLoading: isPinLoading } = usePinCodeLookup();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    
    const checkAddress = async () => {
      if (isLoading || !user) {
        previousUserRef.current = null;
        return;
      }

      // Don't show on account page (user might be there to add address)
      if (location.pathname === "/account") {
        return;
      }

      // Detect if user just logged in
      const justLoggedIn = previousUserRef.current === null && user.id;
      const wasMarkedAsJustLoggedIn = sessionStorage.getItem(JUST_LOGGED_IN_KEY) === "true";
      
      previousUserRef.current = user.id;

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
        if (wasMarkedAsJustLoggedIn) {
          sessionStorage.removeItem(JUST_LOGGED_IN_KEY);
        }
        
        // Show popup immediately for logged-in users without address
        if (wasMarkedAsJustLoggedIn || justLoggedIn) {
          console.log("Just logged in without address, showing mandatory popup");
          setIsOpen(true);
          return;
        }
        
        // For existing sessions, show after short delay
        timer = setTimeout(() => {
          setIsOpen(true);
        }, 2000);
      } else {
        sessionStorage.removeItem(JUST_LOGGED_IN_KEY);
      }
    };

    checkAddress();
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [user, isLoading, location.pathname]);

  const handlePincodeChange = useCallback(async (value: string) => {
    const cleanValue = value.replace(/\D/g, "").slice(0, 6);
    setAddressForm(prev => ({ ...prev, pincode: cleanValue }));
    setPostOfficeName("");
    setErrors(prev => ({ ...prev, pincode: "" }));

    if (cleanValue.length === 6) {
      const pinData = await lookupPinCode(cleanValue);
      if (pinData) {
        setAddressForm(prev => ({
          ...prev,
          city: pinData.city,
          state: pinData.state,
          country: pinData.country,
        }));
        setPostOfficeName(pinData.postOffice);
      }
    }
  }, [lookupPinCode]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!addressForm.addressLine1.trim()) newErrors.addressLine1 = "Address is required";
    if (!addressForm.city.trim()) newErrors.city = "City is required";
    if (!addressForm.state.trim()) newErrors.state = "State is required";
    if (!addressForm.pincode.trim()) {
      newErrors.pincode = "PIN code is required";
    } else if (!/^\d{6}$/.test(addressForm.pincode)) {
      newErrors.pincode = "Enter a valid 6-digit PIN code";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveAddress = async () => {
    if (!validateForm() || !user) return;

    setIsSaving(true);
    try {
      const addressData = {
        addressLine1: addressForm.addressLine1,
        addressLine2: addressForm.addressLine2,
        city: addressForm.city,
        state: addressForm.state,
        zipCode: addressForm.pincode,
        country: addressForm.country,
      };

      const { error } = await supabase
        .from("profiles")
        .update({ saved_address: addressData })
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Address Saved!",
        description: "Your shipping address has been saved for faster checkout.",
      });

      setHasAddress(true);
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving address:", error);
      toast({
        title: "Error",
        description: "Failed to save address. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoToAccount = () => {
    setIsOpen(false);
    navigate("/account?tab=address");
  };

  // Don't render if user has address or not logged in
  if (hasAddress || !user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md border-primary/20 bg-gradient-to-br from-background to-primary/5"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            Complete Your Profile
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add your shipping address for express checkout on future orders!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Zap className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-foreground">One-Time Setup</p>
              <p className="text-muted-foreground text-xs">
                Save once, checkout instantly every time
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="popup_addressLine1" className="text-sm">Address Line 1 <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="popup_addressLine1"
                  value={addressForm.addressLine1}
                  onChange={(e) => {
                    setAddressForm(prev => ({ ...prev, addressLine1: e.target.value }));
                    setErrors(prev => ({ ...prev, addressLine1: "" }));
                  }}
                  className="pl-10 h-11 bg-background/50"
                  placeholder="House/Flat No., Building"
                />
              </div>
              {errors.addressLine1 && <p className="text-destructive text-xs">{errors.addressLine1}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="popup_addressLine2" className="text-sm">Address Line 2</Label>
              <div className="relative">
                <MapIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="popup_addressLine2"
                  value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm(prev => ({ ...prev, addressLine2: e.target.value }))}
                  className="pl-10 h-11 bg-background/50"
                  placeholder="Street, Area, Landmark"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="popup_pincode" className="text-sm">PIN Code <span className="text-destructive">*</span></Label>
              <Input
                id="popup_pincode"
                value={addressForm.pincode}
                onChange={(e) => handlePincodeChange(e.target.value)}
                className="h-11 bg-background/50"
                placeholder="6-digit PIN code"
                maxLength={6}
              />
              {postOfficeName && (
                <div className="p-2 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-2">
                  <MapPin size={14} className="text-primary" />
                  <span className="text-xs text-foreground">{postOfficeName} Post Office</span>
                </div>
              )}
              {errors.pincode && <p className="text-destructive text-xs">{errors.pincode}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="popup_city" className="text-sm">City <span className="text-destructive">*</span></Label>
                <Input
                  id="popup_city"
                  value={addressForm.city}
                  onChange={(e) => {
                    setAddressForm(prev => ({ ...prev, city: e.target.value }));
                    setErrors(prev => ({ ...prev, city: "" }));
                  }}
                  className="h-11 bg-background/50"
                  placeholder="City"
                />
                {errors.city && <p className="text-destructive text-xs">{errors.city}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="popup_state" className="text-sm">State <span className="text-destructive">*</span></Label>
                <Input
                  id="popup_state"
                  value={addressForm.state}
                  onChange={(e) => {
                    setAddressForm(prev => ({ ...prev, state: e.target.value }));
                    setErrors(prev => ({ ...prev, state: "" }));
                  }}
                  className="h-11 bg-background/50"
                  placeholder="State"
                />
                {errors.state && <p className="text-destructive text-xs">{errors.state}</p>}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleSaveAddress}
              disabled={isSaving}
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  Save Address
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={handleGoToAccount}
              className="w-full h-10 text-muted-foreground hover:text-foreground text-sm"
            >
              Go to Account Settings
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

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Sparkles, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const POPUP_SHOWN_KEY = "rayn_signup_popup_shown";
const POPUP_DELAY = 5000; // 5 seconds

const SignupIncentivePopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Don't show if user is logged in or already shown in this session
    if (isLoggedIn) return;
    
    const hasShown = sessionStorage.getItem(POPUP_SHOWN_KEY);
    if (hasShown) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
      sessionStorage.setItem(POPUP_SHOWN_KEY, "true");
    }, POPUP_DELAY);

    return () => clearTimeout(timer);
  }, [isLoggedIn]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSignup = () => {
    setIsOpen(false);
    navigate("/auth?mode=signup");
  };

  const handleLogin = () => {
    setIsOpen(false);
    navigate("/auth?mode=login");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={handleClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative w-full max-w-md bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20 rounded-2xl shadow-2xl pointer-events-auto overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-secondary/20 to-transparent rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
              
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="relative p-8 text-center">
                {/* Icon */}
                <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                  <Gift className="w-10 h-10 text-primary-foreground" />
                </div>

                {/* Heading */}
                <h2 className="text-2xl md:text-3xl font-heading font-bold mb-3">
                  <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                    Exclusive Welcome Offer!
                  </span>
                </h2>

                {/* Offers */}
                <div className="space-y-4 mb-6">
                  {/* Guaranteed offer */}
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Percent className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground">Flat 10% OFF</p>
                      <p className="text-sm text-muted-foreground">On your first order</p>
                    </div>
                  </div>

                  {/* Bonus offer */}
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/20">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-secondary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground">+ Chance to Win 50% OFF</p>
                      <p className="text-sm text-muted-foreground">Lucky members get extra rewards!</p>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleSignup}
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg"
                  >
                    Create Account & Get Coupon
                  </Button>
                  
                  <Button
                    onClick={handleLogin}
                    variant="outline"
                    className="w-full h-11 text-sm border-primary/30 hover:bg-primary/5"
                  >
                    Already have an account? Login
                  </Button>
                </div>

                {/* Skip text */}
                <button
                  onClick={handleClose}
                  className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SignupIncentivePopup;

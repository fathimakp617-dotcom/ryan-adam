import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateWhatsAppLinkSimple } from "@/lib/whatsapp";

const UnderConstructionModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already seen the modal in this session
    const hasSeenModal = sessionStorage.getItem("seenConstructionModal");
    if (!hasSeenModal) {
      // Small delay before showing modal
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("seenConstructionModal", "true");
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
            onClick={handleClose}
            className="fixed inset-0 bg-background/90 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-md bg-card border border-border/50 p-8 sm:p-10 text-center">
              {/* Gold corner accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/60" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/60" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/60" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/60" />

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Construction className="w-8 h-8 text-primary" />
              </div>

              {/* Content */}
              <h2 className="text-2xl sm:text-3xl font-heading tracking-tight mb-3">
                Website Under Construction
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                We're working hard to bring you an amazing shopping experience. 
                In the meantime, you can still purchase our luxury fragrances via WhatsApp!
              </p>

              {/* WhatsApp Button */}
              <a
                href={generateWhatsAppLinkSimple()}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button
                  size="lg"
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-6 text-sm tracking-widest font-medium transition-all duration-300 hover:shadow-[0_0_30px_rgba(37,211,102,0.4)] flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  SHOP ON WHATSAPP
                </Button>
              </a>

              {/* Continue browsing */}
              <button
                onClick={handleClose}
                className="mt-4 text-sm text-muted-foreground hover:text-primary transition-colors tracking-wider"
              >
                Continue Browsing
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UnderConstructionModal;

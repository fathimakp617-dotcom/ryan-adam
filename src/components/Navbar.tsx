import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingBag, Heart, User, Construction, MessageCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { Button } from "@/components/ui/button";
import { generateWhatsAppLinkSimple } from "@/lib/whatsapp";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showConstructionModal, setShowConstructionModal] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const { totalItems } = useCart();
  const { totalItems: wishlistItems } = useWishlist();

  const handleShowConstruction = () => {
    setShowConstructionModal(true);
    setIsOpen(false);
  };

  const navLinks = [
    { name: "Home", href: isHomePage ? "#home" : "/", isRoute: !isHomePage },
    { name: "Shop", href: "/shop", isRoute: true },
    { name: "Collection", href: isHomePage ? "#collection" : "/#collection", isRoute: !isHomePage },
    { name: "About", href: isHomePage ? "#about" : "/#about", isRoute: !isHomePage },
    { name: "Contact", href: isHomePage ? "#contact" : "/#contact", isRoute: !isHomePage },
  ];


  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/30"
    >
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl md:text-3xl font-heading tracking-normal text-gold-gradient">
              RAYN ADAM
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-sm tracking-widest text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  {link.name}
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm tracking-widest text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  {link.name}
                </a>
              )
            )}
            
            {/* Wishlist */}
            <button
              onClick={handleShowConstruction}
              className="relative p-2 border border-border/50 hover:border-primary text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              <Heart size={18} />
              {wishlistItems > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {wishlistItems}
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              onClick={handleShowConstruction}
              className="relative p-2 border border-border/50 hover:border-primary text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              <ShoppingBag size={18} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Account */}
            <button
              onClick={handleShowConstruction}
              className="p-2 border border-border/50 hover:border-primary text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              <User size={18} />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button onClick={handleShowConstruction} className="relative p-2 text-foreground">
              <Heart size={20} />
              {wishlistItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {wishlistItems}
                </span>
              )}
            </button>
            <button onClick={handleShowConstruction} className="relative p-2 text-foreground">
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-foreground"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-t border-border/30"
          >
            <div className="container mx-auto px-6 py-6 flex flex-col gap-6">
              {navLinks.map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-sm tracking-widest text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-sm tracking-widest text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    {link.name}
                  </a>
                )
              )}
              
              {/* Mobile Account Section */}
              <div className="border-t border-border/30 pt-4 mt-2">
                <button
                  onClick={handleShowConstruction}
                  className="flex items-center gap-2 text-sm tracking-widest text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  <User size={16} />
                  My Account
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Under Construction Modal - using portal for proper centering */}
      {createPortal(
        <AnimatePresence>
          {showConstructionModal && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowConstructionModal(false)}
                className="fixed inset-0 bg-background/90 backdrop-blur-sm z-[9999]"
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
                onClick={() => setShowConstructionModal(false)}
              >
                <div 
                  className="relative w-full max-w-md bg-card border border-border/50 p-8 sm:p-10 text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Gold corner accents */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/60" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/60" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/60" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/60" />

                  {/* Close button */}
                  <button
                    onClick={() => setShowConstructionModal(false)}
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
                  <p className="text-muted-foreground mb-6 leading-relaxed">
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
                    onClick={() => setShowConstructionModal(false)}
                    className="mt-4 text-sm text-muted-foreground hover:text-primary transition-colors tracking-wider"
                  >
                    Continue Browsing
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.nav>
  );
};

export default Navbar;

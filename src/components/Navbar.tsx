import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingBag, Heart, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const { totalItems, openCart } = useCart();
  const { totalItems: wishlistItems } = useWishlist();

  const navLinks = [
    { name: "Home", href: isHomePage ? "#home" : "/", isRoute: !isHomePage },
    { name: "Shop", href: "/shop", isRoute: true },
    { name: "Collection", href: isHomePage ? "#collection" : "/#collection", isRoute: !isHomePage },
    { name: "About", href: isHomePage ? "#about" : "/#about", isRoute: !isHomePage },
    { name: "Contact", href: isHomePage ? "#contact" : "/#contact", isRoute: !isHomePage },
  ];


  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border/30">
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
            <Link
              to="/wishlist"
              className="relative p-2 border border-border/50 hover:border-primary text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              <Heart size={18} />
              {wishlistItems > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {wishlistItems}
                </span>
              )}
            </Link>

            {/* Cart */}
            <button
              onClick={() => openCart()}
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
            <Link
              to="/account"
              className="p-2 border border-border/50 hover:border-primary text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              <User size={18} />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <Link to="/wishlist" className="relative p-2 text-foreground">
              <Heart size={20} />
              {wishlistItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {wishlistItems}
                </span>
              )}
            </Link>
            <button onClick={() => openCart()} className="relative p-2 text-foreground">
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
                <Link
                  to="/account"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-sm tracking-widest text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  <User size={16} />
                  My Account
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

Navbar.displayName = "Navbar";

export default memo(Navbar);
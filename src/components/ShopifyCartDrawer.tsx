import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingBag, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useShopifyCartStore } from "@/stores/shopifyCartStore";
import { formatShopifyPrice } from "@/lib/shopify";
import { toast } from "sonner";

interface ShopifyCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShopifyCartDrawer = ({ isOpen, onClose }: ShopifyCartDrawerProps) => {
  const { items, isLoading, updateQuantity, removeItem, getTotalItems, getTotalPrice, createCheckout, clearCart } = useShopifyCartStore();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const handleCheckout = async () => {
    try {
      const checkoutUrl = await createCheckout();
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
        onClose();
      } else {
        toast.error("Failed to create checkout", {
          position: "top-center",
        });
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      toast.error("Checkout failed. Please try again.", {
        position: "top-center",
      });
    }
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
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-heading tracking-wider">YOUR CART</h2>
                <span className="text-sm text-muted-foreground">({totalItems} items)</span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-muted transition-colors rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground mb-4">Your cart is empty</p>
                  <Button onClick={onClose} asChild variant="outline">
                    <Link to="/shop">Continue Shopping</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => {
                    const productNode = item.product.node;
                    const firstImage = productNode.images.edges[0]?.node;
                    
                    return (
                      <motion.div
                        key={item.variantId}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="flex gap-4 pb-6 border-b border-border/30"
                      >
                        <Link 
                          to={`/shopify-product/${productNode.handle}`} 
                          onClick={onClose}
                          className="w-24 h-24 flex-shrink-0 bg-muted overflow-hidden rounded-lg"
                        >
                          {firstImage ? (
                            <img
                              src={firstImage.url}
                              alt={productNode.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
                            </div>
                          )}
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link 
                            to={`/shopify-product/${productNode.handle}`} 
                            onClick={onClose}
                            className="font-heading text-sm tracking-wider hover:text-primary transition-colors line-clamp-2"
                          >
                            {productNode.title}
                          </Link>
                          {item.variantTitle !== "Default Title" && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.variantTitle}
                            </p>
                          )}
                          <p className="text-primary mt-2">
                            {formatShopifyPrice(item.price.amount, item.price.currencyCode)}
                          </p>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center border border-border/50 rounded-lg overflow-hidden">
                              <button
                                onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                                className="p-2 hover:bg-muted transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                                className="p-2 hover:bg-muted transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeItem(item.variantId)}
                              className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border/50 p-6 space-y-4 bg-background">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-lg font-heading">
                    {formatShopifyPrice(totalPrice.toString(), items[0]?.price.currencyCode || 'INR')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Shipping & taxes calculated at checkout
                </p>
                <Button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-sm tracking-widest transition-all duration-300 hover:shadow-[0_0_30px_hsl(35_49%_44%_/_0.4)]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Checkout...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      CHECKOUT WITH SHOPIFY
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  asChild
                  className="w-full border-border/50"
                >
                  <Link to="/shop">Continue Shopping</Link>
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShopifyCartDrawer;

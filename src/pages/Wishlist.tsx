import { memo } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/data/products";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";
import { toast } from "sonner";

const Wishlist = () => {
  const { items, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (product: typeof items[0]) => {
    addToCart(product);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <>
      <Helmet>
        <title>Wishlist | Rayn Adam Luxury Perfumes</title>
        <meta name="description" content="Your saved fragrances at Rayn Adam Luxury Perfumes." />
      </Helmet>

      <main className="min-h-screen bg-background relative z-10">
        <Navbar />

        <section className="pt-32 pb-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-12"
            >
              <motion.div variants={fadeInUp} className="text-center">
                <p className="text-sm tracking-[0.3em] text-primary mb-4">MY WISHLIST</p>
                <h1 className="text-4xl md:text-5xl font-heading tracking-tight">
                  Saved Fragrances
                </h1>
                <p className="text-muted-foreground mt-4">
                  {items.length} {items.length === 1 ? "item" : "items"} in your wishlist
                </p>
              </motion.div>

              {items.length === 0 ? (
                <motion.div variants={fadeInUp} className="text-center py-20">
                  <Heart className="w-20 h-20 text-muted-foreground/20 mx-auto mb-6" />
                  <h2 className="text-2xl font-heading mb-4">Your wishlist is empty</h2>
                  <p className="text-muted-foreground mb-8">
                    Save your favorite fragrances to revisit them later
                  </p>
                  <Button asChild className="bg-primary hover:bg-primary/90">
                    <Link to="/shop">Explore Collection</Link>
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  variants={staggerContainer}
                  className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {items.map((product) => (
                    <motion.div
                      key={product.id}
                      variants={staggerItem}
                      className="group bg-card/50 border border-border/50 overflow-hidden"
                    >
                      <Link to={`/product/${product.id}`} className="block relative aspect-square overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </Link>

                      <div className="p-4">
                        <Link to={`/product/${product.id}`}>
                          <p className="text-xs tracking-[0.2em] text-primary mb-1">
                            {product.category.toUpperCase()}
                          </p>
                          <h3 className="font-heading tracking-wider text-lg group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                        </Link>
                        <p className="text-muted-foreground text-sm mt-1">{product.tagline}</p>
                        <p className="text-primary font-heading text-lg mt-2">
                          {formatPrice(product.price)}
                        </p>

                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => handleAddToCart(product)}
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                            size="sm"
                          >
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Add to Cart
                          </Button>
                          <Button
                            onClick={() => removeFromWishlist(product.id)}
                            variant="outline"
                            size="sm"
                            className="border-border/50 hover:border-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
};

export default memo(Wishlist);
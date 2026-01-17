import { useState, useEffect, memo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, Share2, Truck, Shield, RotateCcw, Star, ShoppingBag, PenLine, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingParticles from "@/components/FloatingParticles";
import ProductReviews from "@/components/ProductReviews";
import RelatedProducts from "@/components/RelatedProducts";
import PageTransition from "@/components/PageTransition";
import { getProductById, formatPrice, products } from "@/data/products";
import { useCart, BULK_DISCOUNT_TIERS } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { fadeInUp, fadeInLeft, staggerContainer, staggerItem } from "@/lib/animations";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";


const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = getProductById(id || "");
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const { addToCart, buyNow } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    if (id) {
      fetchRatingSummary();
    }
  }, [id]);

  const fetchRatingSummary = async () => {
    try {
      const { data, error } = await supabase.rpc("get_product_rating", {
        p_product_id: id || "",
      });
      if (error) throw error;
      if (data && data.length > 0) {
        setAverageRating(Number(data[0].average_rating) || 0);
        setTotalReviews(Number(data[0].total_reviews) || 0);
      }
    } catch (error) {
      console.error("Error fetching rating summary:", error);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-heading mb-4">Product Not Found</h1>
          <Link to="/shop" className="text-primary hover:underline">
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success(`${product.name} added to cart`, {
      description: `Quantity: ${quantity}`,
    });
  };

  const handleBuyNow = () => {
    buyNow(product, quantity);
    navigate("/checkout");
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product);
    toast.success(
      inWishlist ? `${product.name} removed from wishlist` : `${product.name} added to wishlist`
    );
  };

  const handleShare = async () => {
    // Get current URL (works with local IP, Lovable preview, or production domain)
    const shareUrl = window.location.href;
    const shareText = `✨ Check out ${product.name} from RAYN ADAM!\n\n${product.tagline}\n\n💰 Price: ${formatPrice(product.price)}\n📦 Size: ${product.size} • ${product.concentration}\n\n🔗 `;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} | RAYN ADAM Perfumes`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          // Fallback to clipboard
          await navigator.clipboard.writeText(`${shareText}${shareUrl}`);
          toast.success("Link copied to clipboard");
        }
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      await navigator.clipboard.writeText(`${shareText}${shareUrl}`);
      toast.success("Link copied to clipboard", {
        description: "Share this with your friends!",
      });
    }
  };

  

  return (
    <>
      <Helmet>
        <title>{product.name} | Rayn Adam Luxury Perfumes</title>
        <meta name="description" content={product.description} />
        
        {/* Canonical URL - uses current domain dynamically */}
        <link rel="canonical" href={`${window.location.origin}/product/${product.id}`} />
        
        {/* Open Graph / Social Sharing - dynamic URL based on current domain */}
        <meta property="og:title" content={`${product.name} | Rayn Adam Luxury Perfumes`} />
        <meta property="og:description" content={product.description} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={`${window.location.origin}/product/${product.id}`} />
        <meta property="og:image" content={`${window.location.origin}${product.image}`} />
        <meta property="og:site_name" content="Rayn Adam Perfumes" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.name} | Rayn Adam Luxury Perfumes`} />
        <meta name="twitter:description" content={product.description} />
        <meta name="twitter:image" content={`${window.location.origin}${product.image}`} />
        
        {/* Product structured data */}
        <meta property="product:price:amount" content={product.price.toString()} />
        <meta property="product:price:currency" content="INR" />
      </Helmet>

      <FloatingParticles />

      <PageTransition>
        <main className="min-h-screen bg-background relative z-10">
          <Navbar />

        {/* Breadcrumb */}
        <section className="pt-24 pb-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm tracking-wider">BACK</span>
            </motion.button>
          </div>
        </section>

        {/* Product Hero */}
        <section className="py-8 sm:py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
              {/* Image Gallery */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeInLeft}
                className="space-y-4"
              >
                {/* Main Image */}
                <div className="relative aspect-square overflow-hidden border border-border/50 bg-card/50">
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary/60 z-10" />
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary/60 z-10" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary/60 z-10" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary/60 z-10" />
                  
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={selectedImage}
                      src={product.gallery[selectedImage]}
                      alt={product.name}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="w-full h-full object-cover"
                    />
                  </AnimatePresence>
                </div>

                {/* Thumbnails */}
                <div className="flex gap-4">
                  {product.gallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-20 h-20 sm:w-24 sm:h-24 border-2 overflow-hidden transition-all ${
                        selectedImage === idx ? "border-primary" : "border-border/50 hover:border-primary/50"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Product Info */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="space-y-6"
              >
                <div>
                  <motion.p variants={staggerItem} className="text-sm tracking-[0.3em] text-primary mb-2">
                    {product.category.toUpperCase()}
                  </motion.p>
                  <motion.h1 variants={staggerItem} className="text-3xl sm:text-4xl md:text-5xl font-heading tracking-tight">
                    {product.name}
                  </motion.h1>
                  <motion.p variants={staggerItem} className="text-lg text-muted-foreground mt-2">
                    {product.tagline}
                  </motion.p>
                  {/* Rating Preview */}
                  <motion.div variants={staggerItem} className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= Math.round(averageRating) ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {totalReviews > 0 ? `${averageRating.toFixed(1)} (${totalReviews})` : "No reviews"}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const reviewsTab = document.querySelector('[data-state="inactive"][value="reviews"]') as HTMLElement;
                        if (reviewsTab) reviewsTab.click();
                        setTimeout(() => {
                          document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <PenLine className="w-3 h-3" />
                      Add Review
                    </button>
                  </motion.div>
                </div>

                <motion.div variants={staggerItem} className="flex items-baseline gap-4">
                  <span className="text-3xl sm:text-4xl text-primary font-heading">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {product.size} • {product.concentration}
                  </span>
                </motion.div>

                {/* Bulk Discount Tiers */}
                <motion.div variants={staggerItem} className="bg-card/50 border border-border/50 rounded-lg p-4">
                  <p className="text-xs tracking-wider text-muted-foreground mb-3">BULK DISCOUNTS</p>
                  <div className="flex flex-wrap gap-2">
                    {BULK_DISCOUNT_TIERS.slice().reverse().map((tier) => (
                      <span
                        key={tier.minQty}
                        className="px-3 py-1.5 bg-primary/10 border border-primary/30 rounded text-sm text-primary font-medium"
                      >
                        {tier.minQty}+ pcs → {tier.discountPercent}% OFF
                      </span>
                    ))}
                  </div>
                </motion.div>

                <motion.p variants={staggerItem} className="text-muted-foreground leading-relaxed">
                  {product.description}
                </motion.p>

                {/* Fragrance Notes Preview */}
                <motion.div variants={staggerItem} className="space-y-3">
                  <p className="text-sm tracking-wider text-foreground">FRAGRANCE NOTES</p>
                  <div className="flex flex-wrap gap-2">
                    {[...product.notes.top, ...product.notes.heart.slice(0, 2)].map((note) => (
                      <span
                        key={note}
                        className="px-3 py-1 bg-card border border-border/50 text-sm text-muted-foreground"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                </motion.div>

                {/* Add to Cart & Actions */}
                <motion.div variants={staggerItem} className="space-y-4 pt-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      size="lg"
                      onClick={handleAddToCart}
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-sm tracking-widest font-medium transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)] flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-5 h-5" />
                      ADD TO CART
                    </Button>
                    <Button
                      size="lg"
                      onClick={handleBuyNow}
                      variant="secondary"
                      className="flex-1 py-6 text-sm tracking-widest font-medium transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Zap className="w-5 h-5" />
                      BUY NOW
                    </Button>
                  </div>
                  <div className="flex gap-4">
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleToggleWishlist}
                      className={`flex-1 p-6 border-border/50 hover:border-primary ${inWishlist ? "bg-primary/10 border-primary" : ""}`}
                    >
                      <Heart className={`w-5 h-5 mr-2 ${inWishlist ? "fill-primary text-primary" : ""}`} />
                      {inWishlist ? "WISHLISTED" : "WISHLIST"}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleShare}
                      className="flex-1 p-6 border-border/50 hover:border-primary"
                    >
                      <Share2 className="w-5 h-5 mr-2" />
                      SHARE
                    </Button>
                  </div>
                </motion.div>

                {/* Features */}
                <motion.div variants={staggerItem} className="grid grid-cols-3 gap-4 pt-6 border-t border-border/50">
                  <div className="text-center">
                    <Truck className="w-6 h-6 mx-auto text-primary mb-2" />
                    <p className="text-xs text-muted-foreground">Free Shipping</p>
                  </div>
                  <div className="text-center">
                    <Shield className="w-6 h-6 mx-auto text-primary mb-2" />
                    <p className="text-xs text-muted-foreground">Authentic</p>
                  </div>
                  <div className="text-center">
                    <RotateCcw className="w-6 h-6 mx-auto text-primary mb-2" />
                    <p className="text-xs text-muted-foreground">Easy Returns</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Product Details Tabs */}
        <section className="py-12 sm:py-16 bg-card/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Tabs defaultValue="story" className="w-full">
                <TabsList className="w-full justify-start bg-transparent border-b border-border/50 rounded-none h-auto p-0 gap-4 sm:gap-8 flex-wrap">
                  <TabsTrigger 
                    value="story" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-4 text-xs sm:text-sm tracking-wider"
                  >
                    THE STORY
                  </TabsTrigger>
                  <TabsTrigger 
                    value="notes" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-4 text-xs sm:text-sm tracking-wider"
                  >
                    FRAGRANCE NOTES
                  </TabsTrigger>
                  <TabsTrigger 
                    value="details" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-4 text-xs sm:text-sm tracking-wider"
                  >
                    DETAILS
                  </TabsTrigger>
                  <TabsTrigger 
                    value="reviews" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-4 text-xs sm:text-sm tracking-wider"
                  >
                    REVIEWS
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="story" className="pt-8">
                  <div className="max-w-3xl">
                    <h3 className="text-2xl font-heading mb-4">The Story Behind {product.name}</h3>
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      {product.story}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="pt-8">
                  <div className="grid sm:grid-cols-3 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-primary font-heading">T</span>
                        </div>
                        <div>
                          <h4 className="font-heading tracking-wider">TOP NOTES</h4>
                          <p className="text-xs text-muted-foreground">First impression (0-30 min)</p>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {product.notes.top.map((note) => (
                          <li key={note} className="text-muted-foreground flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center">
                          <span className="text-primary font-heading">H</span>
                        </div>
                        <div>
                          <h4 className="font-heading tracking-wider">HEART NOTES</h4>
                          <p className="text-xs text-muted-foreground">The core (30 min - 4 hrs)</p>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {product.notes.heart.map((note) => (
                          <li key={note} className="text-muted-foreground flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/40 flex items-center justify-center">
                          <span className="text-primary font-heading">B</span>
                        </div>
                        <div>
                          <h4 className="font-heading tracking-wider">BASE NOTES</h4>
                          <p className="text-xs text-muted-foreground">The lasting impression (4+ hrs)</p>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {product.notes.base.map((note) => (
                          <li key={note} className="text-muted-foreground flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                            {note}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="pt-8">
                  <div className="grid sm:grid-cols-2 gap-8 max-w-3xl">
                    <div className="space-y-4">
                      <div className="flex justify-between py-3 border-b border-border/30">
                        <span className="text-muted-foreground">Concentration</span>
                        <span className="text-foreground">{product.concentration}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-border/30">
                        <span className="text-muted-foreground">Size</span>
                        <span className="text-foreground">{product.size}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-border/30">
                        <span className="text-muted-foreground">Longevity</span>
                        <span className="text-foreground">{product.longevity}</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-border/30">
                        <span className="text-muted-foreground">Sillage</span>
                        <span className="text-foreground">{product.sillage}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="py-3 border-b border-border/30">
                        <span className="text-muted-foreground block mb-2">Best Seasons</span>
                        <div className="flex flex-wrap gap-2">
                          {product.season.map((s) => (
                            <span key={s} className="px-3 py-1 bg-card border border-border/50 text-sm">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="py-3 border-b border-border/30">
                        <span className="text-muted-foreground block mb-2">Best For</span>
                        <div className="flex flex-wrap gap-2">
                          {product.occasion.map((o) => (
                            <span key={o} className="px-3 py-1 bg-card border border-border/50 text-sm">
                              {o}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="pt-8" id="reviews-section">
                  <ProductReviews productId={product.id} />
                </TabsContent>
              </Tabs>
            </motion.div>
          </div>
        </section>

        {/* Related Products */}
        <RelatedProducts currentProductId={product.id} currentCategory={product.category} />

        <Footer />
        </main>
      </PageTransition>
    </>
  );
};

export default memo(ProductDetail);

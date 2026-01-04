import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Minus, Plus, ShoppingBag, Share2, Truck, Shield, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingParticles from "@/components/FloatingParticles";
import PageTransition from "@/components/PageTransition";
import { useShopifyProductByHandle } from "@/hooks/useShopifyProducts";
import { useShopifyCartStore } from "@/stores/shopifyCartStore";
import { formatShopifyPrice, ShopifyProduct } from "@/lib/shopify";
import { fadeInUp, fadeInLeft, staggerContainer, staggerItem } from "@/lib/animations";
import { toast } from "sonner";

const ShopifyProductDetail = () => {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, error } = useShopifyProductByHandle(handle || "");
  const { addItem } = useShopifyCartStore();
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
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

  const images = product.images.edges;
  const variants = product.variants.edges;
  const selectedVariant = variants[selectedVariantIndex]?.node;
  const price = selectedVariant?.price;

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.error("Please select a variant");
      return;
    }
    
    // Wrap product in the expected format
    const wrappedProduct: ShopifyProduct = { node: product };
    
    for (let i = 0; i < quantity; i++) {
      addItem(wrappedProduct, selectedVariant);
    }
    
    toast.success(`${product.title} added to cart`, {
      description: `Quantity: ${quantity}`,
      position: "top-center",
    });
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `✨ Check out ${product.title} from RAYN ADAM!\n\n💰 Price: ${price ? formatShopifyPrice(price.amount, price.currencyCode) : 'N/A'}\n\n🔗 `;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.title} | RAYN ADAM Perfumes`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(`${shareText}${shareUrl}`);
          toast.success("Link copied to clipboard");
        }
      }
    } else {
      await navigator.clipboard.writeText(`${shareText}${shareUrl}`);
      toast.success("Link copied to clipboard", {
        description: "Share this with your friends!",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>{product.title} | Rayn Adam Luxury Perfumes</title>
        <meta name="description" content={product.description} />
        <link rel="canonical" href={`${window.location.origin}/shopify-product/${product.handle}`} />
        <meta property="og:title" content={`${product.title} | Rayn Adam Luxury Perfumes`} />
        <meta property="og:description" content={product.description} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={`${window.location.origin}/shopify-product/${product.handle}`} />
        {images[0]?.node && <meta property="og:image" content={images[0].node.url} />}
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
                  <div className="relative aspect-square overflow-hidden border border-border/50 bg-card/50 rounded-xl">
                    <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary/60 z-10 rounded-tl-xl" />
                    <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary/60 z-10 rounded-tr-xl" />
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary/60 z-10 rounded-bl-xl" />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary/60 z-10 rounded-br-xl" />
                    
                    <AnimatePresence mode="wait">
                      {images[selectedImage]?.node ? (
                        <motion.img
                          key={selectedImage}
                          src={images[selectedImage].node.url}
                          alt={images[selectedImage].node.altText || product.title}
                          initial={{ opacity: 0, scale: 1.05 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <ShoppingBag className="w-16 h-16 text-muted-foreground/30" />
                        </div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Thumbnails */}
                  {images.length > 1 && (
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImage(idx)}
                          className={`w-20 h-20 sm:w-24 sm:h-24 border-2 overflow-hidden transition-all flex-shrink-0 rounded-lg ${
                            selectedImage === idx ? "border-primary" : "border-border/50 hover:border-primary/50"
                          }`}
                        >
                          <img src={img.node.url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Product Info */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainer}
                  className="space-y-6"
                >
                  <div>
                    <motion.h1 variants={staggerItem} className="text-3xl sm:text-4xl md:text-5xl font-heading tracking-tight">
                      {product.title}
                    </motion.h1>
                  </div>

                  <motion.div variants={staggerItem} className="flex items-baseline gap-4">
                    <span className="text-3xl sm:text-4xl text-primary font-heading">
                      {price ? formatShopifyPrice(price.amount, price.currencyCode) : "Price unavailable"}
                    </span>
                  </motion.div>

                  <motion.p variants={staggerItem} className="text-muted-foreground leading-relaxed">
                    {product.description || "A luxurious fragrance crafted with the finest ingredients."}
                  </motion.p>

                  {/* Variant Selection */}
                  {variants.length > 1 && (
                    <motion.div variants={staggerItem} className="space-y-3">
                      <p className="text-sm tracking-wider text-foreground">SELECT VARIANT</p>
                      <div className="flex flex-wrap gap-2">
                        {variants.map((variant, idx) => (
                          <button
                            key={variant.node.id}
                            onClick={() => setSelectedVariantIndex(idx)}
                            disabled={!variant.node.availableForSale}
                            className={`px-4 py-2 border rounded-lg transition-all ${
                              selectedVariantIndex === idx
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border/50 hover:border-primary/50"
                            } ${!variant.node.availableForSale ? "opacity-50 cursor-not-allowed line-through" : ""}`}
                          >
                            {variant.node.title}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Quantity & Add to Cart */}
                  <motion.div variants={staggerItem} className="space-y-4 pt-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm tracking-wider text-muted-foreground">QUANTITY</span>
                      <div className="flex items-center border border-border/50 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="p-3 hover:bg-muted transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center">{quantity}</span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="p-3 hover:bg-muted transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        size="lg"
                        onClick={handleAddToCart}
                        disabled={!selectedVariant?.availableForSale}
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-sm tracking-widest font-medium transition-all duration-300 hover:shadow-[0_0_30px_hsl(35_49%_44%_/_0.4)] disabled:opacity-50"
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        {selectedVariant?.availableForSale ? "ADD TO CART" : "OUT OF STOCK"}
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={handleShare}
                        className="p-6 border-border/50 hover:border-primary"
                      >
                        <Share2 className="w-5 h-5" />
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

          <Footer />
        </main>
      </PageTransition>
    </>
  );
};

export default ShopifyProductDetail;

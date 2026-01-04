import { memo } from "react";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { ShopifyProduct, formatShopifyPrice } from "@/lib/shopify";
import { useShopifyCartStore } from "@/stores/shopifyCartStore";
import { staggerItem } from "@/lib/animations";
import { toast } from "sonner";

interface ShopifyProductCardProps {
  product: ShopifyProduct;
  viewMode?: "grid" | "list";
}

const ShopifyProductCard = memo(({ product, viewMode = "grid" }: ShopifyProductCardProps) => {
  const { addItem } = useShopifyCartStore();
  const productNode = product.node;
  const firstImage = productNode.images.edges[0]?.node;
  const firstVariant = productNode.variants.edges[0]?.node;
  const price = firstVariant?.price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!firstVariant) {
      toast.error("Product unavailable");
      return;
    }
    
    addItem(product, firstVariant);
    toast.success(`${productNode.title} added to cart`, {
      position: "top-center",
    });
  };

  if (viewMode === "list") {
    return (
      <motion.div
        variants={staggerItem}
        className="flex flex-col md:flex-row gap-6 border border-border/50 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/50 transition-colors rounded-xl group"
      >
        <Link
          to={`/shopify-product/${productNode.handle}`}
          className="w-full md:w-48 aspect-square overflow-hidden flex-shrink-0"
        >
          {firstImage ? (
            <img
              src={firstImage.url}
              alt={firstImage.altText || productNode.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
        </Link>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <Link to={`/shopify-product/${productNode.handle}`}>
              <h3 className="font-heading text-lg tracking-wider hover:text-primary transition-colors">
                {productNode.title}
              </h3>
            </Link>
            <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
              {productNode.description}
            </p>
          </div>

          <div className="flex items-center justify-between mt-4">
            <span className="text-xl text-primary font-heading">
              {price ? formatShopifyPrice(price.amount, price.currencyCode) : "Price unavailable"}
            </span>
            <button
              onClick={handleAddToCart}
              disabled={!firstVariant?.availableForSale}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="text-sm tracking-wider">ADD TO CART</span>
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={staggerItem}>
      <Link to={`/shopify-product/${productNode.handle}`} className="block group">
        <div className="border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:border-primary/50 hover:bg-card rounded-xl">
          <div className="relative p-4 sm:p-6">
            {/* Luxury corner accents */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary/60 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary/60 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary/60 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary/60 rounded-br-xl" />

            <div className="aspect-square overflow-hidden mb-4 rounded-lg">
              {firstImage ? (
                <img
                  src={firstImage.url}
                  alt={firstImage.altText || productNode.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground/30" />
                </div>
              )}
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-heading text-lg tracking-wider group-hover:text-primary transition-colors line-clamp-1">
                {productNode.title}
              </h3>
              <p className="text-muted-foreground text-sm line-clamp-2">
                {productNode.description || "Luxury fragrance"}
              </p>
              <p className="text-xl text-primary font-heading">
                {price ? formatShopifyPrice(price.amount, price.currencyCode) : "Price unavailable"}
              </p>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={!firstVariant?.availableForSale}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-[0_0_20px_hsl(35_49%_44%_/_0.3)] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm tracking-widest"
            >
              <ShoppingBag className="w-4 h-4" />
              {firstVariant?.availableForSale ? "ADD TO CART" : "OUT OF STOCK"}
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

ShopifyProductCard.displayName = "ShopifyProductCard";

export default ShopifyProductCard;

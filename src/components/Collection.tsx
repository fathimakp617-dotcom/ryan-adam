import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { products, formatPrice } from "@/data/products";
import { fadeInUp, staggerContainer, staggerItem, lineReveal } from "@/lib/animations";
import { Badge } from "@/components/ui/badge";
import { useProductStock, isProductSoldOut } from "@/hooks/useProductStock";

const Collection = () => {
  const featuredProducts = products.slice(0, 3);
  const { data: stockMap } = useProductStock();

  return (
    <section id="collection" className="py-24 sm:py-32 bg-background relative overflow-hidden">
      {/* Subtle background accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(35_49%_44%_/_0.02)_0%,_transparent_50%)]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center mb-16 sm:mb-20"
        >
          <motion.p 
            variants={fadeInUp}
            className="text-sm tracking-[0.4em] text-primary mb-4"
          >
            DISCOVER
          </motion.p>
          <motion.h2 
            variants={fadeInUp}
            className="text-3xl sm:text-4xl md:text-6xl font-heading tracking-tight"
          >
            Our Collection
          </motion.h2>
          <motion.div 
            variants={lineReveal}
            className="w-20 h-0.5 bg-primary mx-auto mt-6 origin-left"
          />
        </motion.div>

        {/* Products Grid */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12"
        >
          {featuredProducts.map((product) => (
            <motion.div
              key={product.id}
              variants={staggerItem}
              className="group"
            >
              <Link to={`/product/${product.id}`}>
                <div className="relative overflow-hidden border border-border/50 bg-card/50 p-6 sm:p-8 transition-all duration-500 hover:border-primary/50 hover:bg-card">
                  {/* Gold corner accents */}
                  <div className="absolute top-0 left-0 w-6 sm:w-8 h-6 sm:h-8 border-t-2 border-l-2 border-primary/60" />
                  <div className="absolute top-0 right-0 w-6 sm:w-8 h-6 sm:h-8 border-t-2 border-r-2 border-primary/60" />
                  <div className="absolute bottom-0 left-0 w-6 sm:w-8 h-6 sm:h-8 border-b-2 border-l-2 border-primary/60" />
                  <div className="absolute bottom-0 right-0 w-6 sm:w-8 h-6 sm:h-8 border-b-2 border-r-2 border-primary/60" />

                  {/* Product Image */}
                  <div className="relative aspect-square mb-6 overflow-hidden">
                    {/* Sold Out Badge */}
                    {isProductSoldOut(stockMap, product.id) && (
                      <div className="absolute top-2 right-2 z-10">
                        <Badge variant="destructive" className="text-xs font-semibold">
                          SOLD OUT
                        </Badge>
                      </div>
                    )}
                    <motion.img
                      src={product.image}
                      alt={product.name}
                      className={`w-full h-full object-cover ${isProductSoldOut(stockMap, product.id) ? 'opacity-60' : ''}`}
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  {/* Product Info */}
                  <div className="text-center">
                    <h3 className="text-xl sm:text-2xl font-heading tracking-[0.2em] mb-2 text-foreground">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground tracking-wider mb-4">
                      {product.tagline}
                    </p>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <span className="text-lg sm:text-xl text-primary font-medium">{formatPrice(product.price)}</span>
                      <span className="text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                      <span className="bg-emerald-500/20 text-emerald-400 text-xs font-medium px-2 py-0.5 rounded-full">
                        {product.discountPercent}% OFF
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="flex items-center justify-center mt-12 sm:mt-16"
        >
          <Link 
            to="/shop" 
            className="relative inline-block px-10 sm:px-12 py-4 bg-primary text-primary-foreground text-sm tracking-widest transition-all duration-300 hover:bg-primary/90 hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
          >
            VIEW ALL PRODUCTS
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Collection;

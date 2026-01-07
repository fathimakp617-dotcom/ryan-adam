import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { products, formatPrice, Product } from "@/data/products";
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/animations";
import { generateWhatsAppLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";

interface RelatedProductsProps {
  currentProductId: string;
  currentCategory: string;
}

const RelatedProducts = ({ currentProductId, currentCategory }: RelatedProductsProps) => {
  // Show all products except the current one
  const relatedProducts = products.filter((p) => p.id !== currentProductId);

  if (relatedProducts.length === 0) return null;

  return (
    <section className="py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.h2
            variants={fadeInUp}
            className="text-2xl sm:text-3xl font-heading tracking-tight mb-8 text-center"
          >
            You May Also Like
          </motion.h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {relatedProducts.map((item) => (
              <motion.div key={item.id} variants={staggerItem}>
                <div className="relative overflow-hidden border border-border/50 bg-card/50 p-6 transition-all duration-500 hover:border-primary/50">
                  <Link to={`/product/${item.id}`} className="group block">
                    <div className="aspect-square mb-4 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="text-center">
                      <h3 className="font-heading tracking-[0.1em] text-foreground group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{item.tagline}</p>
                      <p className="text-primary font-medium mt-2">{formatPrice(item.price)}</p>
                    </div>
                  </Link>
                  <a 
                    href={generateWhatsAppLink(item.name, formatPrice(item.price))} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block mt-4"
                  >
                    <Button
                      size="sm"
                      className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs tracking-wider flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      BUY ON WHATSAPP
                    </Button>
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default RelatedProducts;

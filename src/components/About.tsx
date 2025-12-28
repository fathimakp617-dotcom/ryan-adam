import { motion } from "framer-motion";
import blancElegance from "@/assets/perfumes/blanc-elegance.jpg";
import { fadeInUp, fadeInLeft, fadeInRight, staggerContainer, staggerItem, lineReveal } from "@/lib/animations";

const About = () => {
  return (
    <section id="about" className="py-24 sm:py-32 bg-luxury-gradient relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_right,_hsl(35_49%_44%_/_0.05)_0%,_transparent_50%)]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInLeft}
            className="relative order-2 lg:order-1"
          >
            <div className="relative">
              {/* Frame decoration */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3 }}
                className="absolute -inset-4 border border-primary/20" 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.5 }}
                className="absolute -inset-8 border border-primary/10" 
              />
              
              <motion.img
                src={blancElegance}
                alt="The Art of Perfumery"
                className="w-full object-cover relative z-10"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.6 }}
              />

              {/* Corner accents */}
              <motion.div 
                initial={{ opacity: 0, x: -20, y: -20 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="absolute -top-2 -left-2 w-12 h-12 border-t-2 border-l-2 border-primary z-20" 
              />
              <motion.div 
                initial={{ opacity: 0, x: 20, y: 20 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="absolute -bottom-2 -right-2 w-12 h-12 border-b-2 border-r-2 border-primary z-20" 
              />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="space-y-6 sm:space-y-8 order-1 lg:order-2"
          >
            <div className="space-y-4">
              <motion.p variants={fadeInUp} className="text-sm tracking-[0.4em] text-primary">
                OUR STORY
              </motion.p>
              <motion.h2 
                variants={fadeInUp}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading tracking-tight leading-tight"
              >
                The Art of
                <span className="block text-gold-gradient">Perfumery</span>
              </motion.h2>
              <motion.div 
                variants={lineReveal}
                className="w-16 h-0.5 bg-primary origin-left"
              />
            </div>

            <motion.div variants={staggerContainer} className="space-y-4 sm:space-y-6 text-muted-foreground leading-relaxed">
              <motion.p variants={staggerItem}>
                Each Rayn Adam fragrance is a masterpiece born from the finest ingredients 
                sourced across the globe. Our perfumers blend tradition with innovation, 
                creating scents that transcend time and trends.
              </motion.p>
              <motion.p variants={staggerItem}>
                From the ancient oud forests of Southeast Asia to the delicate rose gardens 
                of Morocco, we travel the world to bring you fragrances that tell a story 
                of elegance, passion, and uncompromising quality.
              </motion.p>
            </motion.div>

            {/* Stats */}
            <motion.div 
              variants={fadeInUp}
              className="grid grid-cols-3 gap-4 sm:gap-8 pt-8 border-t border-border/50"
            >
              {[
                { number: "50+", label: "Unique Scents" },
                { number: "15", label: "Countries" },
                { number: "100%", label: "Natural Oils" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + index * 0.15 }}
                  viewport={{ once: true }}
                >
                  <p className="text-2xl sm:text-3xl md:text-4xl font-heading text-gold-gradient">
                    {stat.number}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground tracking-wider mt-1">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default About;

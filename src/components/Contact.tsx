import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { fadeInUp, staggerContainer, staggerItem, lineReveal } from "@/lib/animations";

const Contact = () => {
  return (
    <section id="contact" className="py-24 sm:py-32 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_hsl(35_49%_44%_/_0.03)_0%,_transparent_50%)]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-12 sm:mb-16"
          >
            <motion.p variants={fadeInUp} className="text-sm tracking-[0.4em] text-primary mb-4">
              GET IN TOUCH
            </motion.p>
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl md:text-6xl font-heading tracking-tight">
              Contact Us
            </motion.h2>
            <motion.div 
              variants={lineReveal}
              className="w-20 h-0.5 bg-primary mx-auto mt-6 origin-center"
            />
            <motion.p variants={fadeInUp} className="text-muted-foreground mt-6 max-w-xl mx-auto">
              Have questions about our fragrances? We'd love to hear from you. 
              Send us a message and we'll respond as soon as possible.
            </motion.p>
          </motion.div>

          {/* Contact Form */}
          <motion.form
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="space-y-6 sm:space-y-8"
          >
            <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-2">
                <label className="text-sm tracking-wider text-muted-foreground">
                  NAME
                </label>
                <Input
                  type="text"
                  placeholder="Your name"
                  className="bg-card border-border/50 focus:border-primary h-12 sm:h-14 px-4 sm:px-6 text-foreground placeholder:text-muted-foreground/50 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm tracking-wider text-muted-foreground">
                  EMAIL
                </label>
                <Input
                  type="email"
                  placeholder="Your email"
                  className="bg-card border-border/50 focus:border-primary h-12 sm:h-14 px-4 sm:px-6 text-foreground placeholder:text-muted-foreground/50 transition-all duration-300"
                />
              </div>
            </motion.div>

            <motion.div variants={staggerItem} className="space-y-2">
              <label className="text-sm tracking-wider text-muted-foreground">
                SUBJECT
              </label>
              <Input
                type="text"
                placeholder="Subject"
                className="bg-card border-border/50 focus:border-primary h-12 sm:h-14 px-4 sm:px-6 text-foreground placeholder:text-muted-foreground/50 transition-all duration-300"
              />
            </motion.div>

            <motion.div variants={staggerItem} className="space-y-2">
              <label className="text-sm tracking-wider text-muted-foreground">
                MESSAGE
              </label>
              <Textarea
                placeholder="Your message"
                rows={6}
                className="bg-card border-border/50 focus:border-primary px-4 sm:px-6 py-4 text-foreground placeholder:text-muted-foreground/50 resize-none transition-all duration-300"
              />
            </motion.div>

            <motion.div variants={fadeInUp} className="text-center pt-4">
              <Button
                type="submit"
                size="lg"
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-12 sm:px-16 py-5 sm:py-6 text-sm tracking-widest font-medium transition-all duration-300 hover:shadow-[0_0_30px_hsl(35_49%_44%_/_0.4)]"
              >
                SEND MESSAGE
              </Button>
            </motion.div>
          </motion.form>
        </div>
      </div>
    </section>
  );
};

export default Contact;

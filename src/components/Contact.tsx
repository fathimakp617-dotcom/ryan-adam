import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { fadeInUp, staggerContainer, staggerItem, lineReveal } from "@/lib/animations";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-contact-email", {
        body: formData,
      });

      if (error) throw error;

      toast.success("Message sent! We'll get back to you soon.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error: any) {
      console.error("Contact form error:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            onSubmit={handleSubmit}
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
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="bg-card border-border/50 focus:border-primary h-12 sm:h-14 px-4 sm:px-6 text-foreground placeholder:text-muted-foreground/50 transition-all duration-300"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm tracking-wider text-muted-foreground">
                  EMAIL
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Your email"
                  className="bg-card border-border/50 focus:border-primary h-12 sm:h-14 px-4 sm:px-6 text-foreground placeholder:text-muted-foreground/50 transition-all duration-300"
                  disabled={isSubmitting}
                />
              </div>
            </motion.div>

            <motion.div variants={staggerItem} className="space-y-2">
              <label className="text-sm tracking-wider text-muted-foreground">
                SUBJECT
              </label>
              <Input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Subject"
                className="bg-card border-border/50 focus:border-primary h-12 sm:h-14 px-4 sm:px-6 text-foreground placeholder:text-muted-foreground/50 transition-all duration-300"
                disabled={isSubmitting}
              />
            </motion.div>

            <motion.div variants={staggerItem} className="space-y-2">
              <label className="text-sm tracking-wider text-muted-foreground">
                MESSAGE
              </label>
              <Textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Your message"
                rows={6}
                className="bg-card border-border/50 focus:border-primary px-4 sm:px-6 py-4 text-foreground placeholder:text-muted-foreground/50 resize-none transition-all duration-300"
                disabled={isSubmitting}
              />
            </motion.div>

            <motion.div variants={fadeInUp} className="text-center pt-4">
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-12 sm:px-16 py-5 sm:py-6 text-sm tracking-widest font-medium transition-all duration-300 hover:shadow-[0_0_30px_hsl(35_49%_44%_/_0.4)] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    SENDING...
                  </>
                ) : (
                  "SEND MESSAGE"
                )}
              </Button>
            </motion.div>
          </motion.form>
        </div>
      </div>
    </section>
  );
};

export default Contact;

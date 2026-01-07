import { motion } from "framer-motion";
import { Instagram, Facebook, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-charcoal border-t border-border/30 py-16">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2 space-y-6">
            <h3 className="text-2xl font-heading tracking-[0.3em] text-gold-gradient">
              RAYN ADAM
            </h3>
            <p className="text-muted-foreground leading-relaxed max-w-md">
              Crafting exceptional fragrances that embody elegance, sophistication, 
              and the art of luxury perfumery since 2010.
            </p>
            {/* Social Icons */}
            <div className="flex gap-4">
              {[Instagram, Facebook, Twitter].map((Icon, index) => (
                <motion.a
                  key={index}
                  href="#"
                  whileHover={{ scale: 1.1 }}
                  className="w-10 h-10 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors duration-300"
                >
                  <Icon size={18} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-sm tracking-[0.2em] text-foreground">QUICK LINKS</h4>
            <ul className="space-y-3">
              {["Home", "Collection", "About", "Contact"].map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase()}`}
                    className="text-muted-foreground hover:text-primary transition-colors duration-300 text-sm"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h4 className="text-sm tracking-[0.2em] text-foreground">CONTACT</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>info@raynadamperfume.com</li>
              <li>+91 99466 47442</li>
              <li>
                Ward No. 21, Door No. 553/1<br />
                Kavumpadi, Pallikkal, Tirurangadi<br />
                Malappuram – 673634<br />
                Kerala, India
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-border/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 Rayn Adam. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Terms & Conditions
            </Link>
            <Link to="/refund-policy" className="hover:text-primary transition-colors">
              Refund Policy
            </Link>
            <Link to="/shipping-policy" className="hover:text-primary transition-colors">
              Shipping Policy
            </Link>
            <Link to="/cancellation-policy" className="hover:text-primary transition-colors">
              Cancellation Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

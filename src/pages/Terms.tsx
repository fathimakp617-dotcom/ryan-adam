import { memo } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Truck, CreditCard, Package, AlertTriangle, Shield, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Terms & Conditions | Rayn Adam</title>
        <meta name="description" content="Terms and conditions for shopping at Rayn Adam Luxury Perfumes including shipping, payment, and return policies." />
      </Helmet>
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-heading text-foreground mb-4">Terms & Conditions</h1>
            <p className="text-muted-foreground mb-12">Last updated: December 2024</p>

            {/* Shipping Charges Section */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Shipping Policy</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Additional Shipping Charge</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      A shipping charge of <span className="text-primary font-semibold">₹79</span> applies to all orders below ₹999. 
                      Orders above ₹999 qualify for FREE shipping across India.
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Standard delivery takes 5-7 business days across India
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Tracking information will be provided via email once shipped
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    We currently ship only within India
                  </li>
                </ul>
              </div>
            </section>

            {/* Cash on Delivery Section */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Cash on Delivery (COD)</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-3 p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">COD Shipping Charge Prepayment Required</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      For Cash on Delivery orders, the <span className="text-orange-500 font-semibold">shipping charge must be paid in advance</span> at the time of delivery confirmation. 
                      This is a non-refundable fee to cover courier handling costs.
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    COD is available for orders within India only
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Please keep exact change ready at the time of delivery
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Order will be shipped after shipping charge confirmation
                  </li>
                </ul>
              </div>
            </section>

            {/* Payment Terms */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Payment Terms</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    We accept UPI, Credit/Debit Cards, Net Banking via Razorpay
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    All online payments are secured with SSL encryption
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Cash on Delivery (COD) available with advance shipping charge
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Prices are inclusive of all applicable taxes
                  </li>
                </ul>
              </div>
            </section>

            {/* Returns & Refunds */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Returns & Refunds</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Returns accepted within 7 days of delivery for unopened products
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Products must be in original packaging and unused condition
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Refunds will be processed within 7-10 business days
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Shipping charges are non-refundable
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Return requests can be initiated from your account page
                  </li>
                </ul>
              </div>
            </section>

            {/* General Terms */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">General Terms</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    All products are 100% authentic and sourced from authorized distributors
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Product images are for illustration; actual products may vary slightly
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    We reserve the right to cancel orders suspected of fraudulent activity
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Prices and offers are subject to change without prior notice
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    By placing an order, you agree to all terms stated herein
                  </li>
                </ul>
              </div>
            </section>

            {/* Contact */}
            <section className="text-center p-8 bg-card border border-border rounded-xl">
              <h3 className="text-xl font-heading text-foreground mb-2">Have Questions?</h3>
              <p className="text-muted-foreground mb-4">
                Contact us at <a href="mailto:support@raynadam.com" className="text-primary hover:underline">support@raynadam.com</a>
              </p>
              <p className="text-sm text-muted-foreground">
                © 2026 Rayn Adam Luxury Perfumes. All rights reserved.
              </p>
            </section>
          </div>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
};

export default memo(Terms);

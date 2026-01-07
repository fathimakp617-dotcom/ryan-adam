import { memo } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, RotateCcw, Package, Clock, AlertTriangle, CheckCircle, XCircle, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Refund & Return Policy | Rayn Adam</title>
        <meta name="description" content="Refund and return policy for Rayn Adam Luxury Perfumes. Learn about our 7-day return window and refund process." />
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
            <h1 className="text-3xl md:text-4xl font-heading text-foreground mb-4">Refund & Return Policy</h1>
            <p className="text-muted-foreground mb-12">Last updated: January 2026</p>

            {/* Return Window */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">7-Day Return Window</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg mb-4">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Easy Returns</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You can return any product within <span className="text-primary font-semibold">7 days</span> of delivery 
                      for a full refund or exchange, subject to our return conditions.
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  Our goal is your complete satisfaction. If you're not happy with your purchase, 
                  we're here to help make it right.
                </p>
              </div>
            </section>

            {/* Eligible for Return */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Eligible for Return</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    Unopened products in original sealed packaging
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    Products with manufacturing defects
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    Wrong product delivered
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    Damaged products received (with unboxing video proof)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    Products significantly different from description
                  </li>
                </ul>
              </div>
            </section>

            {/* Not Eligible for Return */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Not Eligible for Return</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✗</span>
                    Opened or used products (seal broken)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✗</span>
                    Products without original packaging or tags
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✗</span>
                    Products damaged due to misuse or negligence
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✗</span>
                    Return requests made after 7 days
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✗</span>
                    Products purchased during clearance sales (unless defective)
                  </li>
                </ul>
              </div>
            </section>

            {/* How to Return */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">How to Initiate a Return</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <ol className="space-y-4">
                  <li className="flex items-start gap-4">
                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">1</span>
                    <div>
                      <p className="font-medium text-foreground">Log in to Your Account</p>
                      <p className="text-sm text-muted-foreground">Go to "My Orders" section in your account dashboard</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">2</span>
                    <div>
                      <p className="font-medium text-foreground">Select the Order</p>
                      <p className="text-sm text-muted-foreground">Click "Request Return" on the delivered order</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">3</span>
                    <div>
                      <p className="font-medium text-foreground">Provide Details</p>
                      <p className="text-sm text-muted-foreground">Select reason and upload photos if applicable</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">4</span>
                    <div>
                      <p className="font-medium text-foreground">Wait for Approval</p>
                      <p className="text-sm text-muted-foreground">We'll review and respond within 24-48 hours</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">5</span>
                    <div>
                      <p className="font-medium text-foreground">Ship the Product</p>
                      <p className="text-sm text-muted-foreground">Pack securely and ship to our address (pickup may be arranged)</p>
                    </div>
                  </li>
                </ol>
              </div>
            </section>

            {/* Refund Process */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Refund Process</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-3 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                  <CreditCard className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Refund Timeline</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Refunds are processed within <span className="text-green-500 font-semibold">7-10 business days</span> after 
                      we receive and inspect the returned product.
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <strong>Online Payments:</strong> Refunded to original payment method
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <strong>COD Orders:</strong> Refunded via bank transfer (NEFT/IMPS)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Bank processing may take an additional 3-5 business days
                  </li>
                </ul>
              </div>
            </section>

            {/* Non-Refundable Items */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Non-Refundable Charges</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start gap-3 p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Please Note</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      The following charges are <span className="text-orange-500 font-semibold">non-refundable</span>:
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-muted-foreground mt-4">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Original shipping charges (₹79 for orders below ₹999)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    COD advance shipping fee
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Return shipping costs (unless product was defective or wrong)
                  </li>
                </ul>
              </div>
            </section>

            {/* Exchange Policy */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-purple-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Exchange Policy</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Exchanges are subject to product availability
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Price differences will be adjusted accordingly
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Exchanged products will be shipped free of charge
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Only one exchange per order is allowed
                  </li>
                </ul>
              </div>
            </section>

            {/* Contact */}
            <section className="text-center p-8 bg-card border border-border rounded-xl">
              <h3 className="text-xl font-heading text-foreground mb-2">Need Help with a Return?</h3>
              <p className="text-muted-foreground mb-4">
                Contact our support team at <a href="mailto:returns@raynadamperfume.com" className="text-primary hover:underline">returns@raynadamperfume.com</a>
                <br />
                or call us at <a href="tel:+919946647442" className="text-primary hover:underline">+91 99466 47442</a>
              </p>
              <p className="text-sm text-muted-foreground">
                © 2026 Rayn Adam Private Limited. All rights reserved.
              </p>
            </section>
          </div>
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
};

export default memo(RefundPolicy);
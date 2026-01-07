import { memo } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, XCircle, Clock, AlertTriangle, CheckCircle, CreditCard, Package, Ban } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CancellationPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Cancellation Policy | Rayn Adam</title>
        <meta name="description" content="Cancellation policy for Rayn Adam Luxury Perfumes. Learn how to cancel your order and understand our cancellation terms." />
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
            <h1 className="text-3xl md:text-4xl font-heading text-foreground mb-4">Cancellation Policy</h1>
            <p className="text-muted-foreground mb-12">Last updated: January 2026</p>

            {/* Cancellation Window */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Cancellation Window</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg mb-4">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Free Cancellation</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You can cancel your order <span className="text-primary font-semibold">free of charge</span> as long as 
                      it is still in "Pending" status and has not been shipped yet.
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  Once your order has been confirmed, processed, or shipped, cancellation may not be possible. 
                  Please reach out to us immediately if you need to cancel.
                </p>
              </div>
            </section>

            {/* How to Cancel */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">How to Cancel Your Order</h2>
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
                      <p className="text-sm text-muted-foreground">Find the order you wish to cancel</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">3</span>
                    <div>
                      <p className="font-medium text-foreground">Click "Cancel Order"</p>
                      <p className="text-sm text-muted-foreground">The cancel button is available only for pending orders</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">4</span>
                    <div>
                      <p className="font-medium text-foreground">Confirm Cancellation</p>
                      <p className="text-sm text-muted-foreground">You'll receive a confirmation email once cancelled</p>
                    </div>
                  </li>
                </ol>
              </div>
            </section>

            {/* Orders That Cannot Be Cancelled */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Ban className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Orders That Cannot Be Cancelled</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✗</span>
                    Orders that have already been shipped
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✗</span>
                    Orders in "Confirmed" or "Processing" status
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✗</span>
                    Orders marked as "Out for Delivery"
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✗</span>
                    Orders already delivered
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  For these orders, please consider our <Link to="/refund-policy" className="text-primary hover:underline">Return & Refund Policy</Link> instead.
                </p>
              </div>
            </section>

            {/* Refund After Cancellation */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Refund After Cancellation</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="flex items-start gap-3 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                  <CreditCard className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">Refund Timeline</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Refunds for cancelled orders are processed within <span className="text-green-500 font-semibold">5-7 business days</span>.
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <strong>Online Payments (UPI/Card):</strong> Refunded to original payment method
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <strong>COD Orders:</strong> No refund required as payment was not collected
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Bank processing may take an additional 3-5 business days
                  </li>
                </ul>
              </div>
            </section>

            {/* Non-Refundable Charges */}
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
                      The following charges may be <span className="text-orange-500 font-semibold">non-refundable</span> in certain cases:
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-muted-foreground mt-4">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    COD advance shipping fee (₹79) if order was already dispatched
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Payment gateway processing fees (if applicable)
                  </li>
                </ul>
              </div>
            </section>

            {/* Partial Cancellation */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-purple-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Partial Cancellation</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Partial cancellation of items from an order is not supported
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    You must cancel the entire order and place a new one with desired items
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Contact support for assistance with complex order modifications
                  </li>
                </ul>
              </div>
            </section>

            {/* Contact */}
            <section className="text-center p-8 bg-card border border-border rounded-xl">
              <h3 className="text-xl font-heading text-foreground mb-2">Need Help Cancelling?</h3>
              <p className="text-muted-foreground mb-4">
                Contact our support team at <a href="mailto:support@raynadamperfume.com" className="text-primary hover:underline">support@raynadamperfume.com</a>
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

export default memo(CancellationPolicy);

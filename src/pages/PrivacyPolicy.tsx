import { memo } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Shield, Eye, Lock, Database, Bell, Users, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Privacy Policy | Rayn Adam Luxury Perfumes India</title>
        <meta name="description" content="Privacy Policy for Rayn Adam Luxury Perfumes India. Learn how we collect, use, and protect your personal data. GDPR compliant." />
        <meta name="keywords" content="Rayn Adam privacy, data protection, personal information, GDPR" />
        <link rel="canonical" href="https://ryanadamperfume.lovable.app/privacy" />
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
            <h1 className="text-3xl md:text-4xl font-heading text-foreground mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground mb-12">Last updated: January 2026</p>

            {/* Introduction */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Introduction</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <p className="text-muted-foreground leading-relaxed">
                  RAYN ADAM PRIVATE LIMITED ("we", "us", or "our") is committed to protecting your privacy. 
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                  when you visit our website or make a purchase. Please read this policy carefully.
                </p>
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Registered Office:</strong><br />
                    Ward No. 21, Door No. 553/1, Kavumpadi, Pallikkal<br />
                    Tirurangadi, Malappuram – 673634<br />
                    Kerala, India<br />
                    Phone: +91 99466 47442
                  </p>
                </div>
              </div>
            </section>

            {/* Information We Collect */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Information We Collect</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div>
                  <h3 className="font-medium text-foreground mb-2">Personal Information</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Full name and contact details (email, phone number)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Shipping and billing address
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Payment information (processed securely via Razorpay)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Order history and preferences
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">Automatically Collected Information</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      IP address and browser type
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Device information and operating system
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      Pages visited and time spent on site
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-green-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">How We Use Your Information</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Process and fulfill your orders
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Send order confirmations, shipping updates, and delivery notifications
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Provide customer support and respond to inquiries
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Send promotional offers and newsletters (with your consent)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Improve our website and services
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Prevent fraud and maintain security
                  </li>
                </ul>
              </div>
            </section>

            {/* Data Security */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-purple-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Data Security</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    We use SSL encryption for all data transmission
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Payment processing is handled by Razorpay with PCI-DSS compliance
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    We do not store credit card or debit card details on our servers
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Access to personal data is restricted to authorized personnel only
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Regular security audits and updates are performed
                  </li>
                </ul>
              </div>
            </section>

            {/* Information Sharing */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Information Sharing</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <p className="text-muted-foreground mb-4">
                  We do not sell, trade, or rent your personal information. We may share your data with:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <strong>Shipping Partners:</strong> To deliver your orders (name, address, phone)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <strong>Payment Processors:</strong> Razorpay for secure payment processing
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <strong>Legal Authorities:</strong> When required by law or to protect our rights
                  </li>
                </ul>
              </div>
            </section>

            {/* Cookies */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-yellow-500" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Cookies</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <p className="text-muted-foreground mb-4">
                  We use cookies and similar technologies to:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Remember your preferences and cart items
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Analyze website traffic and usage patterns
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Provide personalized shopping experience
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  You can control cookies through your browser settings.
                </p>
              </div>
            </section>

            {/* Your Rights */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-heading text-foreground">Your Rights</h2>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <p className="text-muted-foreground mb-4">You have the right to:</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Access your personal data stored with us
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Request correction of inaccurate information
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Request deletion of your data (subject to legal requirements)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Opt-out of marketing communications
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Withdraw consent at any time
                  </li>
                </ul>
              </div>
            </section>

            {/* Contact */}
            <section className="text-center p-8 bg-card border border-border rounded-xl">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-heading text-foreground">Contact Us</h3>
              </div>
              <p className="text-muted-foreground mb-2">
                For privacy-related queries, contact us at:
              </p>
              <p className="text-muted-foreground mb-4">
                <a href="mailto:privacy@raynadamperfume.com" className="text-primary hover:underline">privacy@raynadamperfume.com</a>
                <br />
                Phone: <a href="tel:+919946647442" className="text-primary hover:underline">+91 99466 47442</a>
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

export default memo(PrivacyPolicy);
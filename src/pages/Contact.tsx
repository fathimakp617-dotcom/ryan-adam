import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import ContactSection from "@/components/Contact";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";

const Contact = () => {
  return (
    <>
      <Helmet>
        <title>Contact Us | Rayn Adam Luxury Perfumes India</title>
        <meta
          name="description"
          content="Contact Rayn Adam for luxury perfume inquiries, orders, and support. Located in Kerala, India. Email, phone, and WhatsApp support available."
        />
        <meta name="keywords" content="contact Rayn Adam, perfume store Kerala, luxury fragrance India, customer support" />
        <link rel="canonical" href="https://ryanadamperfume.lovable.app/contact" />
      </Helmet>

      <PageTransition>
        <main className="min-h-screen bg-background">
          <Navbar />
          <div className="pt-20">
            <ContactSection />
          </div>
          <Footer />
        </main>
      </PageTransition>
    </>
  );
};

export default Contact;

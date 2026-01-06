import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import ContactSection from "@/components/Contact";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";

const Contact = () => {
  return (
    <>
      <Helmet>
        <title>Contact Us | Rayn Adam</title>
        <meta
          name="description"
          content="Get in touch with Rayn Adam. We'd love to hear from you about our luxury fragrances."
        />
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

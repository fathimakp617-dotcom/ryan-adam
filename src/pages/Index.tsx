import { Suspense, lazy } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PageTransition from "@/components/PageTransition";

// Lazy load below-fold components
const Collection = lazy(() => import("@/components/Collection"));
const About = lazy(() => import("@/components/About"));
const Contact = lazy(() => import("@/components/Contact"));
const Footer = lazy(() => import("@/components/Footer"));
const OrderSuccessModal = lazy(() => import("@/components/OrderSuccessModal"));
const CookieConsent = lazy(() => import("@/components/CookieConsent"));

const SectionLoader = () => (
  <div className="py-12 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Rayn Adam | Luxury Perfume Collection</title>
        <meta
          name="description"
          content="Discover the essence of sophistication with Rayn Adam's exclusive collection of luxury fragrances. Crafted from the finest natural ingredients."
        />
        <meta
          name="keywords"
          content="luxury perfume, eau de parfum, Rayn Adam, fragrance, premium scents"
        />
      </Helmet>

      {/* Defer modals loading */}
      <Suspense fallback={null}>
        <OrderSuccessModal />
        <CookieConsent />
      </Suspense>

      <PageTransition>
        <main className="min-h-screen bg-background relative z-10">
          <Navbar />
          <Hero />
          
          {/* Lazy load below-the-fold content */}
          <Suspense fallback={<SectionLoader />}>
            <Collection />
          </Suspense>
          
          <Suspense fallback={<SectionLoader />}>
            <About />
          </Suspense>
          
          <Suspense fallback={<SectionLoader />}>
            <Contact />
          </Suspense>
          
          <Suspense fallback={<SectionLoader />}>
            <Footer />
          </Suspense>
        </main>
      </PageTransition>
    </>
  );
};

export default Index;

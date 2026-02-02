import { Suspense, lazy } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PageTransition from "@/components/PageTransition";
import { OrganizationSchema, LocalBusinessSchema, WebsiteSchema } from "@/components/seo/JsonLd";

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
        <title>Rayn Adam | Premium Luxury Perfumes in India | Buy Online</title>
        <meta
          name="description"
          content="Shop Rayn Adam's exclusive luxury perfumes online in India. Premium Eau de Parfum, Attars & fragrance collections. Free shipping on orders. Discover your signature scent today."
        />
        <meta
          name="keywords"
          content="luxury perfume India, buy perfume online, Rayn Adam, eau de parfum, premium fragrance, attar, designer perfume, long lasting perfume, unisex perfume, gift set perfume"
        />
        <link rel="canonical" href="https://raynadamperfume.com/" />
      </Helmet>
      
      {/* Structured Data */}
      <OrganizationSchema />
      <LocalBusinessSchema />
      <WebsiteSchema />

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

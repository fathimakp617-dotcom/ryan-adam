import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Collection from "@/components/Collection";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import FloatingParticles from "@/components/FloatingParticles";
import PageTransition from "@/components/PageTransition";

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

      <FloatingParticles />

      <PageTransition>
        <main className="min-h-screen bg-background relative z-10">
          <Navbar />
          <Hero />
          <Collection />
          <About />
          <Contact />
          <Footer />
        </main>
      </PageTransition>
    </>
  );
};

export default Index;

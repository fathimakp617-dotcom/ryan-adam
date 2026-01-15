import { useState, useEffect, memo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import eliteMain from "@/assets/products/elite.jpg";
import amberCrownMain from "@/assets/products/amber-crown.jpg";
import legacyMain from "@/assets/products/legacy.jpg";
import comboMain from "@/assets/products/combo.jpg";

const slides = [
  {
    image: eliteMain,
    title: "ELITE",
    subtitle: "Smooth & Seductive",
  },
  {
    image: amberCrownMain,
    title: "AMBER CROWN",
    subtitle: "Romantic & Enchanting",
  },
  {
    image: legacyMain,
    title: "LEGACY",
    subtitle: "Warm & Captivating",
  },
  {
    image: comboMain,
    title: "COMBO",
    subtitle: "Fresh & Invigorating",
  },
];

// Preload first image immediately
const preloadFirstImage = () => {
  const img = new Image();
  img.src = eliteMain;
};
preloadFirstImage();

const Hero = memo(() => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set([0]));

  // Preload next slides in the background
  useEffect(() => {
    const preloadImages = () => {
      slides.forEach((slide, index) => {
        if (index !== 0) {
          const img = new Image();
          img.onload = () => {
            setImagesLoaded(prev => new Set([...prev, index]));
          };
          img.src = slide.image;
        }
      });
    };
    
    // Delay preloading other images
    const timer = setTimeout(preloadImages, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-end overflow-hidden pb-32 sm:pb-0 sm:items-center"
    >
      {/* Background Slideshow */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0"
        >
          <img
            src={slides[currentSlide].image}
            alt={slides[currentSlide].title}
            className="w-full h-full object-cover object-center"
            loading={currentSlide === 0 ? "eager" : "lazy"}
            decoding="async"
          />
          {/* Dark overlay - stronger on mobile for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40 sm:bg-gradient-to-r sm:from-background/95 sm:via-background/70 sm:to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent sm:from-background sm:via-transparent sm:to-background/50" />
        </motion.div>
      </AnimatePresence>

      {/* Gold accent gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(35_49%_44%_/_0.15)_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(35_49%_44%_/_0.1)_0%,_transparent_50%)]" />

      <div className="container mx-auto px-6 sm:px-6 lg:px-12 relative z-10">
        <div className="max-w-2xl">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-5 sm:space-y-8"
          >
            {/* Brand tag */}
            <p className="text-xs tracking-[0.3em] sm:tracking-[0.4em] text-primary">
              EAU DE PARFUM
            </p>

            {/* Main heading */}
            <div className="space-y-1">
              <h1 className="text-5xl sm:text-5xl md:text-7xl lg:text-8xl font-heading tracking-tight leading-[0.9]">
                <span className="block text-foreground">LUXURY</span>
                <span className="block text-gold-gradient">PERFUME</span>
              </h1>
            </div>

            {/* Current Slide Info */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="py-2"
              >
                <p className="text-lg sm:text-2xl font-heading tracking-[0.15em] sm:tracking-[0.2em] text-primary">
                  {slides[currentSlide].title}
                </p>
                <p className="text-sm text-muted-foreground tracking-wider mt-1">
                  {slides[currentSlide].subtitle}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Description - hidden on small mobile */}
            <p className="hidden sm:block text-base sm:text-lg text-muted-foreground max-w-md leading-relaxed">
              Discover the essence of sophistication with our exclusive collection 
              of luxurious fragrances crafted for the discerning individual.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 pt-2 sm:pt-0 sm:flex-row sm:gap-4">
              <Link to="/shop" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-10 py-5 sm:py-6 text-xs sm:text-sm tracking-widest font-medium transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
                >
                  SHOP NOW
                </Button>
              </Link>
              <a href="#collection" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-primary/50 text-primary hover:bg-primary/10 px-6 sm:px-10 py-5 sm:py-6 text-xs sm:text-sm tracking-widest font-medium transition-all duration-300"
                >
                  EXPLORE COLLECTION
                </Button>
              </a>
            </div>
          </motion.div>
        </div>

        {/* Slide Indicators - visible on all screens */}
        <div className="flex gap-2 sm:gap-3 mt-6 sm:mt-0 sm:absolute sm:bottom-16 sm:left-6 lg:left-12">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 sm:h-1 rounded-full transition-all duration-500 ${
                index === currentSlide
                  ? "w-8 sm:w-12 bg-primary"
                  : "w-4 sm:w-6 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Scroll indicator - desktop only */}
      <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 hidden sm:block">
        <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center">
          <div className="w-1.5 h-3 bg-primary rounded-full mt-2" />
        </div>
      </div>
    </section>
  );
});

Hero.displayName = "Hero";

export default Hero;

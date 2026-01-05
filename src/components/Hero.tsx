import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import blancElegance from "@/assets/products/blanc-elegance.jpg";
import noirIntense from "@/assets/products/noir-intense.jpg";
import rougePassion from "@/assets/products/rouge-passion.jpg";
import elite from "@/assets/products/elite.jpg";

const slides = [
  {
    image: blancElegance,
    title: "BLANC",
    subtitle: "Fresh & Elegant",
  },
  {
    image: noirIntense,
    title: "NOIR",
    subtitle: "Bold & Mysterious",
  },
  {
    image: rougePassion,
    title: "ROUGE",
    subtitle: "Rich & Sensual",
  },
  {
    image: elite,
    title: "ELITE",
    subtitle: "Majestic & Opulent",
  },
];

// Preload first image immediately
const preloadFirstImage = () => {
  const img = new Image();
  img.src = blancElegance;
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
      className="relative min-h-screen flex items-center overflow-hidden"
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
            className="w-full h-full object-cover"
            loading={currentSlide === 0 ? "eager" : "lazy"}
            decoding="async"
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
        </motion.div>
      </AnimatePresence>

      {/* Gold accent gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(35_49%_44%_/_0.15)_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(35_49%_44%_/_0.1)_0%,_transparent_50%)]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 pt-24 relative z-10">
        <div className="max-w-2xl">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 sm:space-y-8"
          >
            <div className="space-y-3 sm:space-y-4">
              <p className="text-xs sm:text-sm tracking-[0.3em] sm:tracking-[0.4em] text-primary">
                EAU DE PARFUM
              </p>
              <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-heading tracking-tight leading-none">
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
                className="space-y-1"
              >
                <p className="text-xl sm:text-2xl font-heading tracking-[0.2em] text-primary">
                  {slides[currentSlide].title}
                </p>
                <p className="text-sm sm:text-base text-muted-foreground tracking-wider">
                  {slides[currentSlide].subtitle}
                </p>
              </motion.div>
            </AnimatePresence>

            <p className="text-base sm:text-lg text-muted-foreground max-w-md leading-relaxed">
              Discover the essence of sophistication with our exclusive collection 
              of luxurious fragrances crafted for the discerning individual.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link to="/shop">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-8 sm:px-10 py-5 sm:py-6 text-sm tracking-widest font-medium transition-all duration-300 hover:shadow-[0_0_30px_hsl(35_49%_44%_/_0.4)]"
                >
                  SHOP NOW
                </Button>
              </Link>
              <a href="#collection">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-primary/50 text-primary hover:bg-primary/10 px-8 sm:px-10 py-5 sm:py-6 text-sm tracking-widest font-medium transition-all duration-300"
                >
                  EXPLORE
                </Button>
              </a>
            </div>
          </motion.div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-24 sm:bottom-16 left-4 sm:left-6 lg:left-12 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1 transition-all duration-500 ${
                index === currentSlide
                  ? "w-8 sm:w-12 bg-primary"
                  : "w-4 sm:w-6 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Scroll indicator - desktop only, static on mobile */}
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

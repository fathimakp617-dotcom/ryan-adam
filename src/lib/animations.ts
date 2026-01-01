import { Variants } from "framer-motion";

// Ultra-fast, minimal animations for snappy performance
const quickEase: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.2, ease: quickEase }
  }
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.15, ease: quickEase }
  }
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.2, ease: quickEase }
  }
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 12 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.2, ease: quickEase }
  }
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.15, ease: quickEase }
  }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.01
    }
  }
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.15, ease: quickEase }
  }
};

export const revealFromBottom: Variants = {
  hidden: { 
    opacity: 0, 
    y: 15,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.2, ease: quickEase }
  }
};

export const lineReveal: Variants = {
  hidden: { scaleX: 0 },
  visible: { 
    scaleX: 1,
    transition: { duration: 0.2, ease: quickEase }
  }
};

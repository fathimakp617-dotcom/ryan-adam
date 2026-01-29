// Product Images
import eliteMain from "@/assets/products/elite.jpg";
import amberCrownMain from "@/assets/products/amber-crown.jpg";
import amberCrown2 from "@/assets/products/amber-crown-2.jpg";
import amberCrown3 from "@/assets/products/amber-crown-3.jpg";
import legacyMain from "@/assets/products/legacy.jpg";
import comboMain from "@/assets/products/combo.jpg";
import combo2 from "@/assets/products/combo-2.jpg";
import amberCrownAttar from "@/assets/products/amber-crown-attar.jpg";
import amberCrownEdp from "@/assets/products/amber-crown-edp.png";
import amberCrownSolid from "@/assets/products/amber-crown-solid.png";
import amberCrownCollection from "@/assets/products/amber-crown-collection.png";

export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  story: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  category: string;
  size: string;
  image: string;
  gallery: string[];
  notes: {
    top: string[];
    heart: string[];
    base: string[];
  };
  ingredients: string[];
  concentration: string;
  longevity: string;
  sillage: string;
  season: string[];
  occasion: string[];
}

export const products: Product[] = [
  {
    id: "combo",
    name: "COMBO",
    tagline: "Fresh & Invigorating",
    description: "A burst of Mediterranean sunshine, Combo awakens the senses with its vibrant blend of Italian citrus and aromatic herbs. Pure energy in a bottle.",
    story: "Capturing the spirit of the Amalfi Coast, Combo features hand-pressed Calabrian bergamot and Sicilian lemon. It's a celebration of life, light, and the joy of summer.",
    price: 444,
    originalPrice: 888,
    discountPercent: 50,
    category: "Unisex",
    size: "3ml PER BOTTLE",
    image: comboMain,
    gallery: [comboMain, combo2, comboMain],
    notes: {
      top: ["Bergamot", "Sicilian Lemon", "Grapefruit"],
      heart: ["Neroli", "Lavender", "Rosemary"],
      base: ["Vetiver", "White Musk", "Cedar"]
    },
    ingredients: ["Alcohol Denat", "Parfum", "Aqua", "Limonene", "Linalool", "Citral", "Geraniol"],
    concentration: "Eau de Parfum",
    longevity: "6-8 hours",
    sillage: "Moderate",
    season: ["Spring", "Summer"],
    occasion: ["Daily Wear", "Office", "Beach", "Sports"]
  },
  {
    id: "elite",
    name: "ELITE",
    tagline: "Smooth & Seductive",
    description: "Like the caress of midnight silk, Elite envelops you in an embrace of jasmine and patchouli. This sensuous fragrance is for those who live for the night.",
    story: "Inspired by the glamour of 1920s Paris, Elite captures the essence of sophistication and allure. The jasmine is sourced from Grasse, the perfume capital of the world.",
    price: 444,
    originalPrice: 888,
    discountPercent: 50,
    category: "Unisex",
    size: "12ml",
    image: eliteMain,
    gallery: [eliteMain, eliteMain, eliteMain],
    notes: {
      top: ["Bergamot", "Black Currant", "Pink Pepper"],
      heart: ["Jasmine Sambac", "Tuberose", "Iris"],
      base: ["Patchouli", "Amber", "Vanilla"]
    },
    ingredients: ["Alcohol Denat", "Parfum", "Aqua", "Linalool", "Benzyl Benzoate", "Coumarin", "Limonene"],
    concentration: "Eau de Parfum",
    longevity: "10-12 hours",
    sillage: "Strong",
    season: ["Fall", "Winter", "Spring"],
    occasion: ["Evening", "Cocktail Party", "Date Night"]
  },
  {
    id: "amber-crown",
    name: "AMBER CROWN",
    tagline: "Romantic & Enchanting",
    description: "A celebration of the queen of flowers, Amber Crown is a romantic masterpiece that captures the essence of a thousand petals. Delicate yet unforgettable.",
    story: "Each bottle of Amber Crown contains the essence of 10,000 rose petals, hand-picked at the perfect moment of bloom. This fragrance is our tribute to eternal romance.",
    price: 444,
    originalPrice: 888,
    discountPercent: 50,
    category: "Unisex",
    size: "12ml",
    image: amberCrownMain,
    gallery: [amberCrownMain, amberCrown2, amberCrown3],
    notes: {
      top: ["Rose Petals", "Lychee", "Bergamot"],
      heart: ["Damask Rose", "Peony", "Magnolia"],
      base: ["White Musk", "Cedar", "Ambroxan"]
    },
    ingredients: ["Alcohol Denat", "Parfum", "Aqua", "Citronellol", "Geraniol", "Linalool", "Hydroxycitronellal"],
    concentration: "Eau de Parfum",
    longevity: "8-10 hours",
    sillage: "Moderate",
    season: ["Spring", "Summer"],
    occasion: ["Wedding", "Romantic Dinner", "Garden Party"]
  },
  {
    id: "legacy",
    name: "LEGACY",
    tagline: "Warm & Captivating",
    description: "A golden nectar of warmth and comfort, Legacy wraps you in a cocoon of precious resins and vanilla. This addictive scent is liquid gold for the soul.",
    story: "Inspired by ancient Arabian traditions, Legacy uses amber sourced from the Baltic Sea, aged for centuries. Combined with Madagascar vanilla, it creates an irresistible warmth.",
    price: 444,
    originalPrice: 888,
    discountPercent: 50,
    category: "Unisex",
    size: "12ml",
    image: legacyMain,
    gallery: [legacyMain, legacyMain, legacyMain],
    notes: {
      top: ["Orange Blossom", "Cinnamon", "Cardamom"],
      heart: ["Amber", "Benzoin", "Labdanum"],
      base: ["Vanilla", "Tonka Bean", "Sandalwood"]
    },
    ingredients: ["Alcohol Denat", "Parfum", "Aqua", "Coumarin", "Benzyl Benzoate", "Limonene", "Linalool"],
    concentration: "Eau de Parfum",
    longevity: "10-12 hours",
    sillage: "Moderate to Strong",
    season: ["Fall", "Winter"],
    occasion: ["Daily Wear", "Cozy Evenings", "Date Night"]
  },
  {
    id: "amber-crown-attar",
    name: "AMBER CROWN ATTAR",
    tagline: "Pure & Concentrated",
    description: "The purest form of Amber Crown, this concentrated attar oil delivers an intense, long-lasting fragrance experience. A single drop creates an aura of warmth and sophistication.",
    story: "Crafted using traditional methods passed down through generations, our Amber Crown Attar captures the soul of amber in its most authentic form. Each bottle contains weeks of careful distillation.",
    price: 299,
    originalPrice: 599,
    discountPercent: 50,
    category: "Unisex",
    size: "3ml",
    image: amberCrownAttar,
    gallery: [amberCrownAttar, amberCrownCollection, amberCrownAttar],
    notes: {
      top: ["Saffron", "Cardamom", "Bergamot"],
      heart: ["Rose Absolute", "Amber", "Labdanum"],
      base: ["Sandalwood", "Musk", "Vanilla"]
    },
    ingredients: ["Natural Amber Extract", "Sandalwood Oil", "Rose Absolute", "Saffron", "Vanilla Extract"],
    concentration: "Perfume Oil (Attar)",
    longevity: "12-16 hours",
    sillage: "Intimate to Moderate",
    season: ["Fall", "Winter"],
    occasion: ["Special Occasions", "Evenings", "Traditional Events"]
  },
  {
    id: "amber-crown-edp",
    name: "AMBER CROWN EDP",
    tagline: "Elegant & Refined",
    description: "The signature Amber Crown experience in an elegant spray format. This Eau de Parfum offers the perfect balance of projection and longevity for everyday luxury.",
    story: "Our master perfumers spent years perfecting this EDP formulation, ensuring every spray releases a harmonious symphony of amber, florals, and precious woods.",
    price: 599,
    originalPrice: 1199,
    discountPercent: 50,
    category: "Unisex",
    size: "12ml",
    image: amberCrownEdp,
    gallery: [amberCrownEdp, amberCrownCollection, amberCrownEdp],
    notes: {
      top: ["Orange Blossom", "Pink Pepper", "Bergamot"],
      heart: ["Damask Rose", "Amber", "Jasmine"],
      base: ["Sandalwood", "Tonka Bean", "White Musk"]
    },
    ingredients: ["Alcohol Denat", "Parfum", "Aqua", "Benzyl Benzoate", "Coumarin", "Linalool"],
    concentration: "Eau de Parfum",
    longevity: "8-10 hours",
    sillage: "Moderate to Strong",
    season: ["Fall", "Winter", "Spring"],
    occasion: ["Daily Wear", "Office", "Date Night", "Special Events"]
  },
  {
    id: "amber-crown-solid",
    name: "AMBER CROWN SOLID",
    tagline: "Portable & Luxurious",
    description: "Experience Amber Crown in its most travel-friendly form. This solid perfume balm glides on smoothly, releasing a subtle yet captivating scent throughout the day.",
    story: "Inspired by ancient perfume traditions, our solid perfume is crafted with nourishing oils and waxes, making it gentle on skin while delivering the luxurious Amber Crown experience.",
    price: 249,
    originalPrice: 499,
    discountPercent: 50,
    category: "Unisex",
    size: "9g",
    image: amberCrownSolid,
    gallery: [amberCrownSolid, amberCrownCollection, amberCrownSolid],
    notes: {
      top: ["Honey", "Cardamom", "Mandarin"],
      heart: ["Amber", "Rose", "Benzoin"],
      base: ["Vanilla", "Sandalwood", "Cedarwood"]
    },
    ingredients: ["Beeswax", "Jojoba Oil", "Parfum", "Coconut Oil", "Vitamin E"],
    concentration: "Solid Perfume Balm",
    longevity: "4-6 hours",
    sillage: "Intimate",
    season: ["All Seasons"],
    occasion: ["Daily Wear", "Travel", "Touch-ups", "Layering"]
  }
];

export const getProductById = (id: string): Product | undefined => {
  return products.find(p => p.id === id);
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
};

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
import eliteCollection from "@/assets/products/elite-collection.png";
import eliteAttar from "@/assets/products/elite-attar.png";
import eliteEdp from "@/assets/products/elite-edp.png";
import eliteSolid from "@/assets/products/elite-solid.png";
import sportyNightCollection from "@/assets/products/sporty-night-collection.png";
import sportyNightAttar from "@/assets/products/sporty-night-attar.png";
import sportyNightEdp from "@/assets/products/sporty-night-edp.png";
import sportyNightSolid from "@/assets/products/sporty-night-solid.png";
import sportyNightCombo from "@/assets/products/sporty-night-combo.png";
import sportyNightComboAttar from "@/assets/products/sporty-night-combo-attar.png";
import sportyNightComboEdp from "@/assets/products/sporty-night-combo-edp.png";
import sportyNightComboWax from "@/assets/products/sporty-night-combo-wax.png";

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
    id: "amber-crown-collection",
    name: "AMBER CROWN COLLECTION",
    tagline: "Complete Luxury Set",
    description: "The ultimate Amber Crown experience — a luxurious trio featuring the concentrated Attar (3ml), elegant Eau de Parfum spray (8ml), and portable Solid Perfume cream (8ml). Three formats, one signature scent.",
    story: "Crafted for the true fragrance connoisseur, this collection offers versatility for every occasion. Layer them for depth, or choose based on your mood — from intimate attar moments to bold EDP statements.",
    price: 444,
    originalPrice: 888,
    discountPercent: 50,
    category: "Unisex",
    size: "Attar 3ml + EDP 8ml + Cream 8ml",
    image: amberCrownCollection,
    gallery: [amberCrownCollection, amberCrownAttar, amberCrownEdp, amberCrownSolid],
    notes: {
      top: ["Saffron", "Orange Blossom", "Cardamom"],
      heart: ["Amber", "Damask Rose", "Labdanum"],
      base: ["Sandalwood", "Vanilla", "White Musk"]
    },
    ingredients: ["Alcohol Denat", "Parfum", "Natural Amber Extract", "Sandalwood Oil", "Beeswax", "Jojoba Oil"],
    concentration: "Attar + EDP + Solid Cream",
    longevity: "8-16 hours",
    sillage: "Intimate to Strong",
    season: ["Fall", "Winter", "Spring"],
    occasion: ["Daily Wear", "Special Occasions", "Gifting", "Travel"]
  },
  {
    id: "elite-collection",
    name: "ELITE COLLECTION",
    tagline: "Complete Luxury Set",
    description: "The ultimate Elite experience — a luxurious trio featuring the concentrated Attar (3ml), elegant Eau de Parfum spray (8ml), and portable Solid Perfume cream (8ml). Three formats, one signature scent.",
    story: "Crafted for the true fragrance connoisseur, this collection captures the essence of 1920s Paris glamour in three versatile formats. Layer them for depth, or choose based on your mood — from intimate attar moments to bold EDP statements.",
    price: 444,
    originalPrice: 888,
    discountPercent: 50,
    category: "Unisex",
    size: "Attar 3ml + EDP 8ml + Cream 8ml",
    image: eliteCollection,
    gallery: [eliteCollection, eliteAttar, eliteEdp, eliteSolid],
    notes: {
      top: ["Bergamot", "Black Currant", "Pink Pepper"],
      heart: ["Jasmine Sambac", "Tuberose", "Iris"],
      base: ["Patchouli", "Amber", "Vanilla"]
    },
    ingredients: ["Alcohol Denat", "Parfum", "Natural Jasmine Extract", "Patchouli Oil", "Beeswax", "Jojoba Oil"],
    concentration: "Attar + EDP + Solid Cream",
    longevity: "10-16 hours",
    sillage: "Moderate to Strong",
    season: ["Fall", "Winter", "Spring"],
    occasion: ["Evening", "Cocktail Party", "Date Night", "Special Occasions"]
  },
  {
    id: "sporty-night-collection",
    name: "SPORTY NIGHT COLLECTION",
    tagline: "Complete Luxury Set",
    description: "The ultimate Sporty Night experience — a luxurious trio featuring the concentrated Attar (3ml), elegant Eau de Parfum spray (8ml), and portable Solid Perfume Wax (8ml). Light, fresh, and invigorating.",
    story: "Designed for the modern athlete and adventurer, Sporty Night captures the energy of a champion. Three versatile formats let you stay fresh from the gym to the evening out.",
    price: 444,
    originalPrice: 888,
    discountPercent: 50,
    category: "Combo",
    size: "Attar 3ml + EDP 8ml + Wax 8ml",
    image: sportyNightCollection,
    gallery: [sportyNightCollection, sportyNightAttar, sportyNightEdp, sportyNightSolid],
    notes: {
      top: ["Bergamot", "Green Apple", "Mint"],
      heart: ["Lavender", "Geranium", "Cardamom"],
      base: ["Cedarwood", "Musk", "Vetiver"]
    },
    ingredients: ["Alcohol Denat", "Parfum", "Natural Mint Extract", "Cedarwood Oil", "Beeswax", "Jojoba Oil"],
    concentration: "Attar + EDP + Solid Wax",
    longevity: "6-10 hours",
    sillage: "Light to Moderate",
    season: ["All Seasons"],
    occasion: ["Sports", "Daily Wear", "Evening", "Travel"]
  },
  {
    id: "sporty-night-combo",
    name: "SPORTY NIGHT COMBO",
    tagline: "Premium Full-Size Set",
    description: "The premium Sporty Night experience — featuring a full-size Attar (12ml), large Eau de Parfum spray (30ml), and Solid Perfume Wax (8ml). Light, fresh, and long-lasting.",
    story: "For those who want the complete Sporty Night experience in generous sizes. The full-size Attar delivers intense concentration, the 30ml EDP provides all-day freshness, and the portable wax keeps you topped up on the go.",
    price: 888,
    originalPrice: 1111,
    discountPercent: 20,
    category: "Combo",
    size: "Attar 12ml + EDP 30ml + Wax 8ml",
    image: sportyNightCombo,
    gallery: [sportyNightCombo, sportyNightComboAttar, sportyNightComboEdp, sportyNightComboWax],
    notes: {
      top: ["Bergamot", "Green Apple", "Mint"],
      heart: ["Lavender", "Geranium", "Cardamom"],
      base: ["Cedarwood", "Musk", "Vetiver"]
    },
    ingredients: ["Alcohol Denat", "Parfum", "Natural Mint Extract", "Cedarwood Oil", "Beeswax", "Jojoba Oil"],
    concentration: "Attar + EDP + Solid Wax",
    longevity: "8-14 hours",
    sillage: "Light to Moderate",
    season: ["All Seasons"],
    occasion: ["Sports", "Daily Wear", "Evening", "Travel"]
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

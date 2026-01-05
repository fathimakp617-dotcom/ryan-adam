// Product Images - Organized by product folder
import velvetNightMain from "@/assets/perfumes/velvet-night/main.jpg";
import divineRoseMain from "@/assets/perfumes/divine-rose/main.jpg";
import amberElixirMain from "@/assets/perfumes/amber-elixir/main.jpg";
import citrusAuraMain from "@/assets/perfumes/citrus-aura/main.jpg";

export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  story: string;
  price: number;
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
    id: "velvet-night",
    name: "ELITE",
    tagline: "Smooth & Seductive",
    description: "Like the caress of midnight silk, Velvet Night envelops you in an embrace of jasmine and patchouli. This sensuous fragrance is for those who live for the night.",
    story: "Inspired by the glamour of 1920s Paris, Velvet Night captures the essence of sophistication and allure. The jasmine is sourced from Grasse, the perfume capital of the world.",
    price: 444,
    category: "Unisex",
    size: "8ml",
    image: velvetNightMain,
    gallery: [velvetNightMain, velvetNightMain, velvetNightMain],
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
    id: "divine-rose",
    name: "AMBER CROWN",
    tagline: "Romantic & Enchanting",
    description: "A celebration of the queen of flowers, Divine Rose is a romantic masterpiece that captures the essence of a thousand petals. Delicate yet unforgettable.",
    story: "Each bottle of Divine Rose contains the essence of 10,000 rose petals, hand-picked at the perfect moment of bloom. This fragrance is our tribute to eternal romance.",
    price: 444,
    category: "Unisex",
    size: "8ml",
    image: divineRoseMain,
    gallery: [divineRoseMain, divineRoseMain, divineRoseMain],
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
    id: "amber-elixir",
    name: "LEGACY",
    tagline: "Warm & Captivating",
    description: "A golden nectar of warmth and comfort, Amber Elixir wraps you in a cocoon of precious resins and vanilla. This addictive scent is liquid gold for the soul.",
    story: "Inspired by ancient Arabian traditions, Amber Elixir uses amber sourced from the Baltic Sea, aged for centuries. Combined with Madagascar vanilla, it creates an irresistible warmth.",
    price: 444,
    category: "Unisex",
    size: "8ml",
    image: amberElixirMain,
    gallery: [amberElixirMain, amberElixirMain, amberElixirMain],
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
    id: "citrus-aura",
    name: "COMBO",
    tagline: "Fresh & Invigorating",
    description: "A burst of Mediterranean sunshine, Citrus Aura awakens the senses with its vibrant blend of Italian citrus and aromatic herbs. Pure energy in a bottle.",
    story: "Capturing the spirit of the Amalfi Coast, Citrus Aura features hand-pressed Calabrian bergamot and Sicilian lemon. It's a celebration of life, light, and the joy of summer.",
    price: 444,
    category: "Unisex",
    size: "8ml PER BOTTLE",
    image: citrusAuraMain,
    gallery: [citrusAuraMain, citrusAuraMain, citrusAuraMain],
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

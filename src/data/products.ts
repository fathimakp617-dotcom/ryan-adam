// Product Images - Organized by product folder
import noirIntenseMain from "@/assets/perfumes/noir-intense/main.jpg";
import blancEleganceMain from "@/assets/perfumes/blanc-elegance/main.jpg";
import rougePassionMain from "@/assets/perfumes/rouge-passion/main.jpg";
import oudRoyalMain from "@/assets/perfumes/oud-royal/main.jpg";
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
    id: "noir-intense",
    name: "NOIR INTENSE",
    tagline: "Bold & Mysterious",
    description: "A captivating symphony of rare oud and smoky leather, Noir Intense is crafted for those who dare to stand apart. This opulent fragrance opens with a burst of spicy saffron before revealing its dark, mysterious heart.",
    story: "Inspired by moonlit nights in the Arabian desert, Noir Intense captures the essence of mystery and allure. Each bottle contains precious oud aged for over 50 years, hand-selected by our master perfumer during his travels through the ancient forests of Southeast Asia.",
    price: 444,
    category: "For Him",
    size: "100ml",
    image: noirIntenseMain,
    gallery: [noirIntenseMain, noirIntenseMain, noirIntenseMain],
    notes: {
      top: ["Saffron", "Black Pepper", "Bergamot"],
      heart: ["Oud", "Rose Absolute", "Leather"],
      base: ["Amber", "Musk", "Sandalwood"]
    },
    ingredients: ["Alcohol Denat", "Parfum", "Aqua", "Limonene", "Linalool", "Coumarin", "Citronellol"],
    concentration: "Eau de Parfum",
    longevity: "10-12 hours",
    sillage: "Strong",
    season: ["Fall", "Winter"],
    occasion: ["Evening", "Special Occasions", "Date Night"]
  },
  {
    id: "blanc-elegance",
    name: "BLANC ELEGANCE",
    tagline: "Fresh & Elegant",
    description: "A breath of pure sophistication, Blanc Elegance embodies timeless grace with its pristine blend of white florals and crystalline musks. This luminous creation speaks to the refined spirit.",
    story: "Born from the morning dew of Mediterranean gardens, Blanc Elegance is our ode to understated luxury. The white musk at its core is ethically sourced and represents purity in its most elegant form.",
    price: 444,
    category: "Unisex",
    size: "100ml",
    image: blancEleganceMain,
    gallery: [blancEleganceMain, blancEleganceMain, blancEleganceMain],
    notes: {
      top: ["Bergamot", "Lemon Zest", "Pink Pepper"],
      heart: ["White Tea", "Jasmine", "Lily of the Valley"],
      base: ["White Musk", "Cedar", "Ambrette"]
    },
    ingredients: ["Alcohol Denat", "Parfum", "Aqua", "Linalool", "Hydroxycitronellal", "Citronellol", "Geraniol"],
    concentration: "Eau de Parfum",
    longevity: "8-10 hours",
    sillage: "Moderate",
    season: ["Spring", "Summer"],
    occasion: ["Daily Wear", "Office", "Brunch"]
  },
  {
    id: "rouge-passion",
    name: "ROUGE PASSION",
    tagline: "Rich & Sensual",
    description: "An intoxicating elixir of damask rose and precious saffron, Rouge Passion is the embodiment of desire. This sumptuous fragrance wraps you in warmth and seduction.",
    story: "Crafted from roses harvested at dawn in the valleys of Morocco, Rouge Passion tells a story of romance and intensity. The saffron threads are hand-picked from the fields of Kashmir, adding an exotic warmth to this passionate creation.",
    price: 444,
    category: "For Her",
    size: "100ml",
    image: rougePassionMain,
    gallery: [rougePassionMain, rougePassionMain, rougePassionMain],
    notes: {
      top: ["Saffron", "Raspberry", "Pink Pepper"],
      heart: ["Damask Rose", "Peony", "Oud"],
      base: ["Vanilla", "Amber", "White Musk"]
    },
    ingredients: ["Alcohol Denat", "Parfum", "Aqua", "Citronellol", "Geraniol", "Eugenol", "Linalool"],
    concentration: "Eau de Parfum",
    longevity: "10-12 hours",
    sillage: "Strong",
    season: ["Fall", "Winter"],
    occasion: ["Evening", "Date Night", "Special Occasions"]
  },
  {
    id: "oud-royal",
    name: "OUD ROYAL",
    tagline: "Majestic & Opulent",
    description: "The crown jewel of our collection, Oud Royal is an exquisite tribute to the King of Woods. This regal fragrance commands attention with its rich, complex character.",
    story: "Reserved for true connoisseurs, Oud Royal features the rarest Cambodian oud, aged in copper vessels for decades. This masterpiece took our perfumer five years to perfect, resulting in a scent of unparalleled depth.",
    price: 444,
    category: "For Him",
    size: "75ml",
    image: oudRoyalMain,
    gallery: [oudRoyalMain, oudRoyalMain, oudRoyalMain],
    notes: {
      top: ["Royal Saffron", "Cardamom", "Cinnamon"],
      heart: ["Cambodian Oud", "Bulgarian Rose", "Incense"],
      base: ["Sandalwood", "Musk", "Benzoin"]
    },
    ingredients: ["Alcohol Denat", "Parfum", "Aqua", "Coumarin", "Eugenol", "Cinnamal", "Linalool"],
    concentration: "Extrait de Parfum",
    longevity: "12+ hours",
    sillage: "Very Strong",
    season: ["Fall", "Winter"],
    occasion: ["Black Tie", "Special Occasions", "Evening"]
  },
  {
    id: "velvet-night",
    name: "VELVET NIGHT",
    tagline: "Smooth & Seductive",
    description: "Like the caress of midnight silk, Velvet Night envelops you in an embrace of jasmine and patchouli. This sensuous fragrance is for those who live for the night.",
    story: "Inspired by the glamour of 1920s Paris, Velvet Night captures the essence of sophistication and allure. The jasmine is sourced from Grasse, the perfume capital of the world.",
    price: 444,
    category: "Unisex",
    size: "100ml",
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
    name: "DIVINE ROSE",
    tagline: "Romantic & Enchanting",
    description: "A celebration of the queen of flowers, Divine Rose is a romantic masterpiece that captures the essence of a thousand petals. Delicate yet unforgettable.",
    story: "Each bottle of Divine Rose contains the essence of 10,000 rose petals, hand-picked at the perfect moment of bloom. This fragrance is our tribute to eternal romance.",
    price: 444,
    category: "For Her",
    size: "75ml",
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
    name: "AMBER ELIXIR",
    tagline: "Warm & Captivating",
    description: "A golden nectar of warmth and comfort, Amber Elixir wraps you in a cocoon of precious resins and vanilla. This addictive scent is liquid gold for the soul.",
    story: "Inspired by ancient Arabian traditions, Amber Elixir uses amber sourced from the Baltic Sea, aged for centuries. Combined with Madagascar vanilla, it creates an irresistible warmth.",
    price: 444,
    category: "Unisex",
    size: "100ml",
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
    name: "CITRUS AURA",
    tagline: "Fresh & Invigorating",
    description: "A burst of Mediterranean sunshine, Citrus Aura awakens the senses with its vibrant blend of Italian citrus and aromatic herbs. Pure energy in a bottle.",
    story: "Capturing the spirit of the Amalfi Coast, Citrus Aura features hand-pressed Calabrian bergamot and Sicilian lemon. It's a celebration of life, light, and the joy of summer.",
    price: 444,
    category: "For Him",
    size: "100ml",
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

// Product Images
import blancEleganceMain from "@/assets/products/blanc-elegance.jpg";
import noirIntenseMain from "@/assets/products/noir-intense.jpg";
import rougePassionMain from "@/assets/products/rouge-passion.jpg";
import eliteMain from "@/assets/products/elite.jpg";

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
    id: "elite",
    name: "ELITE",
    tagline: "Majestic & Opulent",
    description: "The crown jewel of our collection, Elite is an exquisite tribute to refined luxury. This regal fragrance commands attention with its rich, complex character and lasting impression.",
    story: "Reserved for true connoisseurs, Elite features the rarest ingredients, aged in copper vessels for decades. This masterpiece took our perfumer five years to perfect, resulting in a scent of unparalleled depth.",
    price: 444,
    category: "Unisex",
    size: "75ml",
    image: eliteMain,
    gallery: [eliteMain, eliteMain, eliteMain],
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

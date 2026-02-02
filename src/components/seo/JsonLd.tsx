import { Helmet } from "react-helmet-async";
import { Product as ProductType, products } from "@/data/products";

// Production domain
const SITE_URL = "https://raynadamperfume.com";

interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
}

export const OrganizationSchema = ({
  name = "Rayn Adam",
  url = SITE_URL,
  logo = "https://storage.googleapis.com/gpt-engineer-file-uploads/9WSefgywaLh9J3niX7t9kD3292V2/uploads/1767712360626-Asset_91_4x_imresizer-removebg-preview.png",
  description = "Discover the essence of sophistication with Rayn Adam's exclusive collection of luxury fragrances.",
}: OrganizationSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo,
    description,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-99466-47442",
      contactType: "customer service",
      availableLanguage: ["English", "Hindi"],
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Ward No. 21, Door No. 553/1, Kavumpadi, Pallikkal, Tirurangadi",
      addressLocality: "Malappuram",
      addressRegion: "Kerala",
      postalCode: "673634",
      addressCountry: "IN",
    },
    sameAs: [
      "https://instagram.com/raynadamperfume",
      "https://facebook.com/raynadamperfume",
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

interface ProductSchemaProps {
  product: ProductType;
  averageRating?: number;
  totalReviews?: number;
}

export const ProductSchema = ({ product, averageRating = 0, totalReviews = 0 }: ProductSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: `${SITE_URL}${product.image}`,
    brand: {
      "@type": "Brand",
      name: "Rayn Adam",
    },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.id}`,
      priceCurrency: "INR",
      price: product.price,
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Rayn Adam",
      },
    },
    ...(totalReviews > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: averageRating.toFixed(1),
        reviewCount: totalReviews,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    category: "Perfume",
    material: product.concentration,
    size: product.size,
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[];
}

export const BreadcrumbSchema = ({ items }: BreadcrumbSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export const LocalBusinessSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "Rayn Adam Luxury Perfumes",
    image: "https://storage.googleapis.com/gpt-engineer-file-uploads/9WSefgywaLh9J3niX7t9kD3292V2/social-images/social-1767808964506-ChatGPT Image Jan 4, 2026, 02_05_19 AM.png",
    "@id": SITE_URL,
    url: SITE_URL,
    telephone: "+91-99466-47442",
    priceRange: "₹₹₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Ward No. 21, Door No. 553/1, Kavumpadi, Pallikkal, Tirurangadi",
      addressLocality: "Malappuram",
      addressRegion: "Kerala",
      postalCode: "673634",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 11.0510,
      longitude: 75.9380,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "00:00",
      closes: "23:59",
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

export const WebsiteSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Rayn Adam Luxury Perfumes",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/shop?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

// FAQ Schema for perfume-related questions
export const FAQSchema = () => {
  const faqs = [
    {
      question: "How long do Rayn Adam perfumes last?",
      answer: "Our Eau de Parfum fragrances typically last 8-12 hours, while our concentrated Attars can last up to 16 hours. Longevity varies based on skin type, climate, and application method."
    },
    {
      question: "Are Rayn Adam perfumes unisex?",
      answer: "Yes, most of our fragrances are designed to be unisex and can be worn by anyone. Our collection includes versatile scents that transcend traditional gender boundaries."
    },
    {
      question: "Do you offer free shipping in India?",
      answer: "Yes, we offer free shipping on all orders above ₹999 within India. Orders typically arrive within 3-7 business days depending on your location."
    },
    {
      question: "What is the difference between Eau de Parfum and Attar?",
      answer: "Eau de Parfum contains 15-20% fragrance oils in an alcohol base, offering moderate projection. Attar is a concentrated oil-based perfume with no alcohol, providing intimate, long-lasting scent closer to the skin."
    },
    {
      question: "Can I return or exchange a perfume?",
      answer: "We accept returns within 7 days of delivery for unused, sealed products. Please check our Return Policy for complete details on exchanges and refunds."
    },
    {
      question: "How should I store my perfume?",
      answer: "Store your perfume in a cool, dark place away from direct sunlight and heat. Avoid keeping it in bathrooms where humidity and temperature fluctuate. Proper storage ensures your fragrance maintains its quality for years."
    }
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

// Collection/Shop Page Schema
export const CollectionPageSchema = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Luxury Perfume Collection | Rayn Adam",
    description: "Browse Rayn Adam's exclusive luxury perfume collection. Premium Eau de Parfum, Attars & gift sets with free shipping in India.",
    url: `${SITE_URL}/shop`,
    isPartOf: {
      "@type": "WebSite",
      name: "Rayn Adam",
      url: SITE_URL
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: product.name,
          description: product.tagline,
          image: `${SITE_URL}${product.image}`,
          url: `${SITE_URL}/product/${product.id}`,
          offers: {
            "@type": "Offer",
            priceCurrency: "INR",
            price: product.price,
            availability: "https://schema.org/InStock"
          }
        }
      }))
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
};

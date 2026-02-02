import { Helmet } from "react-helmet-async";
import { Product as ProductType } from "@/data/products";

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
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : SITE_URL;
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: `${baseUrl}${product.image}`,
    brand: {
      "@type": "Brand",
      name: "Rayn Adam",
    },
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/product/${product.id}`,
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
        ratingValue: averageRating,
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
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : SITE_URL;
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`,
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
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : SITE_URL;
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Rayn Adam Luxury Perfumes",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/shop?search={search_term_string}`,
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

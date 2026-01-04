import { useState, useMemo, memo } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Grid3X3, List, Filter, X, ChevronDown, ShoppingBag, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingParticles from "@/components/FloatingParticles";
import PageTransition from "@/components/PageTransition";
import ShopifyProductCard from "@/components/ShopifyProductCard";
import ShopifyCartDrawer from "@/components/ShopifyCartDrawer";
import { useShopifyProducts } from "@/hooks/useShopifyProducts";
import { useShopifyCartStore } from "@/stores/shopifyCartStore";
import { fadeInUp, staggerContainer } from "@/lib/animations";

const sortOptions = [
  { label: "Featured", value: "featured" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Name: A-Z", value: "name-asc" },
];

const Shop = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const { data: shopifyProducts, isLoading, error } = useShopifyProducts(50);
  const { getTotalItems } = useShopifyCartStore();
  const cartItemCount = getTotalItems();

  const filteredProducts = useMemo(() => {
    if (!shopifyProducts) return [];
    
    let result = [...shopifyProducts];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (product) =>
          product.node.title.toLowerCase().includes(query) ||
          product.node.description.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => 
          parseFloat(a.node.priceRange.minVariantPrice.amount) - 
          parseFloat(b.node.priceRange.minVariantPrice.amount)
        );
        break;
      case "price-desc":
        result.sort((a, b) => 
          parseFloat(b.node.priceRange.minVariantPrice.amount) - 
          parseFloat(a.node.priceRange.minVariantPrice.amount)
        );
        break;
      case "name-asc":
        result.sort((a, b) => a.node.title.localeCompare(b.node.title));
        break;
      default:
        break;
    }

    return result;
  }, [shopifyProducts, searchQuery, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setSortBy("featured");
  };

  const hasActiveFilters = searchQuery || sortBy !== "featured";

  return (
    <>
      <Helmet>
        <title>Shop | Rayn Adam Luxury Perfumes</title>
        <meta
          name="description"
          content="Browse our exclusive collection of luxury fragrances. Premium perfumes crafted from the finest natural ingredients."
        />
      </Helmet>

      <FloatingParticles />
      <ShopifyCartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <PageTransition>
        <main className="min-h-screen bg-background relative z-10">
          <Navbar />

          {/* Hero Banner */}
          <section className="pt-28 pb-16 bg-gradient-to-b from-charcoal to-background relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(35_49%_44%_/_0.08)_0%,_transparent_60%)]" />
            <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="text-center"
              >
                <motion.p variants={fadeInUp} className="text-sm tracking-[0.4em] text-primary mb-4">
                  EXPLORE
                </motion.p>
                <motion.h1 variants={fadeInUp} className="text-3xl sm:text-4xl md:text-6xl font-heading tracking-tight mb-6">
                  Our <span className="text-gold-gradient">Collection</span>
                </motion.h1>
                <motion.p variants={fadeInUp} className="text-muted-foreground max-w-2xl mx-auto">
                  Discover our exquisite range of luxury fragrances, each crafted
                  to perfection with the finest ingredients from around the world.
                </motion.p>
              </motion.div>
            </div>
          </section>

          {/* Filters & Products */}
          <section className="py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-12">
              {/* Search & Filter Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-col lg:flex-row gap-4 mb-8"
              >
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search fragrances..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 bg-card border-border/50 focus:border-primary rounded-xl"
                  />
                </div>

                {/* Filter Toggle (Mobile) */}
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden border-border/50 hover:border-primary rounded-xl"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  <ChevronDown
                    className={`w-4 h-4 ml-2 transition-transform ${
                      showFilters ? "rotate-180" : ""
                    }`}
                  />
                </Button>

                {/* Desktop Filters */}
                <div className="hidden lg:flex items-center gap-4">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-44 h-12 bg-card border-border/50 rounded-xl">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex border border-border/50 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-3 transition-colors ${
                        viewMode === "grid"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card hover:bg-muted"
                      }`}
                    >
                      <Grid3X3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-3 transition-colors ${
                        viewMode === "list"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card hover:bg-muted"
                      }`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Cart Button */}
                  <button
                    onClick={() => setIsCartOpen(true)}
                    className="relative p-3 border border-border/50 hover:border-primary rounded-xl transition-colors"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs flex items-center justify-center rounded-full">
                        {cartItemCount}
                      </span>
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Mobile Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="lg:hidden mb-8 space-y-4"
                  >
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full h-12 bg-card border-border/50 rounded-xl">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`p-3 rounded-xl transition-colors ${
                          viewMode === "grid"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border/50"
                        }`}
                      >
                        <Grid3X3 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`p-3 rounded-xl transition-colors ${
                          viewMode === "list"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border/50"
                        }`}
                      >
                        <List className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setIsCartOpen(true)}
                        className="relative p-3 rounded-xl bg-card border border-border/50"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        {cartItemCount > 0 && (
                          <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs flex items-center justify-center rounded-full">
                            {cartItemCount}
                          </span>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Active Filters */}
              {hasActiveFilters && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 mb-6 flex-wrap"
                >
                  <span className="text-sm text-muted-foreground">
                    Active filters:
                  </span>
                  {searchQuery && (
                    <span className="px-3 py-1 bg-card border border-border/50 rounded-full text-sm flex items-center gap-2">
                      "{searchQuery}"
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-primary"
                        onClick={() => setSearchQuery("")}
                      />
                    </span>
                  )}
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary hover:underline"
                  >
                    Clear all
                  </button>
                </motion.div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">Failed to load products. Please try again later.</p>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && filteredProducts.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-card/50 backdrop-blur-sm border border-border/50 flex items-center justify-center mb-6">
                    <ShoppingBag className="w-10 h-10 text-primary/50" />
                  </div>
                  <h2 className="text-2xl font-heading mb-3">No Products Found</h2>
                  <p className="text-muted-foreground max-w-md mb-6">
                    {searchQuery 
                      ? "No products match your search. Try a different term."
                      : "Our collection is coming soon. Stay tuned for exquisite fragrances!"}
                  </p>
                  {searchQuery && (
                    <Button onClick={() => setSearchQuery("")} variant="outline">
                      Clear Search
                    </Button>
                  )}
                </motion.div>
              )}

              {/* Results Count */}
              {!isLoading && !error && filteredProducts.length > 0 && (
                <p className="text-sm text-muted-foreground mb-8">
                  Showing {filteredProducts.length} fragrance{filteredProducts.length !== 1 ? 's' : ''}
                </p>
              )}

              {/* Products Grid/List */}
              {!isLoading && !error && filteredProducts.length > 0 && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={viewMode}
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        : "flex flex-col gap-6"
                    }
                  >
                    {filteredProducts.map((product) => (
                      <ShopifyProductCard
                        key={product.node.id}
                        product={product}
                        viewMode={viewMode}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </section>

          <Footer />
        </main>
      </PageTransition>
    </>
  );
};

export default Shop;

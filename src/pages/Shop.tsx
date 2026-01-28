import { useState, useMemo, memo } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Grid3X3, List, Filter, X, ChevronDown, Heart, ShoppingBag } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { products, formatPrice } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useProductStock, isProductSoldOut } from "@/hooks/useProductStock";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";
import { toast } from "sonner";

const categories = ["All", "For Him", "For Her", "Unisex"];
const priceRanges = [
  { label: "All Prices", min: 0, max: Infinity },
  { label: "Under ₹20,000", min: 0, max: 20000 },
  { label: "₹20,000 - ₹25,000", min: 20000, max: 25000 },
  { label: "₹25,000 - ₹30,000", min: 25000, max: 30000 },
  { label: "Above ₹30,000", min: 30000, max: Infinity },
];
const sortOptions = [
  { label: "Featured", value: "featured" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Name: A-Z", value: "name-asc" },
];

const Shop = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [sortBy, setSortBy] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const { data: stockMap } = useProductStock();

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          [...product.notes.top, ...product.notes.heart, ...product.notes.base].some((note) => 
            note.toLowerCase().includes(query)
          )
      );
    }

    // Category filter
    if (selectedCategory !== "All") {
      result = result.filter(
        (product) => product.category === selectedCategory
      );
    }

    // Price filter
    const priceRange = priceRanges[selectedPriceRange];
    result = result.filter(
      (product) =>
        product.price >= priceRange.min && product.price <= priceRange.max
    );

    // Sort
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return result;
  }, [searchQuery, selectedCategory, selectedPriceRange, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedPriceRange(0);
    setSortBy("featured");
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCategory !== "All" ||
    selectedPriceRange !== 0 ||
    sortBy !== "featured";

  return (
    <>
      <Helmet>
        <title>Shop | Rayn Adam Luxury Perfumes</title>
        <meta
          name="description"
          content="Browse our exclusive collection of luxury fragrances. Premium perfumes crafted from the finest natural ingredients."
        />
      </Helmet>

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
                  className="pl-12 h-12 bg-card border-border/50 focus:border-primary"
                />
              </div>

              {/* Filter Toggle (Mobile) */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden border-border/50 hover:border-primary"
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
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-40 h-12 bg-card border-border/50">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedPriceRange.toString()}
                  onValueChange={(v) => setSelectedPriceRange(parseInt(v))}
                >
                  <SelectTrigger className="w-48 h-12 bg-card border-border/50">
                    <SelectValue placeholder="Price Range" />
                  </SelectTrigger>
                  <SelectContent>
                    {priceRanges.map((range, idx) => (
                      <SelectItem key={idx} value={idx.toString()}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-44 h-12 bg-card border-border/50">
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

                <div className="flex border border-border/50 rounded-md overflow-hidden">
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
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-full h-12 bg-card border-border/50">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedPriceRange.toString()}
                    onValueChange={(v) => setSelectedPriceRange(parseInt(v))}
                  >
                    <SelectTrigger className="w-full h-12 bg-card border-border/50">
                      <SelectValue placeholder="Price Range" />
                    </SelectTrigger>
                    <SelectContent>
                      {priceRanges.map((range, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full h-12 bg-card border-border/50">
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
                      className={`p-3 rounded-md transition-colors ${
                        viewMode === "grid"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border/50"
                      }`}
                    >
                      <Grid3X3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-3 rounded-md transition-colors ${
                        viewMode === "list"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border/50"
                      }`}
                    >
                      <List className="w-5 h-5" />
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
                {selectedCategory !== "All" && (
                  <span className="px-3 py-1 bg-card border border-border/50 rounded-full text-sm flex items-center gap-2">
                    {selectedCategory}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-primary"
                      onClick={() => setSelectedCategory("All")}
                    />
                  </span>
                )}
                {selectedPriceRange !== 0 && (
                  <span className="px-3 py-1 bg-card border border-border/50 rounded-full text-sm flex items-center gap-2">
                    {priceRanges[selectedPriceRange].label}
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-primary"
                      onClick={() => setSelectedPriceRange(0)}
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

            {/* Results Count */}
            <p className="text-sm text-muted-foreground mb-8">
              Showing {filteredProducts.length} of {products.length} fragrances
            </p>

            {/* Products Grid/List */}
            <AnimatePresence mode="wait">
              {filteredProducts.length > 0 ? (
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
                    <motion.div
                      key={product.id}
                      variants={staggerItem}
                      className={`group ${
                        viewMode === "list"
                          ? "flex flex-col md:flex-row gap-6 border border-border/50 bg-card/50 p-6 hover:border-primary/50 transition-colors"
                          : ""
                      }`}
                    >
                      {viewMode === "grid" ? (
                        <Link to={`/product/${product.id}`} className="block">
                          <div className="border border-border/50 bg-card/50 overflow-hidden transition-all duration-500 hover:border-primary/50 hover:bg-card">
                            <div className="relative p-4 sm:p-6">
                              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary/60" />
                              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary/60" />
                              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary/60" />
                              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary/60" />

                              {/* Sold Out Badge */}
                              {isProductSoldOut(stockMap, product.id) && (
                                <div className="absolute top-4 right-4 z-10">
                                  <Badge variant="destructive" className="text-xs font-semibold">
                                    SOLD OUT
                                  </Badge>
                                </div>
                              )}

                              <div className={`aspect-square overflow-hidden mb-4 ${isProductSoldOut(stockMap, product.id) ? 'opacity-60' : ''}`}>
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                              </div>

                              <div className="text-center">
                                <span className="text-xs tracking-wider text-primary">
                                  {product.category}
                                </span>
                                <h3 className="text-lg font-heading tracking-[0.1em] mt-1 text-foreground">
                                  {product.name}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {product.tagline}
                                </p>
                                <div className="flex flex-wrap justify-center gap-1 mt-3">
                                  {product.notes.top.slice(0, 2).map((note) => (
                                    <span
                                      key={note}
                                      className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                                    >
                                      {note}
                                    </span>
                                  ))}
                                </div>
                                <div className="mt-4 flex flex-col items-center gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl text-primary font-medium">
                                      {formatPrice(product.price)}
                                    </span>
                                    <span className="text-sm text-muted-foreground line-through">
                                      {formatPrice(product.originalPrice)}
                                    </span>
                                  </div>
                                  <span className="bg-emerald-500/20 text-emerald-400 text-xs font-medium px-2 py-0.5 rounded-full">
                                    {product.discountPercent}% OFF
                                  </span>
                                </div>
                                <Button
                                  size="sm"
                                  className="mt-4 w-full bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                                >
                                  VIEW DETAILS
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <>
                          <Link to={`/product/${product.id}`} className="w-full md:w-48 h-48 flex-shrink-0 overflow-hidden">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </Link>

                          <div className="flex-1 flex flex-col justify-center">
                            <span className="text-xs tracking-wider text-primary">
                              {product.category}
                            </span>
                            <Link to={`/product/${product.id}`}>
                              <h3 className="text-2xl font-heading tracking-[0.1em] mt-1 text-foreground hover:text-primary transition-colors">
                                {product.name}
                              </h3>
                            </Link>
                            <p className="text-muted-foreground mt-2">
                              {product.tagline}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {product.notes.top.map((note) => (
                                <span
                                  key={note}
                                  className="text-sm px-3 py-1 bg-muted rounded-full text-muted-foreground"
                                >
                                  {note}
                                </span>
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              Size: {product.size}
                            </p>
                          </div>

                          <div className="flex flex-col items-end justify-center gap-4">
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl text-primary font-medium">
                                  {formatPrice(product.price)}
                                </span>
                                <span className="text-lg text-muted-foreground line-through">
                                  {formatPrice(product.originalPrice)}
                                </span>
                              </div>
                              <span className="bg-emerald-500/20 text-emerald-400 text-xs font-medium px-2 py-0.5 rounded-full">
                                {product.discountPercent}% OFF
                              </span>
                            </div>
                            <Link to={`/product/${product.id}`}>
                              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8">
                                VIEW DETAILS
                              </Button>
                            </Link>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <p className="text-muted-foreground text-lg">
                    No fragrances found matching your criteria.
                  </p>
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="mt-4 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    Clear Filters
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        <Footer />
        </main>
      </PageTransition>
    </>
  );
};

export default memo(Shop);

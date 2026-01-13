import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, User, Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  created_at: string;
  title: string | null;
  comment: string | null;
  is_verified_purchase: boolean;
}

interface ProductReviewsProps {
  productId: string;
}

const StarRating = ({ rating, onRate, interactive = false, size = "md" }: { 
  rating: number; 
  onRate?: (rating: number) => void;
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
}) => {
  const [hovered, setHovered] = useState(0);
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-6 h-6",
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            className={`${sizeClasses[size]} ${
              star <= (hovered || rating)
                ? "fill-primary text-primary"
                : "text-muted-foreground/30"
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
};

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 0, title: "", content: "", name: "", email: "" });
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    fetchReviews();
    fetchRatingSummary();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRatingSummary = async () => {
    try {
      const { data, error } = await supabase.rpc("get_product_rating", {
        p_product_id: productId,
      });

      if (error) throw error;
      if (data && data.length > 0) {
        setAverageRating(Number(data[0].average_rating) || 0);
        setTotalReviews(Number(data[0].total_reviews) || 0);
      }
    } catch (error) {
      console.error("Error fetching rating summary:", error);
    }
  };

  const ratingCounts = [5, 4, 3, 2, 1].map(
    (rating) => reviews.filter((r) => r.rating === rating).length
  );

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newReview.rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!newReview.name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!newReview.email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("product_reviews").insert({
        product_id: productId,
        user_id: user?.id || null,
        customer_name: newReview.name.trim(),
        customer_email: newReview.email.trim(),
        rating: newReview.rating,
        title: newReview.title.trim() || null,
        comment: newReview.content.trim() || null,
        is_verified_purchase: false,
      });

      if (error) throw error;

      toast.success("Thank you for your review!", {
        description: "Your review has been submitted.",
      });
      setShowReviewForm(false);
      setNewReview({ rating: 0, title: "", content: "", name: "", email: "" });
      fetchReviews();
      fetchRatingSummary();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Reviews Summary */}
      <motion.div variants={fadeInUp} className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-baseline gap-4">
            <span className="text-5xl font-heading text-primary">
              {averageRating.toFixed(1)}
            </span>
            <div>
              <StarRating rating={Math.round(averageRating)} size="lg" />
              <p className="text-sm text-muted-foreground mt-1">
                Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
              </p>
            </div>
          </div>

          {/* Rating Breakdown */}
          {reviews.length > 0 && (
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating, idx) => (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-12">{rating} stars</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{
                        width: reviews.length > 0 ? `${(ratingCounts[idx] / reviews.length) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">
                    {ratingCounts[idx]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <Button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {showReviewForm ? "Cancel" : "Write a Review"}
          </Button>
        </div>
      </motion.div>

      {/* Review Form */}
      {showReviewForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          onSubmit={handleSubmitReview}
          className="bg-card/50 border border-border/50 p-6 space-y-4"
        >
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Your Rating *</label>
            <StarRating
              rating={newReview.rating}
              onRate={(rating) => setNewReview({ ...newReview, rating })}
              interactive
              size="lg"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Your Name *</label>
            <Input
              value={newReview.name}
              onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
              placeholder="Enter your name"
              required
              className="bg-background border-border/50"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Your Email *</label>
            <Input
              type="email"
              value={newReview.email}
              onChange={(e) => setNewReview({ ...newReview, email: e.target.value })}
              placeholder="Enter your email"
              required
              className="bg-background border-border/50"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Review Title</label>
            <Input
              value={newReview.title}
              onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
              placeholder="Summarize your experience"
              className="bg-background border-border/50"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Your Review</label>
            <Textarea
              value={newReview.content}
              onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
              placeholder="Share your experience with this fragrance..."
              rows={4}
              className="bg-background border-border/50"
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Submit Review
          </Button>
        </motion.form>
      )}

      {/* Reviews List */}
      <motion.div variants={staggerContainer} className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
            <Button
              onClick={() => setShowReviewForm(true)}
              variant="outline"
              className="gap-2"
            >
              <PenLine className="w-4 h-4" />
              Write a Review
            </Button>
          </div>
        ) : (
          reviews.map((review) => (
            <motion.div
              key={review.id}
              variants={staggerItem}
              className="border-b border-border/30 pb-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{review.customer_name}</span>
                      {review.is_verified_purchase && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                  </div>
                </div>
                <StarRating rating={review.rating} size="sm" />
              </div>

              {review.title && <h4 className="font-medium mb-2">{review.title}</h4>}
              {review.comment && (
                <p className="text-muted-foreground text-sm leading-relaxed">{review.comment}</p>
              )}
            </motion.div>
          ))
        )}
      </motion.div>
    </motion.div>
  );
};

export default ProductReviews;
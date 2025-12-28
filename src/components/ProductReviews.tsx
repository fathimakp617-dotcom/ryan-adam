import { useState } from "react";
import { motion } from "framer-motion";
import { Star, ThumbsUp, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { fadeInUp, staggerContainer, staggerItem } from "@/lib/animations";
import { toast } from "sonner";

interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  helpful: number;
  verified: boolean;
}

interface ProductReviewsProps {
  productId: string;
}

// Mock reviews data
const mockReviews: Review[] = [
  {
    id: "1",
    author: "Arjun M.",
    rating: 5,
    date: "December 15, 2024",
    title: "Absolutely mesmerizing fragrance",
    content: "This is hands down the best perfume I've ever owned. The longevity is incredible - I can still smell it on my shirt the next day. The oud notes are perfectly balanced with the rose, creating a sophisticated yet approachable scent. Worth every rupee!",
    helpful: 24,
    verified: true,
  },
  {
    id: "2",
    author: "Priya S.",
    rating: 5,
    date: "December 10, 2024",
    title: "Luxury in a bottle",
    content: "Received so many compliments wearing this. The packaging is exquisite and the fragrance develops beautifully throughout the day. Started with bright citrus and settled into this warm, woody base that's absolutely divine.",
    helpful: 18,
    verified: true,
  },
  {
    id: "3",
    author: "Rahul K.",
    rating: 4,
    date: "December 5, 2024",
    title: "Great quality, slightly strong projection",
    content: "Beautiful fragrance with excellent ingredients. The only reason for 4 stars is that the projection might be a bit strong for office settings. Perfect for evenings and special occasions though!",
    helpful: 12,
    verified: true,
  },
  {
    id: "4",
    author: "Ananya R.",
    rating: 5,
    date: "November 28, 2024",
    title: "My signature scent now",
    content: "I've been searching for years for a scent that truly represents me, and this is it. Elegant, mysterious, and unforgettable. The craftsmanship is evident in every note.",
    helpful: 8,
    verified: false,
  },
];

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
  const [reviews] = useState<Review[]>(mockReviews);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 0, title: "", content: "", name: "" });

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const ratingCounts = [5, 4, 3, 2, 1].map(
    (rating) => reviews.filter((r) => r.rating === rating).length
  );

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (newReview.rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    toast.success("Thank you for your review!", {
      description: "Your review will be published after moderation.",
    });
    setShowReviewForm(false);
    setNewReview({ rating: 0, title: "", content: "", name: "" });
  };

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
                Based on {reviews.length} reviews
              </p>
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating, idx) => (
              <div key={rating} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-12">{rating} stars</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{
                      width: `${(ratingCounts[idx] / reviews.length) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-8">
                  {ratingCounts[idx]}
                </span>
              </div>
            ))}
          </div>
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
            <label className="text-sm text-muted-foreground block mb-2">Your Rating</label>
            <StarRating
              rating={newReview.rating}
              onRate={(rating) => setNewReview({ ...newReview, rating })}
              interactive
              size="lg"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Your Name</label>
            <Input
              value={newReview.name}
              onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
              placeholder="Enter your name"
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
              required
              className="bg-background border-border/50"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Your Review</label>
            <Textarea
              value={newReview.content}
              onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
              placeholder="Share your experience with this fragrance..."
              required
              rows={4}
              className="bg-background border-border/50"
            />
          </div>
          <Button type="submit" className="bg-primary hover:bg-primary/90">
            Submit Review
          </Button>
        </motion.form>
      )}

      {/* Reviews List */}
      <motion.div variants={staggerContainer} className="space-y-6">
        {reviews.map((review) => (
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
                    <span className="font-medium">{review.author}</span>
                    {review.verified && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{review.date}</p>
                </div>
              </div>
              <StarRating rating={review.rating} size="sm" />
            </div>

            <h4 className="font-medium mb-2">{review.title}</h4>
            <p className="text-muted-foreground text-sm leading-relaxed">{review.content}</p>

            <button className="flex items-center gap-2 mt-4 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ThumbsUp className="w-4 h-4" />
              Helpful ({review.helpful})
            </button>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default ProductReviews;

import { useEffect, useState, memo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Loader2, Star, Check, X, Trash2, Search, Eye } from "lucide-react";
import { products } from "@/data/products";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  customer_email: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
}

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const sessionData = sessionStorage.getItem("rayn_admin_session");
      if (!sessionData) throw new Error("No admin session found");

      const { token } = JSON.parse(sessionData);
      
      const response = await supabase.functions.invoke("get-admin-reviews", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);
      
      setReviews(response.data?.reviews || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getSessionToken = () => {
    const sessionData = sessionStorage.getItem("rayn_admin_session");
    if (!sessionData) return null;
    return JSON.parse(sessionData).token;
  };

  const updateReviewStatus = async (reviewId: string, isApproved: boolean) => {
    try {
      const token = getSessionToken();
      if (!token) throw new Error("No admin session found");

      const response = await supabase.functions.invoke("manage-reviews", {
        headers: { Authorization: `Bearer ${token}` },
        body: { action: "update_status", reviewId, isApproved },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      setReviews(reviews.map(r => r.id === reviewId ? { ...r, is_approved: isApproved } : r));
      toast({ title: "Updated", description: `Review ${isApproved ? "approved" : "hidden"}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      const token = getSessionToken();
      if (!token) throw new Error("No admin session found");

      const response = await supabase.functions.invoke("manage-reviews", {
        headers: { Authorization: `Bearer ${token}` },
        body: { action: "delete", reviewId },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      setReviews(reviews.filter(r => r.id !== reviewId));
      toast({ title: "Deleted", description: "Review deleted successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || productId;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredReviews = reviews.filter(r => {
    if (statusFilter !== "all") {
      if (statusFilter === "approved" && !r.is_approved) return false;
      if (statusFilter === "pending" && r.is_approved) return false;
    }
    if (productFilter !== "all" && r.product_id !== productFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!r.customer_name.toLowerCase().includes(query) && 
          !r.customer_email.toLowerCase().includes(query) &&
          !(r.title?.toLowerCase().includes(query)) &&
          !(r.comment?.toLowerCase().includes(query))) {
        return false;
      }
    }
    return true;
  });

  const stats = {
    total: reviews.length,
    approved: reviews.filter(r => r.is_approved).length,
    pending: reviews.filter(r => !r.is_approved).length,
    avgRating: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Product Reviews</h1>
          <p className="text-muted-foreground">Manage customer reviews and ratings</p>
        </div>
        <Button onClick={fetchReviews} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">Total Reviews</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">Approved</p>
          <p className="text-2xl font-bold text-green-500">{stats.approved}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">Avg Rating</p>
          <p className="text-2xl font-bold text-primary flex items-center gap-1">
            {stats.avgRating} <Star className="w-5 h-5 fill-primary" />
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {products.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reviews Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Customer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No reviews found
                </TableCell>
              </TableRow>
            ) : (
              filteredReviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{review.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{review.customer_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{getProductName(review.product_id)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${star <= review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      review.is_approved ? "bg-green-500/20 text-green-500" : "bg-amber-500/20 text-amber-500"
                    }`}>
                      {review.is_approved ? <Check className="w-3 h-3" /> : null}
                      {review.is_approved ? "Approved" : "Pending"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(review.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedReview(review)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {review.is_approved ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateReviewStatus(review.id, false)}
                          className="text-amber-500 hover:text-amber-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateReviewStatus(review.id, true)}
                          className="text-green-500 hover:text-green-600"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteReview(review.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Review Detail Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedReview.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedReview.customer_email}</p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= selectedReview.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
                    />
                  ))}
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm text-muted-foreground">Product: {getProductName(selectedReview.product_id)}</p>
                <p className="text-sm text-muted-foreground">Date: {formatDate(selectedReview.created_at)}</p>
                {selectedReview.is_verified_purchase && (
                  <span className="inline-flex items-center px-2 py-1 bg-primary/20 text-primary text-xs rounded">
                    Verified Purchase
                  </span>
                )}
              </div>

              {selectedReview.title && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Title</p>
                  <p className="font-medium">{selectedReview.title}</p>
                </div>
              )}

              {selectedReview.comment && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Review</p>
                  <p className="text-sm">{selectedReview.comment}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                {selectedReview.is_approved ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      updateReviewStatus(selectedReview.id, false);
                      setSelectedReview({ ...selectedReview, is_approved: false });
                    }}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Hide Review
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      updateReviewStatus(selectedReview.id, true);
                      setSelectedReview({ ...selectedReview, is_approved: true });
                    }}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteReview(selectedReview.id);
                    setSelectedReview(null);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default memo(AdminReviewsPage);
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, RefreshCw, Loader2, Phone, Mail, Package, Eye, Check, X, Image as ImageIcon, CheckCircle } from "lucide-react";

interface ReturnOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total: number;
  items: any[];
  return_status: string;
  return_reason: string;
  return_details: string | null;
  return_requested_at: string;
  created_at: string;
  shipping_address: any;
  return_images: string[] | null;
}

const AdminReturns = () => {
  const [returns, setReturns] = useState<ReturnOrder[]>([]);
  const [filteredReturns, setFilteredReturns] = useState<ReturnOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReturn, setSelectedReturn] = useState<ReturnOrder | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReturns();
  }, []);

  useEffect(() => {
    filterReturns();
  }, [returns, searchQuery, statusFilter]);

  const fetchReturns = async () => {
    setIsLoading(true);
    try {
      const sessionData = localStorage.getItem("rayn_admin_session");
      if (!sessionData) throw new Error("No admin session found");
      
      const session = JSON.parse(sessionData);
      
      const { data, error } = await supabase.functions.invoke('get-admin-orders', {
        body: {
          admin_email: session.email,
          admin_token: session.token,
        }
      });
      
      if (error) throw error;
      
      // Filter only orders with return requests
      const returnOrders = (data?.orders || []).filter(
        (order: any) => order.return_status && order.return_requested_at
      );
      
      setReturns(returnOrders);
    } catch (error) {
      console.error("Error fetching returns:", error);
      toast({
        title: "Error",
        description: "Failed to fetch return requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterReturns = () => {
    let filtered = [...returns];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.order_number.toLowerCase().includes(query) ||
          r.customer_name.toLowerCase().includes(query) ||
          r.customer_phone?.includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.return_status === statusFilter);
    }

    setFilteredReturns(filtered);
  };

  const handleUpdateReturnStatus = async (orderId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const sessionData = localStorage.getItem("rayn_admin_session");
      if (!sessionData) throw new Error("No admin session found");
      
      const session = JSON.parse(sessionData);
      
      const { error } = await supabase.functions.invoke('update-order-status', {
        body: {
          admin_email: session.email,
          admin_token: session.token,
          order_id: orderId,
          return_status: newStatus,
        },
      });

      if (error) throw error;

      toast({
        title: "Updated",
        description: `Return status updated to ${newStatus}`,
      });

      // Update local state
      setReturns(returns.map(r => 
        r.id === orderId ? { ...r, return_status: newStatus } : r
      ));
      setSelectedReturn(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "requested": return "bg-amber-500/20 text-amber-400";
      case "approved": return "bg-green-500/20 text-green-400";
      case "accepted": return "bg-emerald-500/20 text-emerald-400";
      case "rejected": return "bg-red-500/20 text-red-400";
      case "completed": return "bg-blue-500/20 text-blue-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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
        <h1 className="text-2xl font-bold text-foreground">Return Requests</h1>
        <Button onClick={fetchReturns} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by order, customer, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="requested">Requested</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Returns Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReturns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No return requests found
                </TableCell>
              </TableRow>
            ) : (
              filteredReturns.map((returnItem) => (
                <TableRow key={returnItem.id}>
                  <TableCell className="font-medium">{returnItem.order_number}</TableCell>
                  <TableCell>{returnItem.customer_name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      {returnItem.customer_phone && (
                        <a href={`tel:${returnItem.customer_phone}`} className="flex items-center gap-1 text-primary hover:underline">
                          <Phone className="w-3 h-3" />
                          {returnItem.customer_phone}
                        </a>
                      )}
                      <a href={`mailto:${returnItem.customer_email}`} className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                        <Mail className="w-3 h-3" />
                        {returnItem.customer_email}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{returnItem.return_reason}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(returnItem.return_status)}`}>
                      {returnItem.return_status}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(returnItem.return_requested_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedReturn(returnItem)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Return Details Dialog */}
      <Dialog open={!!selectedReturn} onOpenChange={() => setSelectedReturn(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Return Request - {selectedReturn?.order_number}</DialogTitle>
          </DialogHeader>
          
          {selectedReturn && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Customer:</span>
                  <p className="font-medium">{selectedReturn.customer_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p className="font-medium">{selectedReturn.customer_phone || "N/A"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{selectedReturn.customer_email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Order Total:</span>
                  <p className="font-medium">₹{selectedReturn.total.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground text-sm">Products:</span>
                <div className="mt-1 space-y-1">
                  {selectedReturn.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span>{item.name} × {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-muted-foreground text-sm">Return Reason:</span>
                <p className="mt-1 p-3 bg-muted rounded-lg text-sm">{selectedReturn.return_reason}</p>
              </div>

              {selectedReturn.return_details && (
                <div>
                  <span className="text-muted-foreground text-sm">Additional Details:</span>
                  <p className="mt-1 p-3 bg-muted rounded-lg text-sm">{selectedReturn.return_details}</p>
                </div>
              )}

              {/* Return Images */}
              {selectedReturn.return_images && selectedReturn.return_images.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-sm flex items-center gap-1 mb-2">
                    <ImageIcon className="w-4 h-4" />
                    Attached Images ({selectedReturn.return_images.length})
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedReturn.return_images.map((url, idx) => (
                      <a 
                        key={idx} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                      >
                        <img src={url} alt={`Return image ${idx + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {(selectedReturn.return_status === "requested") && (
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleUpdateReturnStatus(selectedReturn.id, "approved")}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve Return
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleUpdateReturnStatus(selectedReturn.id, "rejected")}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}

              {selectedReturn.return_status === "approved" && (
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleUpdateReturnStatus(selectedReturn.id, "accepted")}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Return
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleUpdateReturnStatus(selectedReturn.id, "completed")}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    Mark as Completed
                  </Button>
                </div>
              )}

              {selectedReturn.return_status === "accepted" && (
                <Button
                  onClick={() => handleUpdateReturnStatus(selectedReturn.id, "completed")}
                  disabled={isUpdating}
                  className="w-full"
                >
                  Mark as Completed
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default memo(AdminReturns);
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  Search, 
  RefreshCw, 
  Truck, 
  MapPin,
  Phone,
  Mail,
  FileText,
  Loader2,
  Eye
} from "lucide-react";
import { generateShippingLabelPDF } from "@/lib/generateInvoicePDF";
import OrderViewDialog from "@/components/OrderViewDialog";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  order_status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number;
  discount?: number | null;
  shipping?: number | null;
  total: number;
  created_at: string;
  shipping_address: any;
  items: any;
  tracking_number: string | null;
  tracking_url: string | null;
  coupon_code?: string | null;
  affiliate_code?: string | null;
}

const SHIPPING_SESSION_KEY = "rayn_shipping_session";

const ShippingOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  const getSessionCredentials = () => {
    const stored = sessionStorage.getItem(SHIPPING_SESSION_KEY);
    if (stored) {
      const session = JSON.parse(stored);
      return { email: session.email, token: session.token };
    }
    return null;
  };

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const credentials = getSessionCredentials();
      if (!credentials) return;

      const { data, error } = await supabase.functions.invoke("get-admin-orders", {
        body: { 
          admin_email: credentials.email,
          admin_token: credentials.token
        },
      });

      if (error) throw error;

      if (data?.orders) {
        setOrders(data.orders);
        setFilteredOrders(data.orders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    let filtered = orders;

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.order_status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(query) ||
          order.customer_name.toLowerCase().includes(query) ||
          order.customer_email.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchQuery]);

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    setIsUpdating(true);
    try {
      const credentials = getSessionCredentials();
      if (!credentials) return;

      const { error } = await supabase.functions.invoke("update-order-status", {
        body: {
          order_id: selectedOrder.id,
          new_status: newStatus,
          tracking_number: trackingNumber || null,
          tracking_url: trackingUrl || null,
          admin_email: credentials.email,
          admin_token: credentials.token,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order status updated successfully",
      });

      setSelectedOrder(null);
      setTrackingNumber("");
      setTrackingUrl("");
      setNewStatus("");
      fetchOrders();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update order",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGenerateLabel = (order: Order) => {
    try {
      generateShippingLabelPDF(order);
      toast({
        title: "Success",
        description: "Shipping label generated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate label",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "processing": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "shipped": return "bg-purple-500/10 text-purple-600 border-purple-200";
      case "delivered": return "bg-green-500/10 text-green-600 border-green-200";
      case "cancelled": return "bg-red-500/10 text-red-600 border-red-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const openUpdateDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.order_status);
    setTrackingNumber(order.tracking_number || "");
    setTrackingUrl(order.tracking_url || "");
  };

  // Get allowed next statuses based on current status (sequential only)
  const getAllowedStatuses = (currentStatus: string) => {
    const statusOrder = ["pending", "processing", "shipped", "delivered"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    
    // If cancelled or not found, no changes allowed
    if (currentStatus === "cancelled" || currentIndex === -1) {
      return [];
    }
    
    // Allow current status and next status only
    const allowed = [currentStatus];
    if (currentIndex < statusOrder.length - 1) {
      allowed.push(statusOrder[currentIndex + 1]);
    }
    
    // Also allow cancellation from pending or processing only
    if (currentStatus === "pending" || currentStatus === "processing") {
      allowed.push("cancelled");
    }
    
    return allowed;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage order fulfillment and shipping
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order #, name, or email..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Orders ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const isCancelled = order.order_status === "cancelled";
                    const isDelivered = order.order_status === "delivered";
                    const isLocked = isCancelled || isDelivered;
                    const items = Array.isArray(order.items) ? order.items : [];
                    
                    return (
                      <TableRow key={order.id} className={isCancelled ? "opacity-60" : ""}>
                        <TableCell className={`font-medium ${isCancelled ? "line-through" : ""}`}>
                          {order.order_number}
                        </TableCell>
                        <TableCell>
                          <div className={isCancelled ? "line-through" : ""}>
                            <p className="font-medium">{order.customer_name}</p>
                            <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`text-sm space-y-0.5 ${isCancelled ? "line-through" : ""}`}>
                            {items.length > 0 ? (
                              items.slice(0, 2).map((item: any, idx: number) => (
                                <div key={idx} className="text-xs">
                                  {item.name || item.product_name || "Product"} × {item.quantity || 1}
                                </div>
                              ))
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                            {items.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{items.length - 2} more
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(order.order_status)}>
                            {order.order_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={isCancelled ? "line-through" : ""}>
                            {order.payment_method === "cod" ? "COD" : "Online"}
                          </Badge>
                        </TableCell>
                        <TableCell className={isCancelled ? "line-through" : ""}>
                          {formatCurrency(order.total)}
                        </TableCell>
                        <TableCell className="text-sm">{formatDate(order.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewOrder(order)}
                              title="View order details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateLabel(order)}
                              title="Generate Shipping Label"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openUpdateDialog(order)}
                              disabled={isLocked}
                              className="bg-blue-600 hover:bg-blue-700"
                              title={isLocked ? `Cannot update ${order.order_status} orders` : "Update order"}
                            >
                              <Truck className="h-4 w-4 mr-1" />
                              Update
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Status Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Update Order - {selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {selectedOrder.customer_email}
                </div>
                {selectedOrder.customer_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {selectedOrder.customer_phone}
                  </div>
                )}
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    {selectedOrder.shipping_address?.address}, {selectedOrder.shipping_address?.city}<br />
                    {selectedOrder.shipping_address?.state} - {selectedOrder.shipping_address?.pincode}
                  </div>
                </div>
              </div>

              {/* Status Update */}
              <div className="space-y-4">
                <div>
                  <Label>Order Status</Label>
                  <p className="text-xs text-muted-foreground mb-1">
                    Status must follow: Pending → Processing → Shipped → Delivered
                  </p>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAllowedStatuses(selectedOrder.order_status).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tracking Number (Optional)</Label>
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Tracking URL (Optional)</Label>
                  <Input
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedOrder(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={handleUpdateStatus}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Order"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <OrderViewDialog 
        order={viewOrder} 
        open={!!viewOrder} 
        onOpenChange={(open) => !open && setViewOrder(null)} 
      />
    </div>
  );
};

export default ShippingOrders;

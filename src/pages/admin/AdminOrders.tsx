import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Eye, Search, RefreshCw, Truck, Package, CheckCircle, X, Clock, Loader2 } from "lucide-react";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface ShippingAddress {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total: number;
  subtotal: number;
  discount: number | null;
  shipping: number | null;
  order_status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  items: OrderItem[];
  shipping_address: ShippingAddress;
  coupon_code: string | null;
  affiliate_code: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isUpdating, setIsUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      // Get admin session from localStorage
      const sessionData = localStorage.getItem("admin_session");
      if (!sessionData) {
        throw new Error("No admin session found");
      }
      
      const session = JSON.parse(sessionData);
      
      const { data, error } = await supabase.functions.invoke('get-admin-orders', {
        body: {
          admin_email: session.email,
          admin_token: session.session_token,
        }
      });
      
      if (error) throw error;
      
      if (data?.orders) {
        setOrders(data.orders);
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
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(query) ||
          order.customer_name.toLowerCase().includes(query) ||
          order.customer_email.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.order_status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setTrackingNumber(order.tracking_number || "");
    setTrackingUrl(order.tracking_url || "");
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder) return;

    setIsUpdating(true);
    try {
      // Get admin session from localStorage
      const sessionData = localStorage.getItem("admin_session");
      if (!sessionData) {
        throw new Error("No admin session found");
      }
      
      const session = JSON.parse(sessionData);
      
      const { data, error } = await supabase.functions.invoke('update-order-status', {
        body: {
          admin_email: session.email,
          admin_token: session.session_token,
          order_id: selectedOrder.id,
          new_status: newStatus,
          tracking_number: trackingNumber || undefined,
          tracking_url: trackingUrl || undefined,
        },
      });

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Order ${selectedOrder.order_number} status changed to ${newStatus}`,
      });

      // Update local state
      setOrders(orders.map(order => 
        order.id === selectedOrder.id 
          ? { 
              ...order, 
              order_status: newStatus,
              tracking_number: trackingNumber || order.tracking_number,
              tracking_url: trackingUrl || order.tracking_url,
            } 
          : order
      ));

      setSelectedOrder({
        ...selectedOrder,
        order_status: newStatus,
        tracking_number: trackingNumber || selectedOrder.tracking_number,
        tracking_url: trackingUrl || selectedOrder.tracking_url,
      });

    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "processing": return <Package className="h-4 w-4" />;
      case "shipped": return <Truck className="h-4 w-4" />;
      case "delivered": return <CheckCircle className="h-4 w-4" />;
      case "cancelled": return <X className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-500";
      case "processing": return "bg-blue-500/10 text-blue-500";
      case "shipped": return "bg-purple-500/10 text-purple-500";
      case "delivered": return "bg-green-500/10 text-green-500";
      case "cancelled": return "bg-red-500/10 text-red-500";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders</p>
        </div>
        <Button onClick={fetchOrders} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
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

      {/* Orders Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(order.created_at)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(order.total)}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                      {getStatusIcon(order.order_status)}
                      {order.order_status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.payment_status === 'paid' 
                        ? 'bg-green-500/10 text-green-500' 
                        : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {order.payment_status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleViewOrder(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Order Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Status Update */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <Label className="text-sm font-medium mb-3 block">Update Status</Label>
                <div className="flex flex-wrap gap-2">
                  {["pending", "processing", "shipped", "delivered", "cancelled"].map((status) => (
                    <Button
                      key={status}
                      variant={selectedOrder.order_status === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleUpdateStatus(status)}
                      disabled={isUpdating || selectedOrder.order_status === status}
                      className="capitalize"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        getStatusIcon(status)
                      )}
                      <span className="ml-1">{status}</span>
                    </Button>
                  ))}
                </div>

                {/* Tracking Info (show for shipped) */}
                {(selectedOrder.order_status === "shipped" || selectedOrder.order_status === "processing") && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <Label htmlFor="tracking_number">Tracking Number</Label>
                      <Input
                        id="tracking_number"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tracking_url">Tracking URL</Label>
                      <Input
                        id="tracking_url"
                        value={trackingUrl}
                        onChange={(e) => setTrackingUrl(e.target.value)}
                        placeholder="https://..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-foreground mb-2">Customer</h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Name:</span> {selectedOrder.customer_name}</p>
                  <p><span className="text-muted-foreground">Email:</span> {selectedOrder.customer_email}</p>
                  <p><span className="text-muted-foreground">Phone:</span> {selectedOrder.customer_phone || "N/A"}</p>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="font-semibold text-foreground mb-2">Shipping Address</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedOrder.shipping_address.address}<br />
                  {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.zipCode}<br />
                  {selectedOrder.shipping_address.country}
                </p>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-foreground mb-2">Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                      <span>{item.name} x{item.quantity}</span>
                      <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-border pt-4">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.discount && selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-500">
                      <span>Discount</span>
                      <span>-{formatCurrency(selectedOrder.discount)}</span>
                    </div>
                  )}
                  {selectedOrder.shipping !== null && selectedOrder.shipping > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{formatCurrency(selectedOrder.shipping)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                    <span>Total</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="text-sm text-muted-foreground">
                <p><span className="text-foreground">Payment Method:</span> {selectedOrder.payment_method}</p>
                {selectedOrder.coupon_code && (
                  <p><span className="text-foreground">Coupon:</span> {selectedOrder.coupon_code}</p>
                )}
                {selectedOrder.affiliate_code && (
                  <p><span className="text-foreground">Affiliate:</span> {selectedOrder.affiliate_code}</p>
                )}
                {selectedOrder.tracking_number && (
                  <p><span className="text-foreground">Tracking:</span> {selectedOrder.tracking_number}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;

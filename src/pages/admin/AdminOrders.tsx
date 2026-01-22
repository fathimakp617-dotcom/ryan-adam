import { useEffect, useState, memo, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAdminOrders, useInvalidateAdminData, type Order, type OrderItem, type ShippingAddress } from "@/hooks/useAdminData";
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
import { Eye, Search, RefreshCw, Truck, Package, CheckCircle, X, Clock, Loader2, Download, FileText, Calendar, Trash2, AlertTriangle, ChevronRight, Check } from "lucide-react";
import jsPDF from "jspdf";
import OrderViewDialog from "@/components/OrderViewDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Types are imported from useAdminData

const AdminOrders = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: cachedOrders = [], isLoading, error } = useAdminOrders();
  const { invalidateOrders } = useInvalidateAdminData();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  // Handle expired admin session (avoid blank/error loops)
  useEffect(() => {
    if (!error) return;
    const msg = String((error as any)?.message ?? "").toLowerCase();
    const status = (error as any)?.status;
    if (status === 401 || msg.includes("session expired")) {
      sessionStorage.removeItem("rayn_admin_session");
      toast({
        title: "Session Expired",
        description: "Please log in again to continue.",
        variant: "destructive",
      });
      navigate("/admin", { replace: true });
    }
  }, [error, navigate, toast]);

  // Sync cached orders to local state
  useEffect(() => {
    if (cachedOrders.length > 0) {
      setOrders(cachedOrders);
    }
  }, [cachedOrders]);

  // Initialize status filter from URL params
  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam && ["pending", "processing", "shipped", "delivered", "cancelled"].includes(statusParam)) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-list-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          setOrders(prev => [payload.new as any, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          setOrders(prev => prev.map(order => 
            order.id === payload.new.id ? payload.new as any : order
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter, dateFrom, dateTo]);

  const fetchOrders = () => invalidateOrders();

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

    // Date filtering
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((order) => new Date(order.created_at) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((order) => new Date(order.created_at) <= toDate);
    }

    setFilteredOrders(filtered);
  };

  const generateShippingLabelPDF = (order: Order) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [100, 150] // 4x6 label size
    });

    // Brand colors
    const goldColor = [168, 124, 57];
    const darkColor = [28, 28, 28];

    // Header
    doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.rect(0, 0, 100, 25, "F");
    
    doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("RAYN ADAM", 50, 12, { align: "center" });
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("LUXURY PERFUMES", 50, 18, { align: "center" });

    // From section
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text("FROM:", 8, 32);
    
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFontSize(9);
    doc.text("Rayn Adam Perfumes", 8, 38);
    doc.setFontSize(8);
    doc.text("Kozhikode, Kerala", 8, 43);
    doc.text("India - 673001", 8, 48);

    // Divider
    doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.setLineWidth(0.5);
    doc.line(8, 54, 92, 54);

    // To section
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text("SHIP TO:", 8, 62);
    
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(order.customer_name, 8, 70);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    const addressLines = [
      order.shipping_address.address,
      `${order.shipping_address.city}, ${order.shipping_address.state}`,
      order.shipping_address.zipCode,
      order.shipping_address.country
    ];
    
    let yPos = 77;
    addressLines.forEach(line => {
      doc.text(line, 8, yPos);
      yPos += 6;
    });

    // Phone
    if (order.customer_phone) {
      doc.setFontSize(8);
      doc.text(`Ph: ${order.customer_phone}`, 8, yPos + 2);
    }

    // Order info box
    doc.setFillColor(248, 248, 248);
    doc.rect(8, 110, 84, 20, "F");
    
    doc.setDrawColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.rect(8, 110, 84, 20, "S");
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text("ORDER #", 12, 117);
    
    doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(order.order_number, 12, 124);
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("DATE", 60, 117);
    
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFontSize(8);
    doc.text(new Date(order.created_at).toLocaleDateString("en-IN"), 60, 124);

    // Footer
    doc.setTextColor(goldColor[0], goldColor[1], goldColor[2]);
    doc.setFontSize(6);
    doc.text("Handle with care • Fragile contents", 50, 140, { align: "center" });

    doc.save(`shipping-label-${order.order_number}.pdf`);

    toast({
      title: "Downloaded",
      description: `Shipping label for ${order.order_number} saved`,
    });
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setTrackingNumber(order.tracking_number || "");
    setTrackingUrl(order.tracking_url || "");
    setIsModalOpen(true);
  };

  // Get allowed next statuses based on current status (sequential only)
  const getAllowedStatuses = (currentStatus: string) => {
    const statusOrder = ["pending", "processing", "shipped", "delivered"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    
    // If delivered or cancelled, no changes allowed
    if (currentStatus === "delivered" || currentStatus === "cancelled" || currentIndex === -1) {
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

  // Check if order can be edited (not delivered or cancelled)
  const isOrderLocked = (status: string) => {
    return status === "delivered" || status === "cancelled";
  };

  // Get product summary for table display
  const getProductSummary = (items: OrderItem[]) => {
    if (items.length === 1) {
      return `${items[0].name} (×${items[0].quantity})`;
    }
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
    return `${items.length} products (×${totalQty})`;
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder) return;

    setIsUpdating(true);
    try {
      // Get admin session from sessionStorage
      const sessionData = sessionStorage.getItem("rayn_admin_session");
      if (!sessionData) {
        throw new Error("No admin session found");
      }
      
      const session = JSON.parse(sessionData);
      
      const { data, error } = await supabase.functions.invoke('update-order-status', {
        body: {
          admin_email: session.email,
          admin_token: session.token,
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

  const handleToggleCashReceived = async (order: Order) => {
    try {
      const sessionData = sessionStorage.getItem("rayn_admin_session");
      if (!sessionData) {
        throw new Error("No admin session found");
      }
      
      const session = JSON.parse(sessionData);
      const newCashReceived = !order.cash_received;
      
      const { data, error } = await supabase.functions.invoke('mark-cash-received', {
        body: {
          admin_email: session.email,
          admin_token: session.token,
          order_id: order.id,
          cash_received: newCashReceived,
        },
      });

      if (error) throw error;

      toast({
        title: newCashReceived ? "Cash Received" : "Cash Pending",
        description: `Order ${order.order_number} updated`,
      });

      // Update local state
      setOrders(orders.map(o => 
        o.id === order.id 
          ? { 
              ...o, 
              cash_received: newCashReceived,
              payment_status: newCashReceived ? 'paid' : (o.payment_status === 'paid' ? 'pending' : o.payment_status),
            } 
          : o
      ));

    } catch (error: any) {
      console.error("Error updating cash received:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update order",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setIsDeleting(true);
    try {
      const sessionData = sessionStorage.getItem("rayn_admin_session");
      if (!sessionData) {
        throw new Error("No admin session found");
      }
      
      const session = JSON.parse(sessionData);
      
      const { data, error } = await supabase.functions.invoke('delete-admin-order', {
        body: {
          admin_email: session.email,
          admin_token: session.token,
          order_id: orderId,
        },
      });

      if (error) throw error;

      toast({
        title: "Order Deleted",
        description: data.message || "Order deleted successfully",
      });

      // Remove from local state
      setOrders(orders.filter(order => order.id !== orderId));
      setDeleteOrderId(null);

    } catch (error: any) {
      console.error("Error deleting order:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete order",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const downloadShippingAddresses = () => {
    // Filter orders that need shipping (not cancelled/delivered)
    const ordersToShip = filteredOrders.filter(
      order => order.order_status === "pending" || order.order_status === "processing"
    );

    if (ordersToShip.length === 0) {
      toast({
        title: "No orders to export",
        description: "No pending or processing orders found",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    const headers = ["Order Number", "Customer Name", "Phone", "Address", "City", "State", "ZIP", "Country", "Status"];
    const rows = ordersToShip.map(order => [
      order.order_number,
      order.customer_name,
      order.customer_phone || "N/A",
      order.shipping_address.address,
      order.shipping_address.city,
      order.shipping_address.state,
      order.shipping_address.zipCode,
      order.shipping_address.country,
      order.order_status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `shipping-addresses-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast({
      title: "Downloaded",
      description: `Exported ${ordersToShip.length} shipping addresses`,
    });
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
        <div className="flex gap-2">
          <Button onClick={downloadShippingAddresses} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Addresses
          </Button>
          <Button onClick={fetchOrders} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
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
        
        {/* Date Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 md:flex-none">
            <Label className="text-xs text-muted-foreground mb-1 block">From Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="pl-10 w-full md:w-[180px]"
              />
            </div>
          </div>
          <div className="flex-1 md:flex-none">
            <Label className="text-xs text-muted-foreground mb-1 block">To Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="pl-10 w-full md:w-[180px]"
              />
            </div>
          </div>
          {(dateFrom || dateTo) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear dates
            </Button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Products</TableHead>
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
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const isCancelled = order.order_status === "cancelled";
                return (
                  <TableRow key={order.id} className={isCancelled ? "opacity-60" : ""}>
                    <TableCell className={`font-medium ${isCancelled ? "line-through" : ""}`}>
                      {order.order_number}
                    </TableCell>
                    <TableCell>
                      <div className={isCancelled ? "line-through" : ""}>
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`text-sm ${isCancelled ? "line-through" : ""}`}>
                        {order.items.map((item, idx) => (
                          <p key={idx} className="text-muted-foreground">
                            {item.name} <span className="text-foreground font-medium">×{item.quantity}</span>
                          </p>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className={`text-sm ${isCancelled ? "line-through" : ""}`}>
                      {formatDate(order.created_at)}
                    </TableCell>
                    <TableCell className={`font-medium ${isCancelled ? "line-through" : ""}`}>
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                          {getStatusIcon(order.order_status)}
                          {order.order_status}
                        </span>
                        {order.return_status && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            order.return_status === 'requested' ? 'bg-orange-500/10 text-orange-500' :
                            order.return_status === 'approved' ? 'bg-green-500/10 text-green-500' :
                            order.return_status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                            'bg-blue-500/10 text-blue-500'
                          }`}>
                            ↩ {order.return_status}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          order.payment_status === 'paid' 
                            ? 'bg-green-500/10 text-green-500' 
                            : order.payment_status === 'shipping_paid'
                            ? 'bg-blue-500/10 text-blue-500'
                            : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {order.payment_status === 'shipping_paid' ? 'Shipping Paid' : order.payment_status}
                        </span>
                        {order.payment_method === 'cod' && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            order.cash_received 
                              ? 'bg-green-500/10 text-green-500' 
                              : 'bg-orange-500/10 text-orange-500'
                          }`}>
                            {order.cash_received ? '💵 Received' : '💵 Pending'}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {order.payment_method === 'cod' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleToggleCashReceived(order)}
                            title={order.cash_received ? "Mark cash as pending" : "Mark cash as received"}
                            className={order.cash_received ? "text-green-500 hover:text-green-600" : "text-orange-500 hover:text-orange-600"}
                          >
                            {order.cash_received ? <Check className="h-4 w-4" /> : <span className="text-sm">💵</span>}
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setViewOrder(order)}
                          title="View order details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => generateShippingLabelPDF(order)}
                          title="Download shipping label"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewOrder(order)}
                          title="Edit order"
                          disabled={isOrderLocked(order.order_status)}
                        >
                          <Truck className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setDeleteOrderId(order.id)}
                          title="Delete order"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Order Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Status Update */}
              <div className="p-4 bg-muted/30 rounded-lg">
                {isOrderLocked(selectedOrder.order_status) ? (
                  <div className={`flex items-center gap-3 p-3 border rounded-lg ${
                    selectedOrder.order_status === "cancelled" 
                      ? "bg-red-500/10 border-red-500/20" 
                      : "bg-green-500/10 border-green-500/20"
                  }`}>
                    {selectedOrder.order_status === "cancelled" ? (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    <div>
                      <p className={`font-medium ${selectedOrder.order_status === "cancelled" ? "text-red-500" : "text-green-500"}`}>
                        Order {selectedOrder.order_status === "cancelled" ? "Cancelled" : "Delivered"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This order has been {selectedOrder.order_status} and cannot be modified.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Label className="text-sm font-medium mb-1 block">Update Status</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Click a status or use the arrow to progress
                    </p>
                    
                    {/* Status Stepper */}
                    <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                      {["pending", "processing", "shipped", "delivered"].map((status, index, arr) => {
                        const currentIndex = arr.indexOf(selectedOrder.order_status);
                        const statusIndex = arr.indexOf(status);
                        const isCompleted = statusIndex < currentIndex;
                        const isCurrent = status === selectedOrder.order_status;
                        const isNext = statusIndex === currentIndex + 1;
                        const canSelect = statusIndex <= currentIndex + 1 && statusIndex >= currentIndex;
                        
                        return (
                          <div key={status} className="flex items-center">
                            <button
                              type="button"
                              onClick={() => canSelect && handleUpdateStatus(status)}
                              disabled={!canSelect || isUpdating || isCurrent}
                              className={`
                                flex flex-col items-center gap-1 px-2 py-1 rounded-md transition-all
                                ${canSelect && !isCurrent ? "cursor-pointer hover:bg-muted" : ""}
                                ${!canSelect ? "cursor-not-allowed opacity-40" : ""}
                                ${isCurrent ? "ring-2 ring-blue-500 bg-blue-500/10" : ""}
                              `}
                            >
                              <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all
                                ${isCompleted ? "bg-green-500 text-white" : ""}
                                ${isCurrent ? "bg-blue-600 text-white scale-110" : ""}
                                ${!isCompleted && !isCurrent ? "bg-muted border-2 border-muted-foreground/20 text-muted-foreground" : ""}
                              `}>
                                {isCompleted ? <Check className="h-4 w-4" /> : isUpdating && isNext ? <Loader2 className="h-4 w-4 animate-spin" /> : index + 1}
                              </div>
                              <span className={`text-[10px] font-medium capitalize ${isCurrent ? "text-blue-600" : ""}`}>
                                {status}
                              </span>
                            </button>
                            
                            {index < arr.length - 1 && (
                              <div className="flex items-center mx-1">
                                {isNext ? (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(arr[index + 1])}
                                    disabled={isUpdating}
                                    className="p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors animate-pulse disabled:opacity-50"
                                    title={`Move to ${arr[index + 1]}`}
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <ChevronRight className={`h-4 w-4 ${isCompleted ? "text-green-500" : "text-muted-foreground/30"}`} />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Cancel Option */}
                    {(selectedOrder.order_status === "pending" || selectedOrder.order_status === "processing") && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus("cancelled")}
                        disabled={isUpdating}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md border border-muted-foreground/20 text-muted-foreground hover:border-red-300 hover:text-red-500 transition-all disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                        <span className="text-sm">Cancel Order</span>
                      </button>
                    )}

                    {/* Tracking Info (show for shipped or processing) */}
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
                  </>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteOrderId} onOpenChange={() => setDeleteOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Order
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
              All order data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOrderId && handleDeleteOrder(deleteOrderId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Order"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Order Dialog */}
      <OrderViewDialog 
        order={viewOrder} 
        open={!!viewOrder} 
        onOpenChange={(open) => !open && setViewOrder(null)} 
      />
    </div>
  );
};

export default memo(AdminOrders);

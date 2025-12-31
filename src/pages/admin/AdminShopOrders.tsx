import { useEffect, useState, memo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, RefreshCw, Loader2, Store, Phone, MapPin, Check, X, Clock, Truck } from "lucide-react";

interface Route {
  id: string;
  name: string;
}

interface ShopOrder {
  id: string;
  route_id: string | null;
  shop_name: string;
  contact_name: string | null;
  contact_phone: string | null;
  products: { name: string; quantity: number }[];
  total_bottles: number;
  notes: string | null;
  order_date: string;
  status: string;
  created_at: string;
  route?: Route;
}

const AdminShopOrders = () => {
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [routeFilter, setRouteFilter] = useState("all");
  
  // Form state
  const [formData, setFormData] = useState({
    shop_name: "",
    contact_name: "",
    contact_phone: "",
    products: [{ name: "", quantity: 1 }],
    notes: "",
    order_date: new Date().toISOString().split("T")[0],
    route_id: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('shop-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_orders' }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const sessionData = localStorage.getItem("rayn_admin_session");
      if (!sessionData) throw new Error("No admin session found");
      
      const session = JSON.parse(sessionData);
      
      const { data, error } = await supabase.functions.invoke('manage-shop-orders', {
        body: {
          admin_email: session.email,
          admin_token: session.token,
          action: "list",
        }
      });
      
      if (error) throw error;
      
      setShopOrders(data?.shop_orders || []);
      setRoutes(data?.routes || []);
    } catch (error) {
      console.error("Error fetching shop orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch shop orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addProductRow = () => {
    setFormData({
      ...formData,
      products: [...formData.products, { name: "", quantity: 1 }],
    });
  };

  const updateProduct = (index: number, field: string, value: string | number) => {
    const newProducts = [...formData.products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setFormData({ ...formData, products: newProducts });
  };

  const removeProduct = (index: number) => {
    if (formData.products.length > 1) {
      setFormData({
        ...formData,
        products: formData.products.filter((_, i) => i !== index),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const sessionData = localStorage.getItem("rayn_admin_session");
      if (!sessionData) throw new Error("No admin session found");
      
      const session = JSON.parse(sessionData);
      const totalBottles = formData.products.reduce((sum, p) => sum + (p.quantity || 0), 0);
      
      const { error } = await supabase.functions.invoke('manage-shop-orders', {
        body: {
          admin_email: session.email,
          admin_token: session.token,
          action: "create",
          shop_order: {
            ...formData,
            total_bottles: totalBottles,
            route_id: formData.route_id || null,
          },
        }
      });

      if (error) throw error;

      toast({ title: "Success", description: "Shop order added" });
      setIsDialogOpen(false);
      setFormData({
        shop_name: "",
        contact_name: "",
        contact_phone: "",
        products: [{ name: "", quantity: 1 }],
        notes: "",
        order_date: new Date().toISOString().split("T")[0],
        route_id: "",
      });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const sessionData = localStorage.getItem("rayn_admin_session");
      if (!sessionData) throw new Error("No admin session found");
      
      const session = JSON.parse(sessionData);
      
      const { error } = await supabase.functions.invoke('manage-shop-orders', {
        body: {
          admin_email: session.email,
          admin_token: session.token,
          action: "update_status",
          order_id: orderId,
          status: newStatus,
        }
      });

      if (error) throw error;

      toast({ title: "Updated", description: `Status changed to ${newStatus}` });
      setShopOrders(shopOrders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredOrders = shopOrders.filter(o => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (routeFilter !== "all" && o.route_id !== routeFilter) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-500/20 text-amber-400";
      case "confirmed": return "bg-blue-500/20 text-blue-400";
      case "delivered": return "bg-green-500/20 text-green-400";
      case "cancelled": return "bg-red-500/20 text-red-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return Clock;
      case "confirmed": return Check;
      case "delivered": return Truck;
      case "cancelled": return X;
      default: return Clock;
    }
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
          <h1 className="text-2xl font-bold text-foreground">Shop Orders</h1>
          <p className="text-muted-foreground">Track orders from retail shops on routes</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Shop Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Shop Order</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Shop Name *</Label>
                    <Input
                      value={formData.shop_name}
                      onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
                      placeholder="Shop name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Route</Label>
                    <Select
                      value={formData.route_id}
                      onValueChange={(v) => setFormData({ ...formData, route_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select route" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No route</SelectItem>
                        {routes.map((route) => (
                          <SelectItem key={route.id} value={route.id}>{route.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Name</Label>
                    <Input
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      placeholder="Contact person"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Products</Label>
                  {formData.products.map((product, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Product name"
                        value={product.name}
                        onChange={(e) => updateProduct(index, "name", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={product.quantity}
                        onChange={(e) => updateProduct(index, "quantity", parseInt(e.target.value) || 0)}
                        className="w-20"
                        min={1}
                      />
                      {formData.products.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeProduct(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addProductRow}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Order Date</Label>
                  <Input
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>

                <Button type="submit" disabled={isSaving} className="w-full">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Add Order
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">Total Orders</p>
          <p className="text-2xl font-bold">{shopOrders.length}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-amber-400">
            {shopOrders.filter(o => o.status === "pending").length}
          </p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">Total Bottles</p>
          <p className="text-2xl font-bold text-primary">
            {shopOrders.reduce((sum, o) => sum + o.total_bottles, 0)}
          </p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">Delivered Today</p>
          <p className="text-2xl font-bold text-green-400">
            {shopOrders.filter(o => 
              o.status === "delivered" && 
              o.order_date === new Date().toISOString().split("T")[0]
            ).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={routeFilter} onValueChange={setRouteFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All routes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Routes</SelectItem>
            {routes.map((route) => (
              <SelectItem key={route.id} value={route.id}>{route.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Shop</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No shop orders found
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const StatusIcon = getStatusIcon(order.status);
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-primary" />
                        <span className="font-medium">{order.shop_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.contact_phone && (
                        <a href={`tel:${order.contact_phone}`} className="flex items-center gap-1 text-sm text-primary hover:underline">
                          <Phone className="w-3 h-3" />
                          {order.contact_phone}
                        </a>
                      )}
                      {order.contact_name && <p className="text-sm text-muted-foreground">{order.contact_name}</p>}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {order.products.slice(0, 2).map((p, i) => (
                          <div key={i}>{p.name} × {p.quantity}</div>
                        ))}
                        {order.products.length > 2 && (
                          <span className="text-muted-foreground">+{order.products.length - 2} more</span>
                        )}
                        <div className="text-primary font-medium mt-1">Total: {order.total_bottles} bottles</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.route ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3" />
                          {order.route.name}
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        <StatusIcon className="w-3 h-3" />
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        value={order.status}
                        onValueChange={(v) => updateStatus(order.id, v)}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
};

export default memo(AdminShopOrders);
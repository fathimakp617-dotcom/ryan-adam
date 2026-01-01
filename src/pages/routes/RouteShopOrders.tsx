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
import { Plus, RefreshCw, Loader2, Store, Phone, Check, X, Clock, Truck, MapPin, Trash2 } from "lucide-react";

interface ShopOrder {
  id: string;
  shop_name: string;
  contact_name: string | null;
  contact_phone: string | null;
  products: { name: string; quantity: number }[];
  total_bottles: number;
  notes: string | null;
  order_date: string;
  status: string;
}

const RouteShopOrders = () => {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [newRouteName, setNewRouteName] = useState("");
  const [newRouteDescription, setNewRouteDescription] = useState("");
  
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

  const getSessionCredentials = () => {
    const email = sessionStorage.getItem("route_email");
    const token = sessionStorage.getItem("route_token");
    return { email, token };
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('route-shop-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_orders' }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { email, token } = getSessionCredentials();
      if (!email || !token) throw new Error("No session");
      
      const { data, error } = await supabase.functions.invoke('manage-shop-orders', {
        body: { admin_email: email, admin_token: token, action: "list" }
      });
      
      if (error) throw error;
      setOrders(data?.shop_orders || []);
      setRoutes(data?.routes || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const addProductRow = () => {
    setFormData({ ...formData, products: [...formData.products, { name: "", quantity: 1 }] });
  };

  const updateProduct = (index: number, field: string, value: string | number) => {
    const newProducts = [...formData.products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setFormData({ ...formData, products: newProducts });
  };

  const removeProduct = (index: number) => {
    if (formData.products.length > 1) {
      setFormData({ ...formData, products: formData.products.filter((_, i) => i !== index) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { email, token } = getSessionCredentials();
      if (!email || !token) throw new Error("No session");
      
      const totalBottles = formData.products.reduce((sum, p) => sum + (p.quantity || 0), 0);
      
      const { error } = await supabase.functions.invoke('manage-shop-orders', {
        body: {
          admin_email: email,
          admin_token: token,
          action: "create",
          shop_order: { ...formData, total_bottles: totalBottles, route_id: formData.route_id || null },
        }
      });

      if (error) throw error;

      toast({ title: "Added", description: "Shop order created" });
      setIsDialogOpen(false);
      setFormData({
        shop_name: "", contact_name: "", contact_phone: "",
        products: [{ name: "", quantity: 1 }], notes: "",
        order_date: new Date().toISOString().split("T")[0], route_id: "",
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
      const { email, token } = getSessionCredentials();
      if (!email || !token) throw new Error("No session");
      
      const { error } = await supabase.functions.invoke('manage-shop-orders', {
        body: { admin_email: email, admin_token: token, action: "update_status", order_id: orderId, status: newStatus }
      });

      if (error) throw error;
      toast({ title: "Updated", description: `Marked as ${newStatus}` });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const createRoute = async () => {
    if (!newRouteName.trim()) return;
    setIsSaving(true);
    try {
      const { email, token } = getSessionCredentials();
      if (!email || !token) throw new Error("No session");
      
      const { error } = await supabase.functions.invoke('manage-shop-orders', {
        body: { admin_email: email, admin_token: token, action: "create_route", route_name: newRouteName, route_description: newRouteDescription }
      });

      if (error) throw error;
      toast({ title: "Success", description: "Route created" });
      setNewRouteName("");
      setNewRouteDescription("");
      setIsRouteDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRoute = async (routeId: string) => {
    try {
      const { email, token } = getSessionCredentials();
      if (!email || !token) throw new Error("No session");
      
      const { error } = await supabase.functions.invoke('manage-shop-orders', {
        body: { admin_email: email, admin_token: token, action: "delete_route", route_id: routeId }
      });

      if (error) throw error;
      toast({ title: "Deleted", description: "Route removed" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredOrders = orders.filter(o => statusFilter === "all" || o.status === statusFilter);

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
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Shop Orders</h1>
          <p className="text-muted-foreground">Manage shop deliveries</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Order
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
                    <div className="flex items-center justify-between">
                      <Label>Route</Label>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setIsRouteDialogOpen(true)}>
                        <Plus className="w-3 h-3 mr-1" />
                        Add Route
                      </Button>
                    </div>
                    <Select value={formData.route_id || "none"} onValueChange={(v) => setFormData({ ...formData, route_id: v === "none" ? "" : v })}>
                      <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No route</SelectItem>
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

                <Button type="submit" disabled={isSaving} className="w-full bg-green-600 hover:bg-green-700">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Add Order
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Route Management Dialog */}
          <Dialog open={isRouteDialogOpen} onOpenChange={setIsRouteDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Manage Routes
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>New Route Name *</Label>
                  <Input
                    value={newRouteName}
                    onChange={(e) => setNewRouteName(e.target.value)}
                    placeholder="e.g., North Zone"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={newRouteDescription}
                    onChange={(e) => setNewRouteDescription(e.target.value)}
                    placeholder="Optional description"
                  />
                </div>
                <Button onClick={createRoute} disabled={isSaving || !newRouteName.trim()} className="w-full bg-green-600 hover:bg-green-700">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Add Route
                </Button>

                {routes.length > 0 && (
                  <div className="pt-4 border-t">
                    <Label className="text-sm text-muted-foreground mb-2 block">Existing Routes</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {routes.map((route) => (
                        <div key={route.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <span className="text-sm font-medium">{route.name}</span>
                          <Button variant="ghost" size="sm" onClick={() => deleteRoute(route.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{orders.length}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-amber-400">{orders.filter(o => o.status === "pending").length}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">Bottles</p>
          <p className="text-2xl font-bold text-green-600">{orders.reduce((sum, o) => sum + o.total_bottles, 0)}</p>
        </div>
        <div className="p-4 rounded-lg border bg-card">
          <p className="text-sm text-muted-foreground">Delivered</p>
          <p className="text-2xl font-bold text-green-400">{orders.filter(o => o.status === "delivered").length}</p>
        </div>
      </div>

      {/* Filter */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="All status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="confirmed">Confirmed</SelectItem>
          <SelectItem value="delivered">Delivered</SelectItem>
        </SelectContent>
      </Select>

      {/* Orders List - Mobile friendly cards */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No orders found</div>
        ) : (
          filteredOrders.map((order) => {
            const StatusIcon = getStatusIcon(order.status);
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-lg border bg-card"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-lg">{order.shop_name}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    <StatusIcon className="w-3 h-3" />
                    {order.status}
                  </span>
                </div>

                {order.contact_phone && (
                  <a href={`tel:${order.contact_phone}`} className="flex items-center gap-2 text-sm text-primary mb-2">
                    <Phone className="w-4 h-4" />
                    {order.contact_phone}
                  </a>
                )}

                <div className="text-sm text-muted-foreground mb-3">
                  {order.products.map((p, i) => (
                    <span key={i}>{p.name} × {p.quantity}{i < order.products.length - 1 ? ", " : ""}</span>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-green-600 font-bold">{order.total_bottles} bottles</span>
                  <Select value={order.status} onValueChange={(v) => updateStatus(order.id, v)}>
                    <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default memo(RouteShopOrders);
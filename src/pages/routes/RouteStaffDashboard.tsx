import { useEffect, useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Store, Package, Clock, CheckCircle, Truck, RefreshCw, Loader2, MapPin, Plus, Trash2 } from "lucide-react";

interface Stats {
  todayOrders: number;
  pending: number;
  confirmed: number;
  delivered: number;
  totalBottles: number;
}

interface RecentOrder {
  id: string;
  shop_name: string;
  total_bottles: number;
  status: string;
  order_date: string;
}

interface Route {
  id: string;
  name: string;
  description: string | null;
}

const RouteStaffDashboard = () => {
  const [stats, setStats] = useState<Stats>({ todayOrders: 0, pending: 0, confirmed: 0, delivered: 0, totalBottles: 0 });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRouteDialogOpen, setIsRouteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newRouteName, setNewRouteName] = useState("");
  const [newRouteDescription, setNewRouteDescription] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const getSessionCredentials = () => {
    const email = sessionStorage.getItem("route_email");
    const token = sessionStorage.getItem("route_token");
    return { email, token };
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const { email, token } = getSessionCredentials();
      if (!email || !token) throw new Error("No session");

      const { data, error } = await supabase.functions.invoke("manage-shop-orders", {
        body: { admin_email: email, admin_token: token, action: "list" },
      });

      if (error) throw error;

      const orders = data?.shop_orders || [];
      const today = new Date().toISOString().split("T")[0];
      const todayOrders = orders.filter((o: any) => o.order_date === today);

      setStats({
        todayOrders: todayOrders.length,
        pending: orders.filter((o: any) => o.status === "pending").length,
        confirmed: orders.filter((o: any) => o.status === "confirmed").length,
        delivered: orders.filter((o: any) => o.status === "delivered").length,
        totalBottles: orders.reduce((sum: number, o: any) => sum + o.total_bottles, 0),
      });

      setRoutes(data?.routes || []);
      setRecentOrders(orders.slice(0, 5));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
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
      fetchStats();
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
      fetchStats();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-amber-400";
      case "confirmed": return "text-blue-400";
      case "delivered": return "text-green-400";
      default: return "text-muted-foreground";
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Route Dashboard</h1>
          <p className="text-muted-foreground">Manage your daily deliveries</p>
        </div>
        <Button onClick={fetchStats} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 rounded-lg border bg-card cursor-pointer"
          onClick={() => navigate("/routes/shop-orders")}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-500/10">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 rounded-lg border bg-card cursor-pointer"
          onClick={() => navigate("/routes/shop-orders")}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-500/10">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.confirmed}</p>
              <p className="text-sm text-muted-foreground">Confirmed</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 rounded-lg border bg-card cursor-pointer"
          onClick={() => navigate("/routes/shop-orders")}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-500/10">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.delivered}</p>
              <p className="text-sm text-muted-foreground">Delivered</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 rounded-lg border bg-card cursor-pointer"
          onClick={() => navigate("/routes/shop-orders")}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.todayOrders}</p>
              <p className="text-sm text-muted-foreground">Today</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 rounded-lg border bg-card"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-purple-500/10">
              <Truck className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalBottles}</p>
              <p className="text-sm text-muted-foreground">Total Bottles</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-lg border bg-card">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Store className="w-5 h-5 text-green-600" />
            Quick Actions
          </h3>
          <div className="space-y-2">
            <Button 
              className="w-full justify-start bg-green-600 hover:bg-green-700" 
              onClick={() => navigate("/routes/shop-orders")}
            >
              <Package className="w-4 h-4 mr-2" />
              View All Shop Orders
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => navigate("/routes/my-route")}
            >
              <MapPin className="w-4 h-4 mr-2" />
              View My Route
            </Button>
            <Dialog open={isRouteDialogOpen} onOpenChange={setIsRouteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Manage Routes
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" aria-describedby={undefined}>
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
                      <Label className="text-sm text-muted-foreground mb-2 block">Existing Routes ({routes.length})</Label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {routes.map((route) => (
                          <div key={route.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                            <div>
                              <span className="text-sm font-medium">{route.name}</span>
                              {route.description && <p className="text-xs text-muted-foreground">{route.description}</p>}
                            </div>
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

        <div className="p-6 rounded-lg border bg-card">
          <h3 className="font-semibold mb-4">Recent Shop Orders</h3>
          {recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">{order.shop_name}</p>
                    <p className="text-muted-foreground">{order.total_bottles} bottles</p>
                  </div>
                  <span className={`capitalize ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default memo(RouteStaffDashboard);
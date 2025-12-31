import { useEffect, useState, memo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Loader2, MapPin, Store, CheckCircle, Clock, Truck } from "lucide-react";

interface ShopOrder {
  id: string;
  shop_name: string;
  contact_phone: string | null;
  products: { name: string; quantity: number }[];
  total_bottles: number;
  status: string;
  order_date: string;
}

const RouteMyRoute = () => {
  const [todayOrders, setTodayOrders] = useState<ShopOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const getSessionCredentials = () => {
    const email = sessionStorage.getItem("route_email");
    const token = sessionStorage.getItem("route_token");
    return { email, token };
  };

  useEffect(() => {
    fetchData();
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
      
      const today = new Date().toISOString().split("T")[0];
      const orders = (data?.shop_orders || []).filter((o: any) => 
        o.order_date === today && o.status !== "cancelled"
      );
      
      setTodayOrders(orders);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const markDelivered = async (orderId: string) => {
    try {
      const { email, token } = getSessionCredentials();
      if (!email || !token) throw new Error("No session");
      
      const { error } = await supabase.functions.invoke('manage-shop-orders', {
        body: { admin_email: email, admin_token: token, action: "update_status", order_id: orderId, status: "delivered" }
      });

      if (error) throw error;
      
      toast({ title: "Done!", description: "Marked as delivered" });
      setTodayOrders(todayOrders.map(o => o.id === orderId ? { ...o, status: "delivered" } : o));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const pendingOrders = todayOrders.filter(o => o.status === "pending" || o.status === "confirmed");
  const deliveredOrders = todayOrders.filter(o => o.status === "delivered");

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
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="w-6 h-6 text-green-600" />
            Today's Route
          </h1>
          <p className="text-muted-foreground">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Progress */}
      <div className="p-6 rounded-lg border bg-card">
        <div className="flex justify-between items-center mb-4">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-bold text-green-600">{deliveredOrders.length}/{todayOrders.length} delivered</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div 
            className="bg-green-600 h-3 rounded-full transition-all"
            style={{ width: todayOrders.length ? `${(deliveredOrders.length / todayOrders.length) * 100}%` : "0%" }}
          />
        </div>
        <div className="mt-4 flex justify-between text-sm">
          <span>{pendingOrders.reduce((sum, o) => sum + o.total_bottles, 0)} bottles remaining</span>
          <span className="text-green-600">{deliveredOrders.reduce((sum, o) => sum + o.total_bottles, 0)} bottles delivered</span>
        </div>
      </div>

      {/* Pending Deliveries */}
      {pendingOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            To Deliver ({pendingOrders.length})
          </h2>
          <div className="space-y-3">
            {pendingOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-lg border bg-card flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-green-600" />
                    <span className="font-semibold">{order.shop_name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {order.products.map(p => `${p.name} × ${p.quantity}`).join(", ")}
                  </p>
                  <p className="text-green-600 font-medium mt-1">{order.total_bottles} bottles</p>
                </div>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => markDelivered(order.id)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Delivered
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {deliveredOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-green-400" />
            Completed ({deliveredOrders.length})
          </h2>
          <div className="space-y-2">
            {deliveredOrders.map((order) => (
              <div
                key={order.id}
                className="p-3 rounded-lg border bg-green-500/5 border-green-500/20 flex justify-between items-center"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>{order.shop_name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{order.total_bottles} bottles</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {todayOrders.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No deliveries today</h3>
          <p className="text-muted-foreground">Check back later or add orders from Shop Orders</p>
        </div>
      )}
    </motion.div>
  );
};

export default memo(RouteMyRoute);
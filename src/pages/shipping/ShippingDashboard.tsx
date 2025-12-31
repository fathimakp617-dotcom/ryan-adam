import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";

interface OrderStats {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  order_status: string;
  created_at: string;
  shipping_address: any;
}

const SHIPPING_SESSION_KEY = "rayn_shipping_session";

const ShippingDashboard = () => {
  const [stats, setStats] = useState<OrderStats>({ pending: 0, processing: 0, shipped: 0, delivered: 0 });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const getSessionCredentials = () => {
    const stored = sessionStorage.getItem(SHIPPING_SESSION_KEY);
    if (stored) {
      const session = JSON.parse(stored);
      return { email: session.email, token: session.token };
    }
    return null;
  };

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const credentials = getSessionCredentials();
      if (!credentials) return;

      const { data, error } = await supabase.functions.invoke("get-admin-stats", {
        body: { 
          admin_email: credentials.email,
          admin_token: credentials.token
        },
      });

      if (error) throw error;

      if (data) {
        // Stats are inside data.stats object
        const statsData = data.stats || {};
        setStats({
          pending: statsData.pending || 0,
          processing: statsData.processing || 0,
          shipped: statsData.shipped || 0,
          delivered: statsData.delivered || 0,
        });
        setRecentOrders(data.recentOrders?.slice(0, 5) || []);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "processing": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "shipped": return "bg-purple-500/10 text-purple-600 border-purple-200";
      case "delivered": return "bg-green-500/10 text-green-600 border-green-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statCards = [
    { 
      label: "Pending", 
      value: stats.pending, 
      icon: Clock, 
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      description: "Awaiting processing"
    },
    { 
      label: "Processing", 
      value: stats.processing, 
      icon: Package, 
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      description: "Being prepared"
    },
    { 
      label: "Shipped", 
      value: stats.shipped, 
      icon: Truck, 
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      description: "In transit"
    },
    { 
      label: "Delivered", 
      value: stats.delivered, 
      icon: CheckCircle, 
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      description: "Completed"
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Shipping Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Order fulfillment overview</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/shipping/orders")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <span className="text-2xl font-bold">{stat.value}</span>
                </div>
                <p className="font-medium text-sm">{stat.label}</p>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              Process Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View and update order statuses, add tracking information
            </p>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate("/shipping/orders")}
            >
              View All Orders
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5 text-purple-500" />
              Shipping Labels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Generate and print shipping labels for orders
            </p>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => navigate("/shipping/orders")}
            >
              Go to Orders
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Orders</CardTitle>
          <Button variant="link" size="sm" onClick={() => navigate("/shipping/orders")}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No recent orders</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => navigate("/shipping/orders")}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">{order.order_number}</span>
                      <Badge variant="outline" className={getStatusColor(order.order_status)}>
                        {order.order_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {order.customer_name} • {formatDate(order.created_at)}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShippingDashboard;

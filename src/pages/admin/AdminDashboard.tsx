import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, IndianRupee, Clock, CheckCircle, Users, TrendingUp } from "lucide-react";

interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();

    // Subscribe to real-time order updates
    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order change detected:', payload);
          // Refetch stats when any order changes
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    try {
      // Get admin session from localStorage
      const sessionData = localStorage.getItem("rayn_admin_session");
      if (!sessionData) {
        throw new Error("No admin session found");
      }
      
      const session = JSON.parse(sessionData);
      
      const { data, error } = await supabase.functions.invoke('get-admin-stats', {
        body: {
          admin_email: session.email,
          admin_token: session.token,
        }
      });
      
      if (error) throw error;
      
      if (data) {
        setStats(data.stats);
        setRecentOrders(data.recentOrders || []);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const navigateToFilteredOrders = (status?: string) => {
    if (status) {
      navigate(`/admin/orders?status=${status}`);
    } else {
      navigate("/admin/orders");
    }
  };

  const statCards = [
    {
      title: "Total Orders",
      value: stats.total,
      icon: Package,
      color: "text-primary",
      bgColor: "bg-primary/10",
      onClick: () => navigateToFilteredOrders(),
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: IndianRupee,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      onClick: () => navigateToFilteredOrders(),
    },
    {
      title: "Pending Orders",
      value: stats.pending,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      onClick: () => navigateToFilteredOrders("pending"),
    },
    {
      title: "Delivered",
      value: stats.delivered,
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      onClick: () => navigateToFilteredOrders("delivered"),
    },
  ];

  const statusBreakdown = [
    { status: "pending", label: "Pending", count: stats.pending, color: "yellow" },
    { status: "processing", label: "Processing", count: stats.processing, color: "blue" },
    { status: "shipped", label: "Shipped", count: stats.shipped, color: "purple" },
    { status: "delivered", label: "Delivered", count: stats.delivered, color: "green" },
    { status: "cancelled", label: "Cancelled", count: stats.cancelled, color: "red" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className="bg-card border-border cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-200"
              onClick={stat.onClick}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className="bg-card border-border cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-200"
          onClick={() => navigate("/admin/customers")}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">View Customers</h3>
              <p className="text-sm text-muted-foreground">Export customer emails for marketing</p>
            </div>
          </CardContent>
        </Card>
        <Card 
          className="bg-card border-border cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-200"
          onClick={() => navigate("/admin/orders")}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <TrendingUp className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Manage Orders</h3>
              <p className="text-sm text-muted-foreground">Update status, download shipping labels</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Breakdown */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Order Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {statusBreakdown.map((item) => (
              <div 
                key={item.status}
                onClick={() => navigateToFilteredOrders(item.status)}
                className={`text-center p-4 bg-${item.color}-500/10 rounded-lg cursor-pointer hover:ring-2 hover:ring-${item.color}-500/30 transition-all duration-200`}
              >
                <div className={`text-2xl font-bold text-${item.color}-500`}>{item.count}</div>
                <div className="text-sm text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link 
            to="/admin/orders" 
            className="text-sm text-primary hover:underline"
          >
            View All
          </Link>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div 
                  key={order.id} 
                  onClick={() => navigate("/admin/orders")}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-foreground">{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{formatCurrency(order.total)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.order_status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                      order.order_status === 'processing' ? 'bg-blue-500/10 text-blue-500' :
                      order.order_status === 'shipped' ? 'bg-purple-500/10 text-purple-500' :
                      order.order_status === 'delivered' ? 'bg-green-500/10 text-green-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>
                      {order.order_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, IndianRupee, Clock, CheckCircle, Users, TrendingUp, Calendar, RefreshCw, BarChart3 } from "lucide-react";

interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  orders: number;
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
  const [allTimeStats, setAllTimeStats] = useState({ total: 0, totalRevenue: 0 });
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
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
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Refetch when date filter changes
  useEffect(() => {
    if (dateFilter !== "custom") {
      fetchStats();
    }
  }, [dateFilter]);

  const getDateRange = () => {
    const now = new Date();
    let dateFrom: string | undefined;
    let dateTo: string | undefined;

    switch (dateFilter) {
      case "today":
        dateFrom = now.toISOString().split("T")[0];
        dateTo = now.toISOString().split("T")[0];
        break;
      case "yesterday":
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        dateFrom = yesterday.toISOString().split("T")[0];
        dateTo = yesterday.toISOString().split("T")[0];
        break;
      case "last7days":
        const last7 = new Date(now);
        last7.setDate(last7.getDate() - 7);
        dateFrom = last7.toISOString().split("T")[0];
        dateTo = now.toISOString().split("T")[0];
        break;
      case "thisMonth":
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
        dateTo = now.toISOString().split("T")[0];
        break;
      case "lastMonth":
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        dateFrom = lastMonthStart.toISOString().split("T")[0];
        dateTo = lastMonthEnd.toISOString().split("T")[0];
        break;
      case "thisYear":
        dateFrom = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
        dateTo = now.toISOString().split("T")[0];
        break;
      case "custom":
        dateFrom = customDateFrom || undefined;
        dateTo = customDateTo || undefined;
        break;
      default:
        // "all" - no date filter
        break;
    }

    return { dateFrom, dateTo };
  };

  const fetchStats = async () => {
    try {
      const sessionData = localStorage.getItem("rayn_admin_session");
      if (!sessionData) {
        throw new Error("No admin session found");
      }
      
      const session = JSON.parse(sessionData);
      const { dateFrom, dateTo } = getDateRange();
      
      const { data, error } = await supabase.functions.invoke('get-admin-stats', {
        body: {
          admin_email: session.email,
          admin_token: session.token,
          date_from: dateFrom,
          date_to: dateTo,
        }
      });
      
      if (error) throw error;
      
      if (data) {
        setStats(data.stats);
        setAllTimeStats(data.allTimeStats || { total: 0, totalRevenue: 0 });
        setMonthlyRevenue(data.monthlyRevenue || []);
        setRecentOrders(data.recentOrders || []);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomDateApply = () => {
    if (customDateFrom || customDateTo) {
      fetchStats();
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

  const getFilterLabel = () => {
    switch (dateFilter) {
      case "today": return "Today";
      case "yesterday": return "Yesterday";
      case "last7days": return "Last 7 Days";
      case "thisMonth": return "This Month";
      case "lastMonth": return "Last Month";
      case "thisYear": return "This Year";
      case "custom": return "Custom Range";
      default: return "All Time";
    }
  };

  const statCards = [
    {
      title: "Orders",
      value: stats.total,
      subtitle: dateFilter !== "all" ? `${getFilterLabel()}` : "All Time",
      icon: Package,
      color: "text-primary",
      bgColor: "bg-primary/10",
      onClick: () => navigateToFilteredOrders(),
    },
    {
      title: "Revenue",
      value: formatCurrency(stats.totalRevenue),
      subtitle: dateFilter !== "all" ? `${getFilterLabel()}` : "All Time",
      icon: IndianRupee,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      onClick: () => navigateToFilteredOrders(),
    },
    {
      title: "Pending",
      value: stats.pending,
      subtitle: "Needs attention",
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      onClick: () => navigateToFilteredOrders("pending"),
    },
    {
      title: "Delivered",
      value: stats.delivered,
      subtitle: "Completed",
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

  // Find max revenue for chart scaling
  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your admin dashboard</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Date Filter Section */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Filter by Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[180px]">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateFilter === "custom" && (
              <>
                <div className="flex items-center gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">From</label>
                    <Input
                      type="date"
                      value={customDateFrom}
                      onChange={(e) => setCustomDateFrom(e.target.value)}
                      className="w-[150px]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">To</label>
                    <Input
                      type="date"
                      value={customDateTo}
                      onChange={(e) => setCustomDateTo(e.target.value)}
                      className="w-[150px]"
                    />
                  </div>
                </div>
                <Button onClick={handleCustomDateApply} size="sm">
                  Apply
                </Button>
              </>
            )}

            {dateFilter !== "all" && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setDateFilter("all");
                  setCustomDateFrom("");
                  setCustomDateTo("");
                }}
              >
                Clear Filter
              </Button>
            )}
          </div>

          {/* All-time comparison when filtered */}
          {dateFilter !== "all" && (
            <div className="mt-4 pt-4 border-t border-border flex gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">All-time Orders: </span>
                <span className="font-semibold text-foreground">{allTimeStats.total}</span>
              </div>
              <div>
                <span className="text-muted-foreground">All-time Revenue: </span>
                <span className="font-semibold text-green-500">{formatCurrency(allTimeStats.totalRevenue)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
                <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Monthly Revenue Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monthly Revenue ({new Date().getFullYear()})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-48">
            {monthlyRevenue.map((month, index) => (
              <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center">
                  <span className="text-xs text-muted-foreground mb-1">
                    {month.revenue > 0 ? formatCurrency(month.revenue) : ""}
                  </span>
                  <div 
                    className="w-full bg-primary/20 hover:bg-primary/30 transition-colors rounded-t cursor-pointer relative group"
                    style={{ 
                      height: `${Math.max((month.revenue / maxRevenue) * 140, 4)}px`,
                    }}
                  >
                    <div 
                      className="absolute inset-0 bg-primary rounded-t"
                      style={{ 
                        height: `${Math.max((month.revenue / maxRevenue) * 100, month.revenue > 0 ? 10 : 0)}%`,
                      }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {month.orders} orders
                    </div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{month.month}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
          <CardTitle>Order Status Breakdown {dateFilter !== "all" && `(${getFilterLabel()})`}</CardTitle>
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

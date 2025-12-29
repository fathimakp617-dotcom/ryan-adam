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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, IndianRupee, Clock, CheckCircle, Users, TrendingUp, Calendar, RefreshCw, BarChart3, CreditCard, Banknote, Wallet } from "lucide-react";

interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
}

interface PaymentBreakdown {
  cod: {
    orders: number;
    revenue: number;
    pending: number;
    delivered: number;
  };
  online: {
    orders: number;
    revenue: number;
    pending: number;
    delivered: number;
  };
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  orders: number;
  cod: number;
  online: number;
}

interface AllTimeStats {
  total: number;
  totalRevenue: number;
  codRevenue: number;
  onlineRevenue: number;
  codOrders: number;
  onlineOrders: number;
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
  const [allTimeStats, setAllTimeStats] = useState<AllTimeStats>({
    total: 0,
    totalRevenue: 0,
    codRevenue: 0,
    onlineRevenue: 0,
    codOrders: 0,
    onlineOrders: 0,
  });
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown>({
    cod: { orders: 0, revenue: 0, pending: 0, delivered: 0 },
    online: { orders: 0, revenue: 0, pending: 0, delivered: 0 },
  });
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [revenueView, setRevenueView] = useState<"all" | "cod" | "online">("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel('admin-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
    }

    return { dateFrom, dateTo };
  };

  const fetchStats = async () => {
    try {
      const sessionData = localStorage.getItem("rayn_admin_session");
      if (!sessionData) throw new Error("No admin session found");
      
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
        setAllTimeStats(data.allTimeStats || { total: 0, totalRevenue: 0, codRevenue: 0, onlineRevenue: 0, codOrders: 0, onlineOrders: 0 });
        setPaymentBreakdown(data.paymentBreakdown || { cod: { orders: 0, revenue: 0, pending: 0, delivered: 0 }, online: { orders: 0, revenue: 0, pending: 0, delivered: 0 } });
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
    if (customDateFrom || customDateTo) fetchStats();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const navigateToFilteredOrders = (status?: string) => {
    navigate(status ? `/admin/orders?status=${status}` : "/admin/orders");
  };

  const getFilterLabel = () => {
    const labels: Record<string, string> = {
      today: "Today",
      yesterday: "Yesterday",
      last7days: "Last 7 Days",
      thisMonth: "This Month",
      lastMonth: "Last Month",
      thisYear: "This Year",
      custom: "Custom Range",
    };
    return labels[dateFilter] || "All Time";
  };

  const getRevenueByView = (month: MonthlyRevenue) => {
    if (revenueView === "cod") return month.cod;
    if (revenueView === "online") return month.online;
    return month.revenue;
  };

  const maxRevenue = Math.max(...monthlyRevenue.map(m => getRevenueByView(m)), 1);

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
                <Button onClick={handleCustomDateApply} size="sm">Apply</Button>
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
        </CardContent>
      </Card>

      {/* Revenue Breakdown by Payment Method */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Revenue by Payment Method
            <span className="text-sm font-normal text-muted-foreground ml-2">({getFilterLabel()})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Revenue */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-5 border border-primary/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <IndianRupee className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Total Revenue</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-sm text-muted-foreground mt-2">{stats.total} orders</p>
            </div>

            {/* COD Revenue */}
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-xl p-5 border border-orange-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Banknote className="h-5 w-5 text-orange-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">COD Revenue</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(paymentBreakdown.cod.revenue)}</p>
              <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                <span>{paymentBreakdown.cod.orders} orders</span>
                <span className="text-yellow-500">{paymentBreakdown.cod.pending} pending</span>
              </div>
            </div>

            {/* Online Revenue */}
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl p-5 border border-blue-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Online Revenue</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(paymentBreakdown.online.revenue)}</p>
              <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                <span>{paymentBreakdown.online.orders} orders</span>
                <span className="text-green-500">{paymentBreakdown.online.delivered} delivered</span>
              </div>
            </div>
          </div>

          {/* Revenue Percentage Bar */}
          {stats.totalRevenue > 0 && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Payment Split</span>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                    COD {((paymentBreakdown.cod.revenue / stats.totalRevenue) * 100).toFixed(1)}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    Online {((paymentBreakdown.online.revenue / stats.totalRevenue) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden flex">
                <div 
                  className="bg-orange-500 h-full transition-all duration-300"
                  style={{ width: `${(paymentBreakdown.cod.revenue / stats.totalRevenue) * 100}%` }}
                />
                <div 
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${(paymentBreakdown.online.revenue / stats.totalRevenue) * 100}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Orders", value: stats.total, subtitle: getFilterLabel(), icon: Package, color: "text-primary", bgColor: "bg-primary/10", onClick: () => navigateToFilteredOrders() },
          { title: "Revenue", value: formatCurrency(stats.totalRevenue), subtitle: getFilterLabel(), icon: IndianRupee, color: "text-green-500", bgColor: "bg-green-500/10", onClick: () => navigateToFilteredOrders() },
          { title: "Pending", value: stats.pending, subtitle: "Needs attention", icon: Clock, color: "text-yellow-500", bgColor: "bg-yellow-500/10", onClick: () => navigateToFilteredOrders("pending") },
          { title: "Delivered", value: stats.delivered, subtitle: "Completed", icon: CheckCircle, color: "text-green-500", bgColor: "bg-green-500/10", onClick: () => navigateToFilteredOrders("delivered") },
        ].map((stat, index) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <Card className="bg-card border-border cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-200" onClick={stat.onClick}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
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

      {/* Monthly Revenue Chart with Tabs */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Monthly Revenue ({new Date().getFullYear()})
            </CardTitle>
            <Tabs value={revenueView} onValueChange={(v) => setRevenueView(v as "all" | "cod" | "online")}>
              <TabsList className="grid grid-cols-3 w-[240px]">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="cod">COD</TabsTrigger>
                <TabsTrigger value="online">Online</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-48">
            {monthlyRevenue.map((month) => {
              const value = getRevenueByView(month);
              return (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col items-center">
                    <span className="text-xs text-muted-foreground mb-1">
                      {value > 0 ? formatCurrency(value) : ""}
                    </span>
                    <div 
                      className={`w-full rounded-t cursor-pointer relative group transition-colors ${
                        revenueView === "cod" ? "bg-orange-500/20 hover:bg-orange-500/30" :
                        revenueView === "online" ? "bg-blue-500/20 hover:bg-blue-500/30" :
                        "bg-primary/20 hover:bg-primary/30"
                      }`}
                      style={{ height: `${Math.max((value / maxRevenue) * 140, 4)}px` }}
                    >
                      <div 
                        className={`absolute inset-0 rounded-t ${
                          revenueView === "cod" ? "bg-orange-500" :
                          revenueView === "online" ? "bg-blue-500" :
                          "bg-primary"
                        }`}
                        style={{ height: `${Math.max((value / maxRevenue) * 100, value > 0 ? 10 : 0)}%` }}
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {month.orders} orders
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{month.month}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-200" onClick={() => navigate("/admin/customers")}>
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
        <Card className="bg-card border-border cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-200" onClick={() => navigate("/admin/orders")}>
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
            {[
              { status: "pending", label: "Pending", count: stats.pending, bgColor: "bg-yellow-500/10", textColor: "text-yellow-500" },
              { status: "processing", label: "Processing", count: stats.processing, bgColor: "bg-blue-500/10", textColor: "text-blue-500" },
              { status: "shipped", label: "Shipped", count: stats.shipped, bgColor: "bg-purple-500/10", textColor: "text-purple-500" },
              { status: "delivered", label: "Delivered", count: stats.delivered, bgColor: "bg-green-500/10", textColor: "text-green-500" },
              { status: "cancelled", label: "Cancelled", count: stats.cancelled, bgColor: "bg-red-500/10", textColor: "text-red-500" },
            ].map((item) => (
              <div 
                key={item.status}
                onClick={() => navigateToFilteredOrders(item.status)}
                className={`text-center p-4 ${item.bgColor} rounded-lg cursor-pointer hover:ring-2 hover:ring-border transition-all duration-200`}
              >
                <div className={`text-2xl font-bold ${item.textColor}`}>{item.count}</div>
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
          <Link to="/admin/orders" className="text-sm text-primary hover:underline">View All</Link>
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
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${order.payment_method === "cod" || order.payment_method === "COD" ? "bg-orange-500/10" : "bg-blue-500/10"}`}>
                      {order.payment_method === "cod" || order.payment_method === "COD" ? (
                        <Banknote className="h-4 w-4 text-orange-500" />
                      ) : (
                        <CreditCard className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                    </div>
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

      {/* Reminder Note */}
      <Card className="bg-amber-500/10 border-amber-500/20">
        <CardContent className="p-4 flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-amber-500" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>Reminder:</strong> Razorpay integration pending. Let me know when you're ready to set it up!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;

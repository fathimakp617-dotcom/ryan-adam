import { useState, useEffect, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  Mail,
  Shield,
  Clock,
  Package,
  CheckCircle,
  RefreshCw,
  Loader2,
  Save,
  Bell,
  Calendar,
  Send,
  Activity,
  IndianRupee,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const ADMIN_SESSION_KEY = "rayn_admin_session";

interface StaffInfo {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  login_count: number;
  last_login: string | null;
}

interface OrderStats {
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  total: number;
  totalRevenue: number;
}

interface Notification {
  id: string;
  notification_type: string;
  subject: string;
  sent_at: string;
  sent_by: string;
  order_number?: string;
  details?: {
    old_status?: string;
    new_status?: string;
    customer_name?: string;
  };
}

const AdminAccount = () => {
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats>({
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    total: 0,
    totalRevenue: 0,
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const { toast } = useToast();

  const getSessionCredentials = () => {
    const stored = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (stored) {
      const session = JSON.parse(stored);
      return { email: session.email, token: session.token };
    }
    return null;
  };

  const fetchAccountData = async () => {
    setIsLoading(true);
    try {
      const credentials = getSessionCredentials();
      if (!credentials) return;

      // Fetch staff info
      const { data: staffData, error: staffError } = await supabase.functions.invoke("get-shipping-account", {
        body: { email: credentials.email },
      });

      if (staffError) throw staffError;

      if (staffData) {
        setStaffInfo(staffData.staff);
        setName(staffData.staff?.name || "");
        setNotifications(staffData.notifications || []);
      }

      // Fetch order stats
      const { data: statsData, error: statsError } = await supabase.functions.invoke("get-admin-stats", {
        body: { 
          admin_email: credentials.email,
          admin_token: credentials.token
        },
      });

      if (statsError) throw statsError;

      if (statsData?.stats) {
        setOrderStats({
          pending: statsData.stats.pending || 0,
          processing: statsData.stats.processing || 0,
          shipped: statsData.stats.shipped || 0,
          delivered: statsData.stats.delivered || 0,
          cancelled: statsData.stats.cancelled || 0,
          total: statsData.stats.total || 0,
          totalRevenue: statsData.stats.totalRevenue || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching account data:", error);
      toast({
        title: "Error",
        description: "Failed to load account data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountData();
  }, []);

  const handleSaveName = async () => {
    if (!staffInfo) return;

    setIsSaving(true);
    try {
      const credentials = getSessionCredentials();
      if (!credentials) return;

      const { data, error } = await supabase.functions.invoke("update-staff-name", {
        body: { 
          email: credentials.email,
          name: name.trim() 
        },
      });

      if (error) throw error;

      setStaffInfo({ ...staffInfo, name: name.trim() });
      toast({
        title: "Name Updated",
        description: "Your display name has been updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update name",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case "account_created":
        return { label: "Account Created", color: "bg-green-500/10 text-green-600 border-green-500/30", icon: "👤" };
      case "password_changed":
        return { label: "Password Changed", color: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: "🔑" };
      case "account_blocked":
        return { label: "Account Blocked", color: "bg-red-500/10 text-red-600 border-red-500/30", icon: "⛔" };
      case "account_unblocked":
        return { label: "Account Unblocked", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: "✓" };
      case "order_status_update":
        return { label: "Order Update", color: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: "📦" };
      default:
        return { label: type, color: "bg-muted text-muted-foreground", icon: "📧" };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">My Account</h1>
          <p className="text-muted-foreground text-sm mt-1">
            View your profile and activity
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAccountData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-10 w-10 text-primary" />
                </div>
              </div>

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                  />
                  <Button 
                    size="icon" 
                    onClick={handleSaveName}
                    disabled={isSaving || name === (staffInfo?.name || "")}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Email</Label>
                <p className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {staffInfo?.email}
                </p>
              </div>

              {/* Role */}
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Role</Label>
                <Badge variant="default" className="flex items-center gap-1 w-fit">
                  <Shield className="h-3 w-3" />
                  {staffInfo?.role || "Admin"}
                </Badge>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Status</Label>
                {staffInfo?.is_active !== false ? (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/30 w-fit">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="w-fit">Blocked</Badge>
                )}
              </div>

              <Separator />

              {/* Activity Stats */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{staffInfo?.login_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Logins</p>
                </div>
                <div>
                  <p className="text-sm">
                    {staffInfo?.last_login 
                      ? format(new Date(staffInfo.last_login), "MMM d, yyyy")
                      : "Never"
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Last Login</p>
                </div>
              </div>

              {staffInfo?.created_at && (
                <p className="text-xs text-muted-foreground text-center">
                  Member since {format(new Date(staffInfo.created_at), "MMMM yyyy")}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats and Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Order Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Order Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-3xl font-bold text-foreground">{orderStats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <div className="flex items-center justify-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <p className="text-xl font-bold text-primary">{formatCurrency(orderStats.totalRevenue)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                </div>
                <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <p className="text-2xl font-bold text-yellow-600">{orderStats.pending}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
                <div className="text-center p-4 bg-green-500/10 rounded-lg">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <p className="text-2xl font-bold text-green-600">{orderStats.delivered}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Delivered</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {notifications.map((notification) => {
                      const typeInfo = getNotificationTypeLabel(notification.notification_type);
                      return (
                        <div
                          key={notification.id}
                          className="p-4 bg-muted/50 rounded-lg space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span>{typeInfo.icon}</span>
                              <Badge variant="outline" className={typeInfo.color}>
                                {typeInfo.label}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(notification.sent_at), "MMM d, h:mm a")}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{notification.subject}</p>
                          
                          {notification.notification_type === "order_status_update" && notification.order_number && (
                            <div className="text-xs bg-background p-2 rounded flex flex-wrap gap-x-4 gap-y-1">
                              <span>Order: <strong>{notification.order_number}</strong></span>
                              {notification.details?.customer_name && (
                                <span>Customer: {notification.details.customer_name}</span>
                              )}
                              {notification.details?.old_status && notification.details?.new_status && (
                                <span>
                                  <span className="capitalize">{notification.details.old_status}</span>
                                  {" → "}
                                  <span className="capitalize font-semibold">{notification.details.new_status}</span>
                                </span>
                              )}
                            </div>
                          )}
                          
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Send className="h-3 w-3" />
                            Sent by: {notification.sent_by}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default memo(AdminAccount);
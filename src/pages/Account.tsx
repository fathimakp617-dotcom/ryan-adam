import { useEffect, useState, memo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { downloadInvoicePDF } from "@/lib/generateInvoicePDF";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Copy, 
  Link, 
  Users, 
  IndianRupee, 
  LogOut, 
  Check, 
  User, 
  Share2,
  Package,
  Settings,
  Save,
  Phone,
  Mail,
  Eye,
  Download,
  X,
  RotateCcw,
  AlertCircle,
  Gift
} from "lucide-react";
import ReturnRequestDialog from "@/components/ReturnRequestDialog";
import LoyaltyCoupons from "@/components/LoyaltyCoupons";
import WithdrawalRequestDialog from "@/components/WithdrawalRequestDialog";
import WithdrawalHistory from "@/components/WithdrawalHistory";

interface AffiliateData {
  id: string;
  name: string;
  email: string;
  code: string;
  commission_percent: number;
  coupon_discount_percent: number;
  total_referrals: number;
  total_earnings: number;
  is_active: boolean;
  created_at: string;
}

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface ShippingAddress {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total: number;
  subtotal: number;
  discount: number | null;
  shipping: number | null;
  order_status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  items: OrderItem[];
  shipping_address: ShippingAddress;
  coupon_code: string | null;
  return_status: string | null;
  return_reason: string | null;
  return_details: string | null;
  return_requested_at: string | null;
}

interface ProfileData {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

const Account = () => {
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnOrder, setReturnOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreatingAffiliate, setIsCreatingAffiliate] = useState(false);
  const [affiliateName, setAffiliateName] = useState("");
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch profile data
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setProfileForm({
          first_name: profileData.first_name || "",
          last_name: profileData.last_name || "",
          phone: profileData.phone || "",
        });
      }

      // Fetch affiliate data
      const { data: affiliateData } = await supabase
        .from("affiliates")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (affiliateData) {
        setAffiliate(affiliateData);
      }

      // Fetch orders
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_email", user.email)
        .order("created_at", { ascending: false });

      if (ordersData) {
        const mappedOrders: Order[] = ordersData.map((order) => ({
          ...order,
          items: (order.items as unknown as OrderItem[]) || [],
          shipping_address: (order.shipping_address as unknown as ShippingAddress) || {
            address: "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
          },
        }));
        setOrders(mappedOrders);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsSavingProfile(true);
    try {
      // Use upsert to create profile if it doesn't exist, or update if it does
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          phone: profileForm.phone,
          updated_at: new Date().toISOString(),
        }, { 
          onConflict: 'user_id' 
        });

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      });

      // Refresh profile data
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    } catch (error: any) {
      // Handle duplicate phone number error
      if (error.message?.includes('profiles_phone_unique') || error.code === '23505') {
        toast({
          title: "Phone Number Already Registered",
          description: "This phone number is already associated with another account.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to update profile",
          variant: "destructive",
        });
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const generateAffiliateCode = (name: string) => {
    const cleanName = name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${cleanName}${random}`;
  };

  const handleCreateAffiliate = async () => {
    if (!user || !affiliateName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingAffiliate(true);
    try {
      const code = generateAffiliateCode(affiliateName);
      
      const { data, error } = await supabase
        .from("affiliates")
        .insert({
          user_id: user.id,
          name: affiliateName,
          email: user.email,
          code: code,
          commission_percent: 10,
          coupon_discount_percent: 10,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Error",
            description: "This affiliate code already exists. Please try again.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      setAffiliate(data);
      toast({
        title: "Affiliate Account Created!",
        description: "You can now start earning commissions.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create affiliate account",
        variant: "destructive",
      });
    } finally {
      setIsCreatingAffiliate(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const getReferralLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/?ref=${affiliate?.code}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getReferralLink());
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-500 bg-yellow-500/10";
      case "processing":
        return "text-blue-500 bg-blue-500/10";
      case "shipped":
        return "text-purple-500 bg-purple-500/10";
      case "delivered":
        return "text-green-500 bg-green-500/10";
      case "cancelled":
        return "text-red-500 bg-red-500/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getReturnStatusColor = (status: string | null) => {
    switch (status) {
      case "requested":
        return "text-orange-500 bg-orange-500/10";
      case "approved":
        return "text-green-500 bg-green-500/10";
      case "rejected":
        return "text-red-500 bg-red-500/10";
      case "completed":
        return "text-blue-500 bg-blue-500/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const canRequestReturn = (order: Order) => {
    // Only delivered orders without an existing return request
    if (order.order_status !== "delivered") return false;
    if (order.return_status) return false;
    
    // Check if within 7-day window
    const deliveryDate = new Date(order.created_at);
    const now = new Date();
    const daysSinceOrder = Math.floor((now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysSinceOrder <= 7; // Allow 7 days from order for return
  };

  const handleReturnRequest = async (data: { reason: string; details: string; images: string[] }) => {
    if (!returnOrder || !user) return;

    setIsSubmittingReturn(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const { data: result, error } = await supabase.functions.invoke('request-return', {
        body: { 
          order_id: returnOrder.id, 
          reason: data.reason,
          details: data.details,
          images: data.images 
        },
      });

      if (error) throw error;

      toast({
        title: "Return Request Submitted",
        description: `Your return request for order ${returnOrder.order_number} has been submitted. We'll contact you within 24-48 hours.`,
      });

      // Update local state
      setOrders(orders.map(order => 
        order.id === returnOrder.id 
          ? { ...order, return_status: 'requested', return_reason: data.reason, return_details: data.details } 
          : order
      ));

      // Update selected order if viewing it
      if (selectedOrder?.id === returnOrder.id) {
        setSelectedOrder({ 
          ...selectedOrder, 
          return_status: 'requested', 
          return_reason: data.reason,
          return_details: data.details 
        });
      }

      setIsReturnModalOpen(false);
      setReturnOrder(null);
    } catch (error) {
      console.error("Error submitting return request:", error);
      toast({
        title: "Failed to submit return request",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const handleCancelOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to cancel order ${orderNumber}? This action cannot be undone.`)) {
      return;
    }

    setCancellingOrderId(orderId);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-order', {
        body: { order_id: orderId },
      });

      if (error) throw error;

      toast({
        title: "Order Cancelled",
        description: `Order ${orderNumber} has been cancelled successfully.`,
      });

      // Update the order in local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, order_status: 'cancelled' } 
          : order
      ));

      // Close modal if the cancelled order is being viewed
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, order_status: 'cancelled' });
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast({
        title: "Failed to cancel order",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setCancellingOrderId(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
                  My Account
                </h1>
                <p className="text-muted-foreground mt-1">
                  {user.email}
                </p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut size={18} className="mr-2" />
                Sign Out
              </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
                <TabsTrigger value="profile" className="gap-2">
                  <User size={16} />
                  <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>
                <TabsTrigger value="orders" className="gap-2">
                  <Package size={16} />
                  <span className="hidden sm:inline">Orders</span>
                </TabsTrigger>
                <TabsTrigger value="rewards" className="gap-2">
                  <Gift size={16} />
                  <span className="hidden sm:inline">Rewards</span>
                </TabsTrigger>
                <TabsTrigger value="affiliate" className="gap-2">
                  <Share2 size={16} />
                  <span className="hidden sm:inline">Affiliate</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-2">
                  <Settings size={16} />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                {/* Profile Header Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6"
                >
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                      <User size={40} className="text-primary" />
                    </div>
                    <div className="text-center md:text-left flex-1">
                      <h2 className="text-2xl font-heading font-bold text-foreground">
                        {profileForm.first_name || profileForm.last_name 
                          ? `${profileForm.first_name} ${profileForm.last_name}`.trim()
                          : "Welcome!"}
                      </h2>
                      <p className="text-muted-foreground">{user.email}</p>
                      {profileForm.phone && (
                        <p className="text-muted-foreground text-sm mt-1">{profileForm.phone}</p>
                      )}
                    </div>
                    <Button variant="outline" onClick={handleLogout} className="shrink-0">
                      <LogOut size={18} className="mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </motion.div>

                {/* Profile Edit Form */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <h3 className="text-xl font-semibold text-foreground mb-6">Personal Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="profile_first_name">First Name</Label>
                      <div className="relative mt-1">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="profile_first_name"
                          name="first_name"
                          value={profileForm.first_name}
                          onChange={handleProfileChange}
                          className="pl-10"
                          placeholder="Enter your first name"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="profile_last_name">Last Name</Label>
                      <div className="relative mt-1">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="profile_last_name"
                          name="last_name"
                          value={profileForm.last_name}
                          onChange={handleProfileChange}
                          className="pl-10"
                          placeholder="Enter your last name"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="profile_phone">Phone Number</Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="profile_phone"
                          name="phone"
                          type="tel"
                          value={profileForm.phone}
                          onChange={handleProfileChange}
                          className="pl-10"
                          placeholder="+91 9876543210"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Email Address</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          value={user.email || ""}
                          className="pl-10 bg-muted"
                          disabled
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleSaveProfile} 
                    className="mt-6"
                    disabled={isSavingProfile}
                  >
                    {isSavingProfile ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      <>
                        <Save size={18} className="mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Account Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card border border-border rounded-xl p-4 text-center"
                  >
                    <Package size={24} className="mx-auto text-primary mb-2" />
                    <p className="text-2xl font-bold text-foreground">{orders.length}</p>
                    <p className="text-xs text-muted-foreground">Total Orders</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card border border-border rounded-xl p-4 text-center"
                  >
                    <IndianRupee size={24} className="mx-auto text-green-500 mb-2" />
                    <p className="text-2xl font-bold text-foreground">
                      ₹{orders.reduce((sum, o) => sum + o.total, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-card border border-border rounded-xl p-4 text-center"
                  >
                    <Users size={24} className="mx-auto text-blue-500 mb-2" />
                    <p className="text-2xl font-bold text-foreground">{affiliate?.total_referrals || 0}</p>
                    <p className="text-xs text-muted-foreground">Referrals</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-card border border-border rounded-xl p-4 text-center"
                  >
                    <IndianRupee size={24} className="mx-auto text-primary mb-2" />
                    <p className="text-2xl font-bold text-foreground">
                      ₹{affiliate?.total_earnings?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Affiliate Earnings</p>
                  </motion.div>
                </div>
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders" className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Order History</h2>
                
                {orders.length === 0 ? (
                  <div className="bg-card border border-border rounded-xl p-8 text-center">
                    <Package size={48} className="mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">No orders yet</h3>
                    <p className="text-muted-foreground mb-4">
                      When you place an order, it will appear here.
                    </p>
                    <Button onClick={() => navigate("/shop")}>
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border rounded-xl p-4 md:p-6"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <p className="font-mono text-sm text-primary mb-1">
                              {order.order_number}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.order_status)}`}>
                              {order.order_status}
                            </span>
                            {order.return_status && (
                              <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getReturnStatusColor(order.return_status)}`}>
                                Return: {order.return_status}
                              </span>
                            )}
                            <p className="font-semibold text-foreground">
                              ₹{order.total.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <p className="text-sm text-muted-foreground">
                            {order.items.length} item(s)
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsOrderModalOpen(true);
                              }}
                            >
                              <Eye size={16} className="mr-2" />
                              View Order
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                await downloadInvoicePDF({
                                  orderNumber: order.order_number,
                                  customerName: order.customer_name,
                                  customerEmail: order.customer_email,
                                  items: order.items,
                                  subtotal: order.subtotal,
                                  discount: order.discount || 0,
                                  shipping: order.shipping || 0,
                                  total: order.total,
                                  shippingAddress: order.shipping_address,
                                  paymentMethod: order.payment_method,
                                  orderDate: order.created_at,
                                });
                                toast({
                                  title: "Invoice Downloaded",
                                  description: `Invoice for ${order.order_number} has been downloaded.`,
                                });
                              }}
                            >
                              <Download size={16} className="mr-2" />
                              Invoice PDF
                            </Button>
                            {order.order_status === "pending" && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleCancelOrder(order.id, order.order_number)}
                                disabled={cancellingOrderId === order.id}
                              >
                                {cancellingOrderId === order.id ? (
                                  <span className="flex items-center">
                                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                    Cancelling...
                                  </span>
                                ) : (
                                  <>
                                    <X size={16} className="mr-2" />
                                    Cancel Order
                                  </>
                                )}
                              </Button>
                            )}
                            {canRequestReturn(order) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-orange-500/30 text-orange-500 hover:bg-orange-500/10"
                                onClick={() => {
                                  setReturnOrder(order);
                                  setIsReturnModalOpen(true);
                                }}
                              >
                                <RotateCcw size={16} className="mr-2" />
                                Request Return
                              </Button>
                            )}
                            {order.return_status === "requested" && (
                              <div className="flex items-center gap-2 text-sm text-orange-500">
                                <AlertCircle size={16} />
                                <span>Return pending review</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Rewards Tab */}
              <TabsContent value="rewards" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-2xl p-6"
                >
                  <LoyaltyCoupons />
                </motion.div>
              </TabsContent>

              {/* Affiliate Tab */}
              <TabsContent value="affiliate" className="space-y-6">
                {affiliate ? (
                  <>
                    {/* Referral Link Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Link size={20} className="text-primary" />
                        </div>
                        <div>
                          <h2 className="font-semibold text-foreground">Your Referral Link</h2>
                          <p className="text-sm text-muted-foreground">Share this link to earn commissions</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 bg-background/80 backdrop-blur rounded-lg px-4 py-3 font-mono text-sm text-foreground break-all">
                          {getReferralLink()}
                        </div>
                        <Button onClick={copyToClipboard} className="shrink-0">
                          {copied ? (
                            <>
                              <Check size={18} className="mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={18} className="mr-2" />
                              Copy Link
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-4 text-sm">
                        <div className="bg-background/50 rounded-lg px-3 py-2">
                          <span className="text-muted-foreground">Your Code: </span>
                          <span className="font-mono font-semibold text-primary">{affiliate.code}</span>
                        </div>
                        <div className="bg-background/50 rounded-lg px-3 py-2">
                          <span className="text-muted-foreground">Discount for referrals: </span>
                          <span className="font-semibold text-foreground">{affiliate.coupon_discount_percent}% off</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card border border-border rounded-xl p-6"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Users size={20} className="text-blue-500" />
                          </div>
                          <span className="text-sm text-muted-foreground">Total Referrals</span>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{affiliate.total_referrals}</p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card border border-border rounded-xl p-6"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                            <IndianRupee size={20} className="text-green-500" />
                          </div>
                          <span className="text-sm text-muted-foreground">Total Earnings</span>
                        </div>
                        <p className="text-3xl font-bold text-foreground">₹{affiliate.total_earnings.toLocaleString()}</p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-card border border-border rounded-xl p-6"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-bold">{affiliate.commission_percent}%</span>
                          </div>
                          <span className="text-sm text-muted-foreground">Commission Rate</span>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{affiliate.commission_percent}%</p>
                      </motion.div>
                    </div>

                    {/* Withdraw Earnings Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-2xl p-6"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                            <IndianRupee size={24} className="text-green-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">Available Balance</h3>
                            <p className="text-2xl font-bold text-green-500">₹{affiliate.total_earnings.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button 
                            variant="outline"
                            className="border-green-500/30 text-green-500 hover:bg-green-500/10"
                            onClick={() => setWithdrawDialogOpen(true)}
                            disabled={affiliate.total_earnings < 500}
                          >
                            <IndianRupee size={16} className="mr-2" />
                            Withdraw Earnings
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">
                        Minimum withdrawal: ₹500 • Withdrawals are processed within 3-5 business days
                      </p>
                      
                      {/* Withdrawal Dialog */}
                      <WithdrawalRequestDialog
                        open={withdrawDialogOpen}
                        onOpenChange={setWithdrawDialogOpen}
                        affiliate={{ id: affiliate.id, total_earnings: affiliate.total_earnings, email: affiliate.email }}
                        userId={user?.id || ""}
                        userPhone={profile?.phone}
                        userEmail={user?.email || ""}
                        onSuccess={fetchData}
                      />
                    </motion.div>

                    {/* Withdrawal History */}
                    <WithdrawalHistory userId={user?.id || ""} />

                    {/* How it works */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-card border border-border rounded-xl p-6"
                    >
                      <h3 className="font-semibold text-foreground mb-4">How it works</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                            <span className="text-primary font-bold">1</span>
                          </div>
                          <h4 className="font-medium text-foreground mb-1">Share Your Link</h4>
                          <p className="text-sm text-muted-foreground">
                            Share your unique referral link with friends and followers
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                            <span className="text-primary font-bold">2</span>
                          </div>
                          <h4 className="font-medium text-foreground mb-1">They Get a Discount</h4>
                          <p className="text-sm text-muted-foreground">
                            When they shop using your link, they get {affiliate.coupon_discount_percent}% off
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                            <span className="text-primary font-bold">3</span>
                          </div>
                          <h4 className="font-medium text-foreground mb-1">You Earn Commission</h4>
                          <p className="text-sm text-muted-foreground">
                            You earn {affiliate.commission_percent}% commission on every sale
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-xl p-8"
                  >
                    <div className="text-center mb-6">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Share2 size={32} className="text-primary" />
                      </div>
                      <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
                        Become an Affiliate
                      </h2>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Join our affiliate program and earn 10% commission on every sale you refer!
                      </p>
                    </div>

                    <div className="max-w-sm mx-auto space-y-4">
                      <div>
                        <Label htmlFor="affiliateName">Your Name</Label>
                        <Input
                          id="affiliateName"
                          value={affiliateName}
                          onChange={(e) => setAffiliateName(e.target.value)}
                          placeholder="Enter your name"
                          className="mt-1"
                        />
                      </div>
                      <Button 
                        onClick={handleCreateAffiliate} 
                        className="w-full"
                        disabled={isCreatingAffiliate}
                      >
                        {isCreatingAffiliate ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Creating...
                          </span>
                        ) : (
                          "Join Affiliate Program"
                        )}
                      </Button>
                    </div>

                    <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="p-4 bg-background rounded-lg">
                        <p className="text-2xl font-bold text-primary">10%</p>
                        <p className="text-xs text-muted-foreground">Commission</p>
                      </div>
                      <div className="p-4 bg-background rounded-lg">
                        <p className="text-2xl font-bold text-primary">10%</p>
                        <p className="text-xs text-muted-foreground">Referral Discount</p>
                      </div>
                      <div className="p-4 bg-background rounded-lg">
                        <p className="text-2xl font-bold text-primary">∞</p>
                        <p className="text-xs text-muted-foreground">Unlimited Earnings</p>
                      </div>
                      <div className="p-4 bg-background rounded-lg">
                        <p className="text-2xl font-bold text-primary">24/7</p>
                        <p className="text-xs text-muted-foreground">Real-time Tracking</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                {/* Profile Edit Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-xl p-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User size={20} className="text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Edit Profile</h2>
                      <p className="text-sm text-muted-foreground">Update your personal information</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="first_name">First Name</Label>
                      <div className="relative mt-1">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="first_name"
                          name="first_name"
                          value={profileForm.first_name}
                          onChange={handleProfileChange}
                          className="pl-10"
                          placeholder="Enter your first name"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      <div className="relative mt-1">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="last_name"
                          name="last_name"
                          value={profileForm.last_name}
                          onChange={handleProfileChange}
                          className="pl-10"
                          placeholder="Enter your last name"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={profileForm.phone}
                          onChange={handleProfileChange}
                          className="pl-10"
                          placeholder="+91 9876543210"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleSaveProfile} 
                    className="mt-6"
                    disabled={isSavingProfile}
                  >
                    {isSavingProfile ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      <>
                        <Save size={18} className="mr-2" />
                        Save Profile
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Account Information */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Mail size={20} className="text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Account Information</h2>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div>
                        <Label className="text-muted-foreground text-sm">Email Address</Label>
                        <p className="text-foreground font-medium">{user.email || user.phone || "Not set"}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <Label className="text-muted-foreground text-sm">Account Created</Label>
                        <p className="text-foreground font-medium">
                          {new Date(user.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-card border border-destructive/30 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Danger Zone</h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    Once you sign out, you'll need to sign in again to access your account.
                  </p>
                  <Button variant="destructive" onClick={handleLogout}>
                    <LogOut size={18} className="mr-2" />
                    Sign Out
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>

      <Footer />

      {/* Order Details Modal */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package size={20} className="text-primary" />
              Order Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="font-mono font-semibold text-primary">{selectedOrder.order_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">
                    {new Date(selectedOrder.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(selectedOrder.order_status)}`}>
                  {selectedOrder.order_status}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                  selectedOrder.payment_status === 'paid' 
                    ? 'text-green-500 bg-green-500/10' 
                    : 'text-yellow-500 bg-yellow-500/10'
                }`}>
                  {selectedOrder.payment_status}
                </span>
                {selectedOrder.return_status && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getReturnStatusColor(selectedOrder.return_status)}`}>
                    Return: {selectedOrder.return_status}
                  </span>
                )}
              </div>

              {/* Return Info (if exists) */}
              {selectedOrder.return_status && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-500 mb-2 flex items-center gap-2">
                    <RotateCcw size={18} />
                    Return Request Details
                  </h3>
                  <p className="text-sm text-foreground mb-1">
                    <strong>Reason:</strong> {selectedOrder.return_reason}
                  </p>
                  {selectedOrder.return_details && (
                    <p className="text-sm text-muted-foreground mb-1">
                      <strong>Details:</strong> {selectedOrder.return_details}
                    </p>
                  )}
                  {selectedOrder.return_requested_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Requested on: {new Date(selectedOrder.return_requested_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  )}
                </div>
              )}

              {/* Items */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Items Ordered</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-foreground">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">₹{selectedOrder.subtotal.toLocaleString()}</span>
                </div>
                {selectedOrder.discount && selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-500">Discount</span>
                    <span className="text-green-500">-₹{selectedOrder.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-foreground">
                    {selectedOrder.shipping === 0 ? 'FREE' : `₹${selectedOrder.shipping?.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-border">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">₹{selectedOrder.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Shipping Address</h3>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-medium text-foreground">{selectedOrder.customer_name}</p>
                  <p className="text-muted-foreground">{selectedOrder.shipping_address.address}</p>
                  <p className="text-muted-foreground">
                    {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.zipCode}
                  </p>
                  <p className="text-muted-foreground">{selectedOrder.shipping_address.country}</p>
                  {selectedOrder.customer_phone && (
                    <p className="text-muted-foreground mt-2">Phone: {selectedOrder.customer_phone}</p>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="font-semibold text-foreground mb-3">Payment Method</h3>
                <p className="text-muted-foreground">
                  {selectedOrder.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment (Razorpay)'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={async () => {
                    await downloadInvoicePDF({
                      orderNumber: selectedOrder.order_number,
                      customerName: selectedOrder.customer_name,
                      customerEmail: selectedOrder.customer_email,
                      items: selectedOrder.items,
                      subtotal: selectedOrder.subtotal,
                      discount: selectedOrder.discount || 0,
                      shipping: selectedOrder.shipping || 0,
                      total: selectedOrder.total,
                      shippingAddress: selectedOrder.shipping_address,
                      paymentMethod: selectedOrder.payment_method,
                      orderDate: selectedOrder.created_at,
                    });
                    toast({
                      title: "Invoice Downloaded",
                      description: `Invoice for ${selectedOrder.order_number} has been downloaded.`,
                    });
                  }}
                >
                  <Download size={18} className="mr-2" />
                  Download Invoice PDF
                </Button>
                
                {selectedOrder.order_status === "pending" && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleCancelOrder(selectedOrder.id, selectedOrder.order_number)}
                    disabled={cancellingOrderId === selectedOrder.id}
                  >
                    {cancellingOrderId === selectedOrder.id ? (
                      <span className="flex items-center">
                        <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Cancelling...
                      </span>
                    ) : (
                      <>
                        <X size={18} className="mr-2" />
                        Cancel Order
                      </>
                    )}
                  </Button>
                )}
                
                {canRequestReturn(selectedOrder) && (
                  <Button
                    variant="outline"
                    className="w-full border-orange-500/30 text-orange-500 hover:bg-orange-500/10"
                    onClick={() => {
                      setReturnOrder(selectedOrder);
                      setIsReturnModalOpen(true);
                      setIsOrderModalOpen(false);
                    }}
                  >
                    <RotateCcw size={18} className="mr-2" />
                    Request Return
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Return Request Modal */}
      {returnOrder && (
        <ReturnRequestDialog
          isOpen={isReturnModalOpen}
          onClose={() => {
            setIsReturnModalOpen(false);
            setReturnOrder(null);
          }}
          orderNumber={returnOrder.order_number}
          orderId={returnOrder.id}
          items={returnOrder.items}
          onSubmit={handleReturnRequest}
          isSubmitting={isSubmittingReturn}
        />
      )}
    </div>
  );
};

export default memo(Account);
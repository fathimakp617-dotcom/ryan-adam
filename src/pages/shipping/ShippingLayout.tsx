import { useState, useEffect } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Package, LayoutDashboard, LogOut, ArrowLeft, Mail, Lock, Loader2, Truck, User } from "lucide-react";
import { motion } from "framer-motion";

const SHIPPING_SESSION_KEY = "rayn_shipping_session";

interface ShippingSession {
  token: string;
  email: string;
  expiry: number;
  role: string;
}

const ShippingLayout = () => {
  const [shippingSession, setShippingSession] = useState<ShippingSession | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = () => {
    try {
      const stored = sessionStorage.getItem(SHIPPING_SESSION_KEY);
      if (stored) {
        const session: ShippingSession = JSON.parse(stored);
        if (session.expiry > Date.now() && session.role === "shipping") {
          setShippingSession(session);
        } else {
          sessionStorage.removeItem(SHIPPING_SESSION_KEY);
        }
      }
    } catch (error) {
      sessionStorage.removeItem(SHIPPING_SESSION_KEY);
    }
    setIsChecking(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-admin-password", {
        body: { email: email.trim(), password },
      });

      if (error) throw error;

      if (data.success) {
        // Check if user has shipping role
        if (data.role === "admin") {
          // Admin users should go to admin dashboard
          toast({
            title: "Admin Account",
            description: "Redirecting to admin dashboard...",
          });
          navigate("/admin");
          return;
        }
        
        if (data.role !== "shipping") {
          throw new Error("Access denied. Shipping credentials required.");
        }

        const session: ShippingSession = {
          token: data.session_token,
          email: data.email,
          expiry: data.session_expiry,
          role: data.role,
        };
        sessionStorage.setItem(SHIPPING_SESSION_KEY, JSON.stringify(session));
        setShippingSession(session);
        toast({
          title: "Welcome",
          description: "Shipping dashboard access granted",
        });
      } else {
        throw new Error(data.error || "Login failed");
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SHIPPING_SESSION_KEY);
    setShippingSession(null);
    setEmail("");
    setPassword("");
    navigate("/");
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!shippingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-blue-500" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-foreground">Shipping Access</h1>
              <p className="text-muted-foreground text-sm mt-2">
                Enter your shipping department credentials
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <Label htmlFor="shipping_email">Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="shipping_email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="shipping@example.com"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="shipping_password">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="shipping_password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border text-center">
              <Button
                variant="link"
                className="text-muted-foreground text-sm"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Store
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const menuItems = [
    { title: "Dashboard", url: "/shipping", icon: LayoutDashboard },
    { title: "Orders", url: "/shipping/orders", icon: Package },
    { title: "My Account", url: "/shipping/account", icon: User },
  ];

  const isActive = (path: string) => {
    if (path === "/shipping") {
      return location.pathname === "/shipping";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar className="border-r border-border">
          <SidebarContent className="pt-4">
            <div className="px-4 py-4 mb-4">
              <Link to="/" className="block">
                <h1 className="text-xl font-heading font-bold text-blue-600">RAYN ADAM</h1>
                <p className="text-xs text-muted-foreground">Shipping Dashboard</p>
              </Link>
            </div>

            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link
                          to={item.url}
                          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                            isActive(item.url)
                              ? "bg-blue-500/10 text-blue-600"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="mt-auto px-4 py-4 border-t border-border">
              <div className="text-sm text-muted-foreground mb-3 truncate">
                {shippingSession.email}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="w-full justify-start"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <header className="h-14 border-b border-border flex items-center px-4 bg-card">
            <SidebarTrigger className="mr-4" />
            <nav className="text-sm text-muted-foreground flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Shipping Panel
            </nav>
          </header>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default ShippingLayout;

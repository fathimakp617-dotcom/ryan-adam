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
import { LayoutDashboard, LogOut, ArrowLeft, Mail, Lock, Loader2, Store, User, MapPin, Truck } from "lucide-react";
import { motion } from "framer-motion";

const ROUTE_SESSION_KEY = "rayn_route_session";

interface RouteSession {
  token: string;
  email: string;
  expiry: number;
  name?: string;
}

const RouteStaffLayout = () => {
  const [routeSession, setRouteSession] = useState<RouteSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = () => {
    try {
      const stored = sessionStorage.getItem(ROUTE_SESSION_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        if (session.expiry > Date.now()) {
          setRouteSession(session);
          sessionStorage.setItem("route_email", session.email);
          sessionStorage.setItem("route_token", session.token);
        } else {
          sessionStorage.removeItem(ROUTE_SESSION_KEY);
        }
      }
    } catch (error) {
      console.error("Error checking session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("verify-admin-password", {
        body: { email: email.toLowerCase(), password },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || "Invalid credentials");
      }

      // Only allow route, admin, or shipping staff
      const allowedRoles = ["route", "admin", "shipping"];
      if (!allowedRoles.includes(data.role)) {
        throw new Error("Access denied. Route staff only.");
      }

      const session: RouteSession = {
        token: data.session_token,
        email: email.toLowerCase(),
        expiry: data.session_expiry || Date.now() + 24 * 60 * 60 * 1000,
        name: data.name,
      };

      sessionStorage.setItem(ROUTE_SESSION_KEY, JSON.stringify(session));
      sessionStorage.setItem("route_email", session.email);
      sessionStorage.setItem("route_token", session.token);
      setRouteSession(session);

      toast({ title: "Welcome!", description: "Logged in successfully" });
    } catch (error: any) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ROUTE_SESSION_KEY);
    sessionStorage.removeItem("route_email");
    sessionStorage.removeItem("route_token");
    setRouteSession(null);
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!routeSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-green-950/20 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-card border rounded-xl p-8 shadow-xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                <Truck className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Route Staff</h1>
              <p className="text-muted-foreground mt-2">Sign in to manage deliveries</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Store
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const menuItems = [
    { title: "Dashboard", url: "/routes", icon: LayoutDashboard },
    { title: "Shop Orders", url: "/routes/shop-orders", icon: Store },
    { title: "My Route", url: "/routes/my-route", icon: MapPin },
    { title: "My Account", url: "/routes/account", icon: User },
  ];

  const isActive = (path: string) => {
    if (path === "/routes") return location.pathname === "/routes";
    return location.pathname.startsWith(path);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar className="border-r border-border">
          <SidebarContent className="pt-4">
            <div className="px-4 py-4 mb-4">
              <Link to="/" className="block">
                <h1 className="text-xl font-heading font-bold text-green-600">RAYN ADAM</h1>
                <p className="text-xs text-muted-foreground">Route Dashboard</p>
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
                              ? "bg-green-500/10 text-green-600"
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
          </SidebarContent>

          <div className="mt-auto p-4 border-t">
            <div className="text-sm text-muted-foreground mb-2">{routeSession.email}</div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <header className="h-14 border-b flex items-center px-4 gap-4 bg-card sticky top-0 z-10">
            <SidebarTrigger />
            <h2 className="font-semibold text-foreground">Route Staff Portal</h2>
          </header>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default RouteStaffLayout;
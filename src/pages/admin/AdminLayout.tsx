import { useEffect, useState } from "react";
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
import { Package, LayoutDashboard, LogOut, ArrowLeft, Mail, KeyRound, Loader2, Shield } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { motion } from "framer-motion";

const ADMIN_SESSION_KEY = "rayn_admin_session";

interface AdminSession {
  token: string;
  email: string;
  expiry: number;
}

const AdminLayout = () => {
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = () => {
    try {
      const stored = localStorage.getItem(ADMIN_SESSION_KEY);
      if (stored) {
        const session: AdminSession = JSON.parse(stored);
        if (session.expiry > Date.now()) {
          setAdminSession(session);
        } else {
          localStorage.removeItem(ADMIN_SESSION_KEY);
        }
      }
    } catch (error) {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
    setIsChecking(false);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-admin-otp", {
        body: { email: email.trim() },
      });

      if (error) throw error;

      setOtpSent(true);
      setStep("otp");
      toast({
        title: "OTP Sent",
        description: "Check your email for the verification code",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 8) {
      toast({
        title: "Error",
        description: "Please enter the complete 8-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-admin-otp", {
        body: { email: email.trim(), otp },
      });

      if (error) throw error;

      if (data.success) {
        const session: AdminSession = {
          token: data.session_token,
          email: data.email,
          expiry: data.session_expiry,
        };
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
        setAdminSession(session);
        toast({
          title: "Welcome, Admin",
          description: "You have successfully logged in",
        });
      } else {
        throw new Error(data.error || "Verification failed");
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid OTP",
        variant: "destructive",
      });
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setAdminSession(null);
    setStep("email");
    setEmail("");
    setOtp("");
    setOtpSent(false);
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

  // Show OTP login screen if not authenticated
  if (!adminSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-foreground">Admin Access</h1>
              <p className="text-muted-foreground text-sm mt-2">
                {step === "email" 
                  ? "Enter your admin email to receive a verification code" 
                  : "Enter the 8-digit code sent to your email"}
              </p>
            </div>

            {step === "email" ? (
              <form onSubmit={handleSendOTP} className="space-y-6">
                <div>
                  <Label htmlFor="admin_email">Admin Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="admin_email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      placeholder="admin@example.com"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <KeyRound className="mr-2 h-4 w-4" />
                      Send Verification Code
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col items-center">
                  <Label className="mb-4">Enter Verification Code</Label>
                  <InputOTP
                    maxLength={8}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                    disabled={isLoading}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                      <InputOTPSlot index={6} />
                      <InputOTPSlot index={7} />
                    </InputOTPGroup>
                  </InputOTP>
                  <p className="text-xs text-muted-foreground mt-3">
                    Code sent to {email}
                  </p>
                </div>

                <Button 
                  onClick={handleVerifyOTP}
                  className="w-full"
                  disabled={isLoading || otp.length !== 8}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Login"
                  )}
                </Button>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep("email");
                    setOtp("");
                  }}
                  disabled={isLoading}
                >
                  Use Different Email
                </Button>
              </div>
            )}

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

  // Admin is authenticated - show dashboard
  const menuItems = [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Orders", url: "/admin/orders", icon: Package },
  ];

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar className="border-r border-border">
          <SidebarContent className="pt-4">
            {/* Logo/Brand */}
            <div className="px-4 py-4 mb-4">
              <Link to="/" className="block">
                <h1 className="text-xl font-heading font-bold text-primary">RAYN ADAM</h1>
                <p className="text-xs text-muted-foreground">Admin Dashboard</p>
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
                              ? "bg-primary/10 text-primary"
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

            {/* Bottom Actions */}
            <div className="mt-auto px-4 py-4 border-t border-border">
              <div className="text-sm text-muted-foreground mb-3 truncate">
                {adminSession.email}
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
            <nav className="text-sm text-muted-foreground">
              Admin Panel
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

export default AdminLayout;

import { useEffect, useState, memo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Mail, Calendar, Truck, Store } from "lucide-react";

interface StaffInfo {
  email: string;
  name: string | null;
  role: string;
  login_count: number;
  last_login: string | null;
}

interface Stats {
  pending: number;
  confirmed: number;
  delivered: number;
  totalBottles: number;
}

const RouteAccount = () => {
  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [stats, setStats] = useState<Stats>({ pending: 0, confirmed: 0, delivered: 0, totalBottles: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const getSessionCredentials = () => {
    const email = sessionStorage.getItem("route_email");
    const token = sessionStorage.getItem("route_token");
    return { email, token };
  };

  useEffect(() => {
    fetchAccountData();
  }, []);

  const fetchAccountData = async () => {
    setIsLoading(true);
    try {
      const { email, token } = getSessionCredentials();
      if (!email || !token) throw new Error("No session");

      // Get staff info
      const { data: accountData, error: accountError } = await supabase.functions.invoke("get-shipping-account", {
        body: { email },
      });

      if (accountError) throw accountError;
      
      setStaff(accountData?.staff);
      setDisplayName(accountData?.staff?.name || "");

      // Get shop order stats
      const { data: ordersData } = await supabase.functions.invoke("manage-shop-orders", {
        body: { admin_email: email, admin_token: token, action: "list" },
      });

      const orders = ordersData?.shop_orders || [];
      setStats({
        pending: orders.filter((o: any) => o.status === "pending").length,
        confirmed: orders.filter((o: any) => o.status === "confirmed").length,
        delivered: orders.filter((o: any) => o.status === "delivered").length,
        totalBottles: orders.reduce((sum: number, o: any) => sum + o.total_bottles, 0),
      });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveName = async () => {
    setIsSaving(true);
    try {
      const { email } = getSessionCredentials();
      if (!email) throw new Error("No session");

      const { error } = await supabase.functions.invoke("update-staff-name", {
        body: { email, name: displayName },
      });

      if (error) throw error;
      
      toast({ title: "Saved", description: "Name updated" });
      setStaff(staff ? { ...staff, name: displayName } : null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">My Account</h1>

      {/* Profile Card */}
      <div className="p-6 rounded-lg border bg-card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
            <User className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{staff?.name || "Route Staff"}</h2>
            <p className="text-muted-foreground capitalize">{staff?.role || "staff"}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span>{staff?.email}</span>
          </div>
          {staff?.last_login && (
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>Last login: {new Date(staff.last_login).toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm">
            <Truck className="w-4 h-4 text-muted-foreground" />
            <span>{staff?.login_count || 0} total logins</span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t space-y-4">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <div className="flex gap-2">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
              <Button 
                onClick={handleSaveName} 
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="p-6 rounded-lg border bg-card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Store className="w-5 h-5 text-green-600" />
          Shop Order Stats
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-amber-500/10">
            <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10">
            <p className="text-2xl font-bold text-blue-400">{stats.confirmed}</p>
            <p className="text-sm text-muted-foreground">Confirmed</p>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10">
            <p className="text-2xl font-bold text-green-400">{stats.delivered}</p>
            <p className="text-sm text-muted-foreground">Delivered</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10">
            <p className="text-2xl font-bold text-primary">{stats.totalBottles}</p>
            <p className="text-sm text-muted-foreground">Total Bottles</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(RouteAccount);
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Plus, 
  Search, 
  RefreshCw, 
  Loader2, 
  Copy, 
  IndianRupee,
  Percent,
  TrendingUp,
  Download,
  Trash2,
  Edit,
  Link as LinkIcon
} from "lucide-react";

interface Affiliate {
  id: string;
  name: string;
  email: string;
  code: string;
  commission_percent: number;
  coupon_discount_percent: number;
  total_earnings: number;
  total_referrals: number;
  is_active: boolean;
  created_at: string;
}

interface AffiliateStats {
  totalAffiliates: number;
  activeAffiliates: number;
  totalReferrals: number;
  totalRevenue: number;
  totalCommissions: number;
}

const AdminAffiliates = () => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [stats, setStats] = useState<AffiliateStats>({
    totalAffiliates: 0,
    activeAffiliates: 0,
    totalReferrals: 0,
    totalRevenue: 0,
    totalCommissions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  
  // Form states
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newCommission, setNewCommission] = useState("10");
  const [newDiscount, setNewDiscount] = useState("10");
  const [bulkCount, setBulkCount] = useState("5");
  const [bulkPrefix, setBulkPrefix] = useState("AFF");
  const [bulkCommission, setBulkCommission] = useState("10");
  const [bulkDiscount, setBulkDiscount] = useState("10");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const fetchAffiliates = async () => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem("rayn_admin_session");
      if (!stored) throw new Error("Admin session not found");

      const session = JSON.parse(stored);
      
      const { data, error } = await supabase.functions.invoke("get-admin-affiliates", {
        body: {
          admin_email: session.email,
          admin_token: session.token,
        },
      });

      if (error) throw error;

      if (data) {
        setAffiliates(data.affiliates || []);
        setStats(data.stats || {
          totalAffiliates: 0,
          activeAffiliates: 0,
          totalReferrals: 0,
          totalRevenue: 0,
          totalCommissions: 0,
        });
      }
    } catch (error: any) {
      console.error("Error fetching affiliates:", error);
      toast({
        title: "Error",
        description: "Failed to fetch affiliate data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateAffiliate = async () => {
    if (!newName.trim() || !newEmail.trim()) {
      toast({ title: "Error", description: "Name and email are required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const stored = localStorage.getItem("rayn_admin_session");
      if (!stored) throw new Error("Admin session not found");

      const session = JSON.parse(stored);
      const code = newCode.trim().toUpperCase() || generateCode();
      
      const { data, error } = await supabase.functions.invoke("manage-affiliate", {
        body: {
          admin_email: session.email,
          admin_token: session.token,
          action: "create",
          affiliate: {
            name: newName.trim(),
            email: newEmail.trim(),
            code,
            commission_percent: parseFloat(newCommission) || 10,
            coupon_discount_percent: parseFloat(newDiscount) || 10,
          },
        },
      });

      if (error) throw error;

      toast({ title: "Success", description: `Affiliate "${newName}" created with code: ${code}` });
      setIsCreateModalOpen(false);
      resetForm();
      fetchAffiliates();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create affiliate", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkCreate = async () => {
    const count = parseInt(bulkCount) || 5;
    if (count < 1 || count > 50) {
      toast({ title: "Error", description: "Count must be between 1 and 50", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const stored = localStorage.getItem("rayn_admin_session");
      if (!stored) throw new Error("Admin session not found");

      const session = JSON.parse(stored);
      
      const { data, error } = await supabase.functions.invoke("manage-affiliate", {
        body: {
          admin_email: session.email,
          admin_token: session.token,
          action: "bulk_create",
          bulkData: {
            count,
            prefix: bulkPrefix.toUpperCase() || "AFF",
            commission_percent: parseFloat(bulkCommission) || 10,
            coupon_discount_percent: parseFloat(bulkDiscount) || 10,
          },
        },
      });

      if (error) throw error;

      toast({ title: "Success", description: `Created ${count} affiliate codes` });
      setIsBulkModalOpen(false);
      fetchAffiliates();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create bulk codes", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAffiliate = async () => {
    if (!editingAffiliate) return;

    setIsSubmitting(true);
    try {
      const stored = localStorage.getItem("rayn_admin_session");
      if (!stored) throw new Error("Admin session not found");

      const session = JSON.parse(stored);
      
      const { error } = await supabase.functions.invoke("manage-affiliate", {
        body: {
          admin_email: session.email,
          admin_token: session.token,
          action: "update",
          affiliateId: editingAffiliate.id,
          affiliate: {
            name: newName.trim(),
            email: newEmail.trim(),
            commission_percent: parseFloat(newCommission) || 10,
            coupon_discount_percent: parseFloat(newDiscount) || 10,
          },
        },
      });

      if (error) throw error;

      toast({ title: "Success", description: "Affiliate updated successfully" });
      setEditingAffiliate(null);
      resetForm();
      fetchAffiliates();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update affiliate", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (affiliate: Affiliate) => {
    try {
      const stored = localStorage.getItem("rayn_admin_session");
      if (!stored) throw new Error("Admin session not found");

      const session = JSON.parse(stored);
      
      const { error } = await supabase.functions.invoke("manage-affiliate", {
        body: {
          admin_email: session.email,
          admin_token: session.token,
          action: "toggle_active",
          affiliateId: affiliate.id,
          is_active: !affiliate.is_active,
        },
      });

      if (error) throw error;

      toast({ title: "Success", description: `Affiliate ${!affiliate.is_active ? "activated" : "deactivated"}` });
      fetchAffiliates();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update status", variant: "destructive" });
    }
  };

  const handleDeleteAffiliate = async (affiliateId: string) => {
    if (!confirm("Are you sure you want to delete this affiliate?")) return;

    try {
      const stored = localStorage.getItem("rayn_admin_session");
      if (!stored) throw new Error("Admin session not found");

      const session = JSON.parse(stored);
      
      const { error } = await supabase.functions.invoke("manage-affiliate", {
        body: {
          admin_email: session.email,
          admin_token: session.token,
          action: "delete",
          affiliateId,
        },
      });

      if (error) throw error;

      toast({ title: "Success", description: "Affiliate deleted" });
      fetchAffiliates();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete affiliate", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setNewName("");
    setNewEmail("");
    setNewCode("");
    setNewCommission("10");
    setNewDiscount("10");
  };

  const openEditModal = (affiliate: Affiliate) => {
    setEditingAffiliate(affiliate);
    setNewName(affiliate.name);
    setNewEmail(affiliate.email);
    setNewCommission(affiliate.commission_percent.toString());
    setNewDiscount(affiliate.coupon_discount_percent.toString());
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: text });
  };

  const copyAffiliateLink = (code: string) => {
    const link = `${window.location.origin}?ref=${code}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link Copied!", description: "Affiliate link copied to clipboard" });
  };

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Code", "Commission %", "Discount %", "Referrals", "Earnings", "Active", "Created"];
    const csvContent = [
      headers.join(","),
      ...filteredAffiliates.map((a) =>
        [
          `"${a.name}"`,
          `"${a.email}"`,
          a.code,
          a.commission_percent,
          a.coupon_discount_percent,
          a.total_referrals,
          a.total_earnings,
          a.is_active ? "Yes" : "No",
          `"${new Date(a.created_at).toLocaleDateString()}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `affiliates_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast({ title: "Export Complete", description: `${filteredAffiliates.length} affiliates exported` });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredAffiliates = affiliates.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Affiliates</h1>
          <p className="text-muted-foreground text-sm">Manage affiliate partners and codes</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchAffiliates}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Bulk Create
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Create Affiliate Codes</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Number of Codes</Label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={bulkCount}
                      onChange={(e) => setBulkCount(e.target.value)}
                      placeholder="5"
                    />
                  </div>
                  <div>
                    <Label>Code Prefix</Label>
                    <Input
                      value={bulkPrefix}
                      onChange={(e) => setBulkPrefix(e.target.value)}
                      placeholder="AFF"
                      maxLength={5}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Commission %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={bulkCommission}
                      onChange={(e) => setBulkCommission(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Discount %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={bulkDiscount}
                      onChange={(e) => setBulkDiscount(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Will create codes like: {bulkPrefix}001, {bulkPrefix}002, etc.
                </p>
                <Button onClick={handleBulkCreate} disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create {bulkCount} Codes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateModalOpen} onOpenChange={(open) => { setIsCreateModalOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Affiliate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Affiliate</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Name *</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="John Doe" />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="john@example.com" />
                </div>
                <div>
                  <Label>Custom Code (optional)</Label>
                  <Input value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} placeholder="Auto-generated if empty" maxLength={10} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Commission %</Label>
                    <Input type="number" min="0" max="100" value={newCommission} onChange={(e) => setNewCommission(e.target.value)} />
                  </div>
                  <div>
                    <Label>Discount %</Label>
                    <Input type="number" min="0" max="100" value={newDiscount} onChange={(e) => setNewDiscount(e.target.value)} />
                  </div>
                </div>
                <Button onClick={handleCreateAffiliate} disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Affiliate
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Affiliates</p>
                <p className="text-xl font-bold">{stats.totalAffiliates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-xl font-bold">{stats.activeAffiliates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-xl font-bold">{stats.totalReferrals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <IndianRupee className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Percent className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Commissions</p>
                <p className="text-xl font-bold">{formatCurrency(stats.totalCommissions)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Affiliate</TableHead>
              <TableHead>Code</TableHead>
              <TableHead className="text-center">Commission</TableHead>
              <TableHead className="text-center">Discount</TableHead>
              <TableHead className="text-center">Referrals</TableHead>
              <TableHead className="text-right">Earnings</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAffiliates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No affiliates found" : "No affiliates yet. Create one to get started!"}
                </TableCell>
              </TableRow>
            ) : (
              filteredAffiliates.map((affiliate) => (
                <TableRow key={affiliate.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div>
                      <p className="font-medium">{affiliate.name}</p>
                      <p className="text-sm text-muted-foreground">{affiliate.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{affiliate.code}</code>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(affiliate.code)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyAffiliateLink(affiliate.code)}>
                        <LinkIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-green-500 font-medium">{affiliate.commission_percent}%</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-blue-500 font-medium">{affiliate.coupon_discount_percent}%</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      {affiliate.total_referrals}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {formatCurrency(affiliate.total_earnings)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={affiliate.is_active}
                      onCheckedChange={() => handleToggleActive(affiliate)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModal(affiliate)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteAffiliate(affiliate.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingAffiliate} onOpenChange={(open) => { if (!open) { setEditingAffiliate(null); resetForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Affiliate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Commission %</Label>
                <Input type="number" min="0" max="100" value={newCommission} onChange={(e) => setNewCommission(e.target.value)} />
              </div>
              <div>
                <Label>Discount %</Label>
                <Input type="number" min="0" max="100" value={newDiscount} onChange={(e) => setNewDiscount(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleUpdateAffiliate} disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Affiliate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AdminAffiliates;

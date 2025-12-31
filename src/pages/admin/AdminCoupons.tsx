import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Ticket, Loader2, Gift, Users } from "lucide-react";
import { format } from "date-fns";

interface Coupon {
  id: string;
  code: string;
  discount_percent: number | null;
  discount_amount: number | null;
  min_order_amount: number;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  coupon_type?: string | null;
  is_bogo?: boolean | null;
  user_id?: string | null;
  user_email?: string;
}

interface CouponFormData {
  code: string;
  discount_percent: string;
  discount_amount: string;
  min_order_amount: string;
  max_uses: string;
  expires_at: string;
  is_active: boolean;
}

const initialFormData: CouponFormData = {
  code: "",
  discount_percent: "",
  discount_amount: "",
  min_order_amount: "0",
  max_uses: "",
  expires_at: "",
  is_active: true,
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loyaltyCoupons, setLoyaltyCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [loyaltyLoading, setLoyaltyLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>(initialFormData);
  const [activeTab, setActiveTab] = useState("regular");
  const { toast } = useToast();

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-coupons", {
        body: { action: "list" },
      });

      if (error) throw error;
      setCoupons(data.coupons || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch coupons",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLoyaltyCoupons = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-coupons", {
        body: { action: "list_loyalty" },
      });

      if (error) throw error;
      setLoyaltyCoupons(data.coupons || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch loyalty coupons",
        variant: "destructive",
      });
    } finally {
      setLoyaltyLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchLoyaltyCoupons();
  }, []);

  const handleOpenCreate = () => {
    setSelectedCoupon(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_percent: coupon.discount_percent?.toString() || "",
      discount_amount: coupon.discount_amount?.toString() || "",
      min_order_amount: coupon.min_order_amount?.toString() || "0",
      max_uses: coupon.max_uses?.toString() || "",
      expires_at: coupon.expires_at ? coupon.expires_at.split("T")[0] : "",
      is_active: coupon.is_active,
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code.trim()) {
      toast({
        title: "Validation Error",
        description: "Coupon code is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.discount_percent && !formData.discount_amount) {
      toast({
        title: "Validation Error",
        description: "Please provide either a percentage or fixed amount discount",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const couponData = {
        id: selectedCoupon?.id,
        code: formData.code.trim(),
        discount_percent: formData.discount_percent ? parseFloat(formData.discount_percent) : null,
        discount_amount: formData.discount_amount ? parseFloat(formData.discount_amount) : null,
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : 0,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
        is_active: formData.is_active,
      };

      const { data, error } = await supabase.functions.invoke("manage-coupons", {
        body: {
          action: selectedCoupon ? "update" : "create",
          coupon: couponData,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Success",
        description: `Coupon ${selectedCoupon ? "updated" : "created"} successfully`,
      });

      setDialogOpen(false);
      fetchCoupons();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save coupon",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCoupon) return;

    try {
      const { error } = await supabase.functions.invoke("manage-coupons", {
        body: { action: "delete", coupon: { id: selectedCoupon.id } },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Coupon deleted successfully",
      });

      setDeleteDialogOpen(false);
      if (selectedCoupon.coupon_type === 'loyalty') {
        fetchLoyaltyCoupons();
      } else {
        fetchCoupons();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete coupon",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const { error } = await supabase.functions.invoke("manage-coupons", {
        body: {
          action: "toggle",
          coupon: { id: coupon.id, is_active: !coupon.is_active },
        },
      });

      if (error) throw error;
      if (coupon.coupon_type === 'loyalty') {
        fetchLoyaltyCoupons();
      } else {
        fetchCoupons();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update coupon",
        variant: "destructive",
      });
    }
  };

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.is_bogo) {
      return "Buy 1 Get 1";
    }
    if (coupon.discount_percent) {
      return `${coupon.discount_percent}%`;
    }
    if (coupon.discount_amount) {
      return `₹${coupon.discount_amount}`;
    }
    return "-";
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isFullyUsed = (coupon: Coupon) => {
    if (!coupon.max_uses) return false;
    return (coupon.current_uses || 0) >= coupon.max_uses;
  };

  const getCouponStatus = (coupon: Coupon) => {
    if (isFullyUsed(coupon)) return { label: "Used", variant: "secondary" as const };
    if (isExpired(coupon.expires_at)) return { label: "Expired", variant: "secondary" as const };
    if (!coupon.is_active) return { label: "Inactive", variant: "secondary" as const };
    return { label: "Active", variant: "default" as const };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Coupons</h1>
          <p className="text-muted-foreground">Manage discount codes and loyalty rewards</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="regular" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Regular Coupons
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Loyalty Rewards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="regular" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                All Coupons ({coupons.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {coupons.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No coupons created yet</p>
                  <Button variant="outline" className="mt-4" onClick={handleOpenCreate}>
                    Create your first coupon
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Min Order</TableHead>
                      <TableHead>Uses</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                        <TableCell>{formatDiscount(coupon)}</TableCell>
                        <TableCell>₹{coupon.min_order_amount || 0}</TableCell>
                        <TableCell>
                          {coupon.current_uses || 0}
                          {coupon.max_uses ? ` / ${coupon.max_uses}` : ""}
                        </TableCell>
                        <TableCell>
                          {coupon.expires_at ? (
                            <span className={isExpired(coupon.expires_at) ? "text-destructive" : ""}>
                              {format(new Date(coupon.expires_at), "MMM d, yyyy")}
                            </span>
                          ) : (
                            "Never"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getCouponStatus(coupon).variant}>
                            {getCouponStatus(coupon).label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Switch
                              checked={coupon.is_active}
                              onCheckedChange={() => handleToggleActive(coupon)}
                              disabled={isExpired(coupon.expires_at)}
                            />
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(coupon)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleOpenDelete(coupon)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loyalty" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Loyalty Rewards ({loyaltyCoupons.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loyaltyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : loyaltyCoupons.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No loyalty coupons generated yet</p>
                  <p className="text-sm mt-2">Loyalty coupons are automatically generated after customer orders</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Reward Type</TableHead>
                      <TableHead>Uses</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loyaltyCoupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{coupon.user_email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatDiscount(coupon)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {coupon.current_uses || 0} / {coupon.max_uses || 1}
                        </TableCell>
                        <TableCell>
                          {coupon.expires_at ? (
                            <span className={isExpired(coupon.expires_at) ? "text-destructive" : ""}>
                              {format(new Date(coupon.expires_at), "MMM d, yyyy")}
                            </span>
                          ) : (
                            "Never"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getCouponStatus(coupon).variant}>
                            {getCouponStatus(coupon).label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Switch
                              checked={coupon.is_active}
                              onCheckedChange={() => handleToggleActive(coupon)}
                              disabled={isExpired(coupon.expires_at) || isFullyUsed(coupon)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleOpenDelete(coupon)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedCoupon ? "Edit Coupon" : "Create Coupon"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Coupon Code *</Label>
              <Input
                id="code"
                placeholder="e.g., SAVE20"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discount_percent">Discount %</Label>
                <Input
                  id="discount_percent"
                  type="number"
                  placeholder="e.g., 10"
                  value={formData.discount_percent}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_percent: e.target.value, discount_amount: "" })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_amount">Fixed Amount (₹)</Label>
                <Input
                  id="discount_amount"
                  type="number"
                  placeholder="e.g., 100"
                  value={formData.discount_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_amount: e.target.value, discount_percent: "" })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_order_amount">Min Order (₹)</Label>
                <Input
                  id="min_order_amount"
                  type="number"
                  placeholder="0"
                  value={formData.min_order_amount}
                  onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_uses">Max Uses</Label>
                <Input
                  id="max_uses"
                  type="number"
                  placeholder="Unlimited"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires_at">Expiry Date</Label>
              <Input
                id="expires_at"
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedCoupon ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the coupon "{selectedCoupon?.code}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCoupons;

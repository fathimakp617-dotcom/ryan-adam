import { useState, useEffect, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  RefreshCw, Users, Shield, Truck, Loader2, Mail, Clock, Plus, Key, Trash2, 
  Power, Ban, CheckCircle, Send, Eye, Calendar, User, Bell
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface StaffMember {
  id: string;
  email: string;
  name?: string;
  role: "admin" | "shipping";
  is_active: boolean;
  created_at: string | null;
  created_by?: string;
  lastLogin?: string;
  loginCount?: number;
  source?: "database" | "environment";
  is_protected?: boolean;
}

interface StaffNotification {
  id: string;
  staff_email: string;
  notification_type: string;
  subject: string;
  recipients: string[];
  sent_at: string;
  sent_by: string;
  order_number?: string;
  details?: {
    staff_role?: string;
    sent_count?: number;
    total_recipients?: number;
    old_status?: string;
    new_status?: string;
    customer_name?: string;
    customer_email?: string;
  };
}

interface StaffStats {
  totalStaff: number;
  adminCount: number;
  shippingCount: number;
  activeCount: number;
}

const AdminStaff = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState<StaffStats>({
    totalStaff: 0,
    adminCount: 0,
    shippingCount: 0,
    activeCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add staff dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "shipping">("shipping");
  const [newPassword, setNewPassword] = useState("");
  
  // Change password dialog
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [newStaffPassword, setNewStaffPassword] = useState("");
  
  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);

  // Staff detail dialog
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [detailStaff, setDetailStaff] = useState<StaffMember | null>(null);
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  
  const { toast } = useToast();

  const getAdminEmail = () => {
    const adminSession = sessionStorage.getItem("rayn_admin_session");
    if (!adminSession) return null;
    return JSON.parse(adminSession).email;
  };

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const adminEmail = getAdminEmail();
      if (!adminEmail) return;
      
      const { data, error } = await supabase.functions.invoke("manage-staff", {
        body: { action: "list", admin_email: adminEmail },
      });

      if (error) throw error;
      
      setStaff(data.staff || []);
      setStats(data.stats || { totalStaff: 0, adminCount: 0, shippingCount: 0, activeCount: 0 });
    } catch (error) {
      console.error("Failed to fetch staff:", error);
      toast({
        title: "Error",
        description: "Failed to fetch staff list",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async (staffEmail: string) => {
    setIsLoadingNotifications(true);
    try {
      const adminEmail = getAdminEmail();
      const { data, error } = await supabase.functions.invoke("manage-staff", {
        body: { action: "get_notifications", admin_email: adminEmail, staff_email: staffEmail },
      });

      if (error) throw error;
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast({
        title: "Error",
        description: "Failed to fetch email history",
        variant: "destructive",
      });
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const handleViewStaffDetails = (member: StaffMember) => {
    setDetailStaff(member);
    setShowDetailDialog(true);
    fetchNotifications(member.email);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaff = async () => {
    if (!newEmail.trim() || !newPassword.trim()) {
      toast({
        title: "Error",
        description: "Email and password are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const adminEmail = getAdminEmail();
      const { data, error } = await supabase.functions.invoke("manage-staff", {
        body: {
          action: "add",
          admin_email: adminEmail,
          name: newName.trim() || null,
          email: newEmail.trim(),
          role: newRole,
          password: newPassword,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Staff Added",
        description: `${newEmail} has been added as ${newRole}`,
      });

      setShowAddDialog(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("shipping");
      fetchStaff();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add staff member",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!selectedStaff || !newStaffPassword.trim()) {
      toast({
        title: "Error",
        description: "Password is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const adminEmail = getAdminEmail();
      const { data, error } = await supabase.functions.invoke("manage-staff", {
        body: {
          action: "update_password",
          admin_email: adminEmail,
          staff_id: selectedStaff.id,
          password: newStaffPassword,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Password Updated",
        description: `Password updated for ${selectedStaff.email}`,
      });

      setShowPasswordDialog(false);
      setSelectedStaff(null);
      setNewStaffPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (member: StaffMember) => {
    try {
      const adminEmail = getAdminEmail();
      const { data, error } = await supabase.functions.invoke("manage-staff", {
        body: {
          action: "toggle_active",
          admin_email: adminEmail,
          staff_id: member.id,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: data.is_active ? "Staff Unblocked" : "Staff Blocked",
        description: `${member.email} has been ${data.is_active ? "unblocked" : "blocked"}`,
      });

      fetchStaff();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update staff status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;

    setIsSubmitting(true);
    try {
      const adminEmail = getAdminEmail();
      const { data, error } = await supabase.functions.invoke("manage-staff", {
        body: {
          action: "delete",
          admin_email: adminEmail,
          staff_id: staffToDelete.id,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Staff Deleted",
        description: `${staffToDelete.email} has been removed`,
      });

      setShowDeleteDialog(false);
      setStaffToDelete(null);
      fetchStaff();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete staff member",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
        return { label: "Order Status Update", color: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: "📦" };
      default:
        return { label: type, color: "bg-muted text-muted-foreground", icon: "📧" };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Add, remove, and manage admin and shipping staff
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
          <Button onClick={fetchStaff} disabled={isLoading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Staff</p>
                <p className="text-2xl font-bold">{stats.totalStaff}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <Shield className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{stats.adminCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-secondary/50">
                <Truck className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Shipping Staff</p>
                <p className="text-2xl font-bold">{stats.shippingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <Power className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No staff members found</p>
              <p className="text-sm mt-2">Click "Add Staff" to add your first staff member</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Logins</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow 
                      key={member.id} 
                      className={`${!member.is_active ? "opacity-50" : ""} cursor-pointer hover:bg-muted/50`}
                      onClick={() => handleViewStaffDetails(member)}
                    >
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            {member.name ? (
                              <span className="font-medium">{member.name}</span>
                            ) : (
                              <span className="text-muted-foreground italic">No name</span>
                            )}
                            {member.is_protected && (
                              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                                Main Admin
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={member.role === "admin" ? "default" : "secondary"}
                          className="flex items-center gap-1 w-fit"
                        >
                          {member.role === "admin" ? (
                            <Shield className="h-3 w-3" />
                          ) : (
                            <Truck className="h-3 w-3" />
                          )}
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.source === "environment" ? "outline" : "secondary"} className="text-xs">
                          {member.source === "environment" ? "System" : "Database"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.is_active ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/30 flex items-center gap-1 w-fit">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <Ban className="h-3 w-3" />
                            Blocked
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {member.lastLogin ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(member.lastLogin), "MMM d, yyyy h:mm a")}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">{member.loginCount || 0}</span>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        {member.is_protected ? (
                          <span className="text-xs text-muted-foreground italic">Protected</span>
                        ) : member.source === "environment" ? (
                          <span className="text-xs text-muted-foreground italic">System managed</span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewStaffDetails(member)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedStaff(member);
                                setShowPasswordDialog(true);
                              }}
                              title="Change Password"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleActive(member)}
                              title={member.is_active ? "Block Access" : "Unblock Access"}
                            >
                              {member.is_active ? (
                                <Ban className="h-4 w-4 text-destructive" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setStaffToDelete(member);
                                setShowDeleteDialog(true);
                              }}
                              title="Delete"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Staff Member</DialogTitle>
            <DialogDescription>
              Add a new admin or shipping staff member with their login credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name (Optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="staff@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as "admin" | "shipping")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="shipping">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Shipping
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStaff} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedStaff?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                type="password"
                placeholder="Minimum 6 characters"
                value={newStaffPassword}
                onChange={(e) => setNewStaffPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePassword} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {staffToDelete?.email}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStaff}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Staff Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Staff Details
            </DialogTitle>
            <DialogDescription>
              View staff information and email notification history
            </DialogDescription>
          </DialogHeader>
          
          {detailStaff && (
            <div className="space-y-6">
              {/* Staff Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium text-lg">
                    {detailStaff.name || <span className="text-muted-foreground italic">No name set</span>}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {detailStaff.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Badge
                    variant={detailStaff.role === "admin" ? "default" : "secondary"}
                    className="mt-1"
                  >
                    {detailStaff.role === "admin" ? (
                      <Shield className="h-3 w-3 mr-1" />
                    ) : (
                      <Truck className="h-3 w-3 mr-1" />
                    )}
                    {detailStaff.role}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {detailStaff.is_active ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/30 mt-1">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="mt-1">
                      <Ban className="h-3 w-3 mr-1" />
                      Blocked
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Login Count</p>
                  <p className="font-medium font-mono">{detailStaff.loginCount || 0}</p>
                </div>
                {detailStaff.lastLogin && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Last Login</p>
                    <p className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {format(new Date(detailStaff.lastLogin), "PPpp")}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Email History */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <Bell className="h-4 w-4" />
                  Email Notification History
                </h3>
                
                {isLoadingNotifications ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Send className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No email notifications sent yet</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-3">
                      {notifications.map((notification) => {
                        const typeInfo = getNotificationTypeLabel(notification.notification_type);
                        return (
                          <div
                            key={notification.id}
                            className="p-4 bg-card border rounded-lg space-y-2"
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
                                {format(new Date(notification.sent_at), "MMM d, yyyy h:mm a")}
                              </span>
                            </div>
                            <p className="text-sm font-medium">{notification.subject}</p>
                            
                            {/* Order details for order status updates */}
                            {notification.notification_type === "order_status_update" && notification.order_number && (
                              <div className="text-xs bg-muted/50 p-2 rounded flex flex-wrap gap-x-4 gap-y-1">
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">Order:</span> {notification.order_number}
                                </span>
                                {notification.details?.customer_name && (
                                  <span className="flex items-center gap-1">
                                    <span className="font-medium">Customer:</span> {notification.details.customer_name}
                                  </span>
                                )}
                                {notification.details?.old_status && notification.details?.new_status && (
                                  <span className="flex items-center gap-1">
                                    <span className="font-medium">Status:</span> 
                                    <span className="capitalize">{notification.details.old_status}</span>
                                    <span>→</span>
                                    <span className="capitalize font-semibold">{notification.details.new_status}</span>
                                  </span>
                                )}
                              </div>
                            )}
                            
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Sent by: {notification.sent_by}
                              </span>
                              <span className="flex items-center gap-1">
                                <Send className="h-3 w-3" />
                                Recipients: {notification.recipients.length}
                              </span>
                              {notification.details?.sent_count !== undefined && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  Delivered: {notification.details.sent_count}/{notification.details.total_recipients}
                                </span>
                              )}
                            </div>
                            {notification.recipients.length > 0 && (
                              <details className="text-xs">
                                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                  View recipients
                                </summary>
                                <div className="mt-2 p-2 bg-muted/50 rounded text-muted-foreground">
                                  {notification.recipients.join(", ")}
                                </div>
                              </details>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(AdminStaff);

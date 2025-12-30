import { useState, useEffect } from "react";
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
import { RefreshCw, Users, Shield, Truck, Loader2, Mail, Clock, Plus, Key, Trash2, Power } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface StaffMember {
  id: string;
  email: string;
  role: "admin" | "shipping";
  is_active: boolean;
  created_at: string | null;
  created_by?: string;
  lastLogin?: string;
  loginCount?: number;
  source?: "database" | "environment";
  is_protected?: boolean;
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
        title: data.is_active ? "Staff Activated" : "Staff Deactivated",
        description: `${member.email} has been ${data.is_active ? "activated" : "deactivated"}`,
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
                    <TableHead>Email</TableHead>
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
                    <TableRow key={member.id} className={!member.is_active ? "opacity-50" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{member.email}</span>
                          {member.is_protected && (
                            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                              Main Admin
                            </Badge>
                          )}
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
                        <Badge variant={member.is_active ? "default" : "outline"}>
                          {member.is_active ? "Active" : "Inactive"}
                        </Badge>
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
                      <TableCell className="text-right">
                        {member.is_protected ? (
                          <span className="text-xs text-muted-foreground italic">Protected</span>
                        ) : member.source === "environment" ? (
                          <span className="text-xs text-muted-foreground italic">System managed</span>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
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
                              title={member.is_active ? "Deactivate" : "Activate"}
                            >
                              <Power className={`h-4 w-4 ${member.is_active ? "text-green-500" : "text-muted-foreground"}`} />
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
    </div>
  );
};

export default AdminStaff;

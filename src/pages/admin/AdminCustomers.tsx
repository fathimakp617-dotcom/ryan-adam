import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Search, Loader2, Users, Mail, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
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

interface CustomerEmail {
  email: string;
  name: string;
  orderCount: number;
  lastOrderDate: string;
  totalSpent: number;
}

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<CustomerEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteCustomerEmail, setDeleteCustomerEmail] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem("rayn_admin_session");
      if (!stored) {
        throw new Error("Admin session not found");
      }

      const session = JSON.parse(stored);
      
      const { data, error } = await supabase.functions.invoke("get-admin-customers", {
        body: {
          admin_email: session.email,
          admin_token: session.token,
        },
      });

      if (error) throw error;

      if (data.customers) {
        setCustomers(data.customers);
      }
    } catch (error: any) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch customer data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ["Email", "Name", "Order Count", "Total Spent", "Last Order Date"];
    const csvContent = [
      headers.join(","),
      ...filteredCustomers.map((customer) =>
        [
          `"${customer.email}"`,
          `"${customer.name}"`,
          customer.orderCount,
          customer.totalSpent,
          `"${customer.lastOrderDate}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `customers_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: `${filteredCustomers.length} customer emails exported to CSV`,
    });
  };

  const handleDeleteCustomer = async (email: string) => {
    setIsDeleting(true);
    try {
      const stored = localStorage.getItem("rayn_admin_session");
      if (!stored) {
        throw new Error("Admin session not found");
      }

      const session = JSON.parse(stored);
      
      const { data, error } = await supabase.functions.invoke("delete-customer-orders", {
        body: {
          admin_email: session.email,
          admin_token: session.token,
          customer_email: email,
        },
      });

      if (error) throw error;

      toast({
        title: "Customer Deleted",
        description: data.message || "Customer and orders deleted successfully",
      });

      // Remove from local state
      setCustomers(customers.filter(c => c.email !== email));
      setDeleteCustomerEmail(null);

    } catch (error: any) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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
          <h1 className="text-2xl font-heading font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground text-sm">
            {customers.length} unique customers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchCustomers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportToCSV} disabled={filteredCustomers.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <p className="text-xl font-bold text-foreground">{customers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Mail className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Emails Available</p>
              <p className="text-xl font-bold text-foreground">{customers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Download className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ready to Export</p>
              <p className="text-xl font-bold text-foreground">{filteredCustomers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email or name..."
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
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-center">Orders</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead className="text-right">Last Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No customers found matching your search" : "No customer data available"}
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.email} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{customer.email}</TableCell>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      {customer.orderCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {formatCurrency(customer.totalSpent)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDate(customer.lastOrderDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteCustomerEmail(customer.email)}
                      title="Delete customer and orders"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Export Info */}
      <div className="bg-muted/50 border border-border rounded-xl p-4">
        <h3 className="font-medium text-foreground mb-2">💡 Export Tips</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Use the search to filter customers before exporting</li>
          <li>• CSV file can be imported to email marketing tools (Mailchimp, etc.)</li>
          <li>• Customer emails are extracted from order data</li>
        </ul>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCustomerEmail} onOpenChange={() => setDeleteCustomerEmail(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Customer
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteCustomerEmail}</strong>? 
              This will permanently delete all orders associated with this customer. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCustomerEmail && handleDeleteCustomer(deleteCustomerEmail)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Customer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default AdminCustomers;

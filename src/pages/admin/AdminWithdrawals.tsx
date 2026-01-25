import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IndianRupee,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Smartphone,
  Phone,
  Mail,
  User,
  Eye,
  Send,
} from "lucide-react";
import { format } from "date-fns";

interface WithdrawalRequest {
  id: string;
  affiliate_id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method: string;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  account_holder_name: string | null;
  upi_id: string | null;
  phone: string;
  email: string;
  processed_by: string | null;
  processed_at: string | null;
  transaction_id: string | null;
  admin_notes: string | null;
  created_at: string;
  affiliates: {
    name: string;
    email: string;
    code: string;
    total_earnings: number;
  } | null;
}

export default function AdminWithdrawals() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [processAction, setProcessAction] = useState<"approve" | "reject" | "complete">("approve");
  const [transactionId, setTransactionId] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const getSession = () => {
    const stored = sessionStorage.getItem("rayn_admin_session");
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  };

  const fetchRequests = useCallback(async () => {
    const session = getSession();
    if (!session) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-withdrawals", {
        body: {
          action: "list",
          admin_email: session.email,
          admin_token: session.token,
          status: statusFilter,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setRequests(data.requests || []);
    } catch (error: any) {
      console.error("Error fetching withdrawal requests:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch withdrawal requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleProcess = async () => {
    if (!selectedRequest) return;
    const session = getSession();
    if (!session) return;

    if (processAction === "complete" && !transactionId.trim()) {
      toast({
        title: "Transaction ID Required",
        description: "Please enter the transaction ID for completed payments",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-withdrawals", {
        body: {
          action: processAction,
          admin_email: session.email,
          admin_token: session.token,
          request_id: selectedRequest.id,
          transaction_id: transactionId || undefined,
          admin_notes: adminNotes || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Success",
        description: `Withdrawal request ${processAction === "complete" ? "completed" : processAction + "d"} successfully`,
      });

      setProcessDialogOpen(false);
      setSelectedRequest(null);
      setTransactionId("");
      setAdminNotes("");
      fetchRequests();
    } catch (error: any) {
      console.error("Error processing request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process request",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredRequests = requests.filter((req) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      req.affiliates?.name?.toLowerCase().includes(searchLower) ||
      req.affiliates?.email?.toLowerCase().includes(searchLower) ||
      req.email.toLowerCase().includes(searchLower) ||
      req.phone.includes(searchTerm)
    );
  });

  const stats = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    completed: requests.filter((r) => r.status === "completed").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    totalPending: requests.filter((r) => r.status === "pending").reduce((sum, r) => sum + r.amount, 0),
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Withdrawal Requests</h1>
          <p className="text-muted-foreground">Manage affiliate withdrawal requests</p>
        </div>
        <Button onClick={fetchRequests} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <IndianRupee className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
                <p className="text-xl font-bold">₹{stats.totalPending.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Requests ({filteredRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <IndianRupee className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No withdrawal requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Affiliate</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.affiliates?.name || "N/A"}</p>
                          <p className="text-xs text-muted-foreground">{request.affiliates?.code}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        ₹{request.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {request.payment_method === "bank_transfer" ? (
                            <>
                              <Building2 className="h-4 w-4" />
                              <span className="text-sm">Bank</span>
                            </>
                          ) : (
                            <>
                              <Smartphone className="h-4 w-4" />
                              <span className="text-sm">UPI</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {request.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(request.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {request.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-600/30 hover:bg-green-600/10"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setProcessAction("complete");
                                  setProcessDialogOpen(true);
                                }}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Send
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-600/30 hover:bg-red-600/10"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setProcessAction("reject");
                                  setProcessDialogOpen(true);
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {request.status === "approved" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 border-green-600/30 hover:bg-green-600/10"
                              onClick={() => {
                                setSelectedRequest(request);
                                setProcessAction("complete");
                                setProcessDialogOpen(true);
                              }}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Withdrawal Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Affiliate</Label>
                  <p className="font-medium">{selectedRequest.affiliates?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.affiliates?.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <p className="text-xl font-bold text-green-600">₹{selectedRequest.amount.toLocaleString()}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-muted-foreground">Payment Method</Label>
                {selectedRequest.payment_method === "bank_transfer" ? (
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium">Bank Transfer</span>
                    </div>
                    <p><strong>Account Holder:</strong> {selectedRequest.account_holder_name}</p>
                    <p><strong>Bank:</strong> {selectedRequest.bank_name}</p>
                    <p><strong>Account No:</strong> {selectedRequest.account_number}</p>
                    <p><strong>IFSC:</strong> {selectedRequest.ifsc_code}</p>
                  </div>
                ) : (
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      <span className="font-medium">UPI</span>
                    </div>
                    <p className="mt-2"><strong>UPI ID:</strong> {selectedRequest.upi_id}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {selectedRequest.phone}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {selectedRequest.email}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Requested On</Label>
                  <p>{format(new Date(selectedRequest.created_at), "MMM d, yyyy h:mm a")}</p>
                </div>
              </div>

              {selectedRequest.transaction_id && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Transaction ID</Label>
                  <p className="font-mono">{selectedRequest.transaction_id}</p>
                </div>
              )}

              {selectedRequest.admin_notes && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Admin Notes</Label>
                  <p>{selectedRequest.admin_notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Process Dialog */}
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {processAction === "approve" && "Approve Request"}
              {processAction === "reject" && "Reject Request"}
              {processAction === "complete" && "Complete Payment"}
            </DialogTitle>
            <DialogDescription>
              {processAction === "complete"
                ? "Mark this payment as sent. This will deduct the amount from the affiliate's earnings."
                : processAction === "reject"
                ? "Reject this withdrawal request."
                : "Approve this withdrawal request for processing."}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Amount to {processAction === "reject" ? "reject" : "send"}</p>
                <p className="text-2xl font-bold text-green-600">₹{selectedRequest.amount.toLocaleString()}</p>
              </div>

              {processAction === "complete" && (
                <div className="space-y-2">
                  <Label htmlFor="transactionId">Transaction ID *</Label>
                  <Input
                    id="transactionId"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter payment transaction ID"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="adminNotes">
                  {processAction === "reject" ? "Rejection Reason" : "Notes"} (Optional)
                </Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={processAction === "reject" ? "Enter reason for rejection" : "Add any notes..."}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleProcess}
              disabled={isProcessing}
              className={
                processAction === "reject"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : processAction === "complete" ? (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Mark as Sent
                </>
              ) : processAction === "reject" ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

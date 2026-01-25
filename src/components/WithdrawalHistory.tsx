import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, Clock, CheckCircle, XCircle, Loader2, History } from "lucide-react";
import { motion } from "framer-motion";

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  bank_name: string | null;
  upi_id: string | null;
  transaction_id: string | null;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
}

interface WithdrawalHistoryProps {
  userId: string;
}

const WithdrawalHistory = ({ userId }: WithdrawalHistoryProps) => {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchWithdrawalRequests();
    }
  }, [userId]);

  const fetchWithdrawalRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-withdrawals", {
        body: { action: "get_user_requests", user_id: userId }
      });

      if (error) {
        console.error("Error fetching withdrawal requests:", error);
        return;
      }

      if (data?.requests) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error("Error fetching withdrawal requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
            <Clock size={12} className="mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
            <CheckCircle size={12} className="mr-1" />
            Approved
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
            <CheckCircle size={12} className="mr-1" />
            Completed
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
            <XCircle size={12} className="mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History size={20} className="text-primary" />
            Withdrawal History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/50 rounded-lg gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <IndianRupee size={16} className="text-primary" />
                    <span className="font-semibold text-foreground">
                      ₹{request.amount.toLocaleString()}
                    </span>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-0.5">
                    <p>
                      {request.payment_method === "bank_transfer" ? (
                        <>Bank Transfer - {request.bank_name}</>
                      ) : (
                        <>UPI - {request.upi_id}</>
                      )}
                    </p>
                    <p className="text-xs">
                      Requested: {new Date(request.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                    {request.processed_at && (
                      <p className="text-xs">
                        Processed: {new Date(request.processed_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </p>
                    )}
                  </div>
                  {request.transaction_id && (
                    <p className="text-xs mt-1">
                      <span className="text-muted-foreground">Transaction ID: </span>
                      <span className="font-mono text-foreground">{request.transaction_id}</span>
                    </p>
                  )}
                  {request.admin_notes && request.status === "rejected" && (
                    <p className="text-xs mt-1 text-red-500">
                      Reason: {request.admin_notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default WithdrawalHistory;

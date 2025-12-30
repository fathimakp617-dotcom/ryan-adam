import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Search, Filter, Activity, Loader2, CalendarIcon, Download, X } from "lucide-react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ActivityLog {
  id: string;
  action_type: string;
  actor_email: string;
  actor_role: string;
  order_id: string | null;
  order_number: string | null;
  action_details: Record<string, any> | null;
  created_at: string;
}

const AdminActivityLogs = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const adminSession = sessionStorage.getItem("rayn_admin_session");
      if (!adminSession) return;
      
      const { email, token } = JSON.parse(adminSession);
      
      const { data, error } = await supabase.functions.invoke("get-activity-logs", {
        body: { admin_email: email, admin_token: token, limit: 500 },
      });

      if (error) throw error;
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let result = logs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (log) =>
          log.actor_email.toLowerCase().includes(query) ||
          log.order_number?.toLowerCase().includes(query) ||
          log.action_type.toLowerCase().includes(query)
      );
    }

    if (roleFilter !== "all") {
      result = result.filter((log) => log.actor_role === roleFilter);
    }

    if (actionFilter !== "all") {
      result = result.filter((log) => log.action_type === actionFilter);
    }

    // Date range filter
    if (startDate || endDate) {
      result = result.filter((log) => {
        const logDate = new Date(log.created_at);
        if (startDate && endDate) {
          return isWithinInterval(logDate, {
            start: startOfDay(startDate),
            end: endOfDay(endDate),
          });
        } else if (startDate) {
          return logDate >= startOfDay(startDate);
        } else if (endDate) {
          return logDate <= endOfDay(endDate);
        }
        return true;
      });
    }

    setFilteredLogs(result);
  }, [logs, searchQuery, roleFilter, actionFilter, startDate, endDate]);

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "login":
        return "default";
      case "order_status_update":
        return "secondary";
      case "tracking_update":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === "admin" ? "default" : "secondary";
  };

  const formatActionDetails = (log: ActivityLog) => {
    if (!log.action_details) return "-";
    
    if (log.action_type === "order_status_update") {
      const details = log.action_details;
      return `${details.old_status || "N/A"} → ${details.new_status || "N/A"}`;
    }
    
    if (log.action_type === "tracking_update") {
      const details = log.action_details;
      return details.tracking_number || "-";
    }
    
    if (log.action_type === "login") {
      return "Successful login";
    }
    
    return JSON.stringify(log.action_details);
  };

  const clearDateFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const exportToCSV = () => {
    if (filteredLogs.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no logs to export with the current filters.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Date", "Time", "Actor Email", "Role", "Action", "Order Number", "Details"];
    const csvData = filteredLogs.map((log) => [
      format(new Date(log.created_at), "yyyy-MM-dd"),
      format(new Date(log.created_at), "HH:mm:ss"),
      log.actor_email,
      log.actor_role,
      log.action_type.replace(/_/g, " "),
      log.order_number || "-",
      formatActionDetails(log),
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `activity-logs-${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `Exported ${filteredLogs.length} logs to CSV.`,
    });
  };

  const uniqueActions = [...new Set(logs.map((log) => log.action_type))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Activity Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track all admin and shipping activities
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={fetchLogs} disabled={isLoading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* First row - Search and dropdowns */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, order number, or action..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="shipping">Shipping</SelectItem>
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Activity className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Second row - Date range filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex gap-2 flex-wrap items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[180px] justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>

                <span className="text-muted-foreground">to</span>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[180px] justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "MMM d, yyyy") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>

                {(startDate || endDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearDateFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear dates
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity History ({filteredLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No activity logs found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm">
                          {format(new Date(log.created_at), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), "h:mm:ss a")}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{log.actor_email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(log.actor_role)}>
                          {log.actor_role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action_type)}>
                          {log.action_type.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.order_number ? (
                          <span className="font-mono text-sm">{log.order_number}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {formatActionDetails(log)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminActivityLogs;

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Helper to get admin session
const getAdminSession = () => {
  const stored = sessionStorage.getItem("rayn_admin_session") || localStorage.getItem("rayn_admin_session");
  if (!stored) return null;
  return JSON.parse(stored);
};

// ============ ORDERS ============
export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ShippingAddress {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total: number;
  subtotal: number;
  discount: number | null;
  shipping: number | null;
  order_status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  items: OrderItem[];
  shipping_address: ShippingAddress;
  coupon_code: string | null;
  affiliate_code: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  return_status: string | null;
  return_reason: string | null;
  return_details: string | null;
  return_requested_at: string | null;
  cash_received: boolean;
}

export const useAdminOrders = () => {
  return useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No admin session found");

      const { data, error } = await supabase.functions.invoke("get-admin-orders", {
        body: {
          admin_email: session.email,
          admin_token: session.token,
        },
      });

      if (error) throw error;
      return (data.orders || []) as Order[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ============ CUSTOMERS ============
export interface CustomerData {
  email: string;
  created_at: string;
}

export const useAdminCustomers = () => {
  return useQuery({
    queryKey: ["admin", "customers"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("Admin session not found");

      const { data, error } = await supabase.functions.invoke("get-admin-customers", {
        body: {
          admin_email: session.email,
          admin_token: session.token,
        },
      });

      if (error) throw error;
      return (data.customers || []) as CustomerData[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ============ AFFILIATES ============
export interface Affiliate {
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

export interface AffiliateStats {
  totalAffiliates: number;
  activeAffiliates: number;
  totalReferrals: number;
  totalRevenue: number;
  totalCommissions: number;
}

export const useAdminAffiliates = () => {
  return useQuery({
    queryKey: ["admin", "affiliates"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("Admin session not found");

      const { data, error } = await supabase.functions.invoke("get-admin-affiliates", {
        body: {
          admin_email: session.email,
          admin_token: session.token,
        },
      });

      if (error) throw error;
      return {
        affiliates: (data.affiliates || []) as Affiliate[],
        stats: (data.stats || {
          totalAffiliates: 0,
          activeAffiliates: 0,
          totalReferrals: 0,
          totalRevenue: 0,
          totalCommissions: 0,
        }) as AffiliateStats,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ============ COUPONS ============
export interface Coupon {
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

export const useAdminCoupons = () => {
  return useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-coupons", {
        body: { action: "list" },
      });

      if (error) throw error;
      return (data.coupons || []) as Coupon[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useAdminLoyaltyCoupons = () => {
  return useQuery({
    queryKey: ["admin", "loyalty-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-coupons", {
        body: { action: "list_loyalty" },
      });

      if (error) throw error;
      return (data.coupons || []) as Coupon[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ============ ACTIVITY LOGS ============
export interface ActivityLog {
  id: string;
  actor_email: string;
  actor_role: string;
  action_type: string;
  action_details: Record<string, unknown>;
  order_id?: string;
  order_number?: string;
  created_at: string;
}

export const useAdminActivityLogs = () => {
  return useQuery({
    queryKey: ["admin", "activity-logs"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("Admin session not found");

      const { data, error } = await supabase.functions.invoke("get-activity-logs", {
        body: {
          admin_email: session.email,
          admin_token: session.token,
        },
      });

      if (error) throw error;
      return (data.logs || []) as ActivityLog[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ============ STAFF ============
export interface StaffMember {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  login_count?: number;
  last_login?: string;
}

export const useAdminStaff = () => {
  return useQuery({
    queryKey: ["admin", "staff"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("Admin session not found");

      const { data, error } = await supabase.functions.invoke("get-staff-list", {
        body: {
          admin_email: session.email,
          admin_token: session.token,
        },
      });

      if (error) throw error;
      return (data.staff || []) as StaffMember[];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// ============ DASHBOARD STATS ============
export interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
}

export interface PaymentBreakdown {
  cod: {
    orders: number;
    revenue: number;
    pending: number;
    delivered: number;
  };
  online: {
    orders: number;
    revenue: number;
    pending: number;
    delivered: number;
  };
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  orders: number;
  cod: number;
  online: number;
}

export interface AllTimeStats {
  total: number;
  totalRevenue: number;
  codRevenue: number;
  onlineRevenue: number;
  codOrders: number;
  onlineOrders: number;
}

export interface DashboardData {
  stats: OrderStats;
  allTimeStats: AllTimeStats;
  paymentBreakdown: PaymentBreakdown;
  monthlyRevenue: MonthlyRevenue[];
  recentOrders: Order[];
}

export const useAdminDashboard = (dateFrom?: string, dateTo?: string) => {
  return useQuery({
    queryKey: ["admin", "dashboard", dateFrom, dateTo],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("Admin session not found");

      const { data, error } = await supabase.functions.invoke("get-admin-stats", {
        body: {
          admin_email: session.email,
          admin_token: session.token,
          date_from: dateFrom,
          date_to: dateTo,
        },
      });

      if (error) throw error;
      return data as DashboardData;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for dashboard
  });
};

// ============ INVALIDATION HELPERS ============
export const useInvalidateAdminData = () => {
  const queryClient = useQueryClient();

  return {
    invalidateOrders: () => queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
    invalidateCustomers: () => queryClient.invalidateQueries({ queryKey: ["admin", "customers"] }),
    invalidateAffiliates: () => queryClient.invalidateQueries({ queryKey: ["admin", "affiliates"] }),
    invalidateCoupons: () => queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] }),
    invalidateLoyaltyCoupons: () => queryClient.invalidateQueries({ queryKey: ["admin", "loyalty-coupons"] }),
    invalidateActivityLogs: () => queryClient.invalidateQueries({ queryKey: ["admin", "activity-logs"] }),
    invalidateStaff: () => queryClient.invalidateQueries({ queryKey: ["admin", "staff"] }),
    invalidateDashboard: () => queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] }),
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  };
};

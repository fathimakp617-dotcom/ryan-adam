import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AffiliateData {
  code: string;
  name: string;
  couponDiscountPercent: number;
}

interface CouponData {
  code: string;
  discountPercent: number;
  discountAmount: number | null;
  minOrderAmount: number;
  isLoyalty?: boolean;
  freeShipping?: boolean;
}

interface AffiliateContextType {
  affiliateCode: string | null;
  affiliateData: AffiliateData | null;
  appliedCoupon: CouponData | null;
  couponCode: string;
  setCouponCode: (code: string) => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  calculateDiscount: (subtotal: number) => number;
  isLoading: boolean;
}

const AffiliateContext = createContext<AffiliateContextType | undefined>(undefined);

export const AffiliateProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const [affiliateData, setAffiliateData] = useState<AffiliateData | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check URL for affiliate code on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref");
    
    if (refCode) {
      // Store in localStorage for persistence
      localStorage.setItem("affiliate_code", refCode);
      setAffiliateCode(refCode);
      fetchAffiliateData(refCode);
    } else {
      // Check localStorage for previously stored affiliate code
      const storedCode = localStorage.getItem("affiliate_code");
      if (storedCode) {
        setAffiliateCode(storedCode);
        fetchAffiliateData(storedCode);
      }
    }
  }, []);

  // Auto-apply loyalty coupon when user logs in
  useEffect(() => {
    if (user && !appliedCoupon) {
      fetchAndApplyLoyaltyCoupon(user.id);
    }
  }, [user]);

  const fetchAndApplyLoyaltyCoupon = async (userId: string) => {
    try {
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("code, discount_percent, discount_amount, min_order_amount, is_bogo")
        .eq("user_id", userId)
        .eq("is_active", true)
        .eq("current_uses", 0)
        .like("coupon_type", "loyalty%")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && coupon?.code) {
        setAppliedCoupon({
          code: coupon.code,
          discountPercent: coupon.discount_percent,
          discountAmount: coupon.discount_amount,
          minOrderAmount: coupon.min_order_amount || 0,
          isLoyalty: true,
        });
        setCouponCode(coupon.code);
      }
    } catch (error) {
      console.log("No loyalty coupon to auto-apply");
    }
  };

  const fetchAffiliateData = async (code: string) => {
    setIsLoading(true);
    try {
      // Use secure RPC function instead of direct table access
      const { data, error } = await supabase
        .rpc('validate_affiliate_code', { affiliate_code: code.toUpperCase() });

      if (data && data.length > 0 && !error) {
        const affiliate = data[0];
        setAffiliateData({
          code: affiliate.code,
          name: "", // Name is no longer exposed for security
          couponDiscountPercent: affiliate.discount_percent || 10,
        });
        
        // Auto-apply affiliate coupon (only if no loyalty coupon already applied)
        if (!appliedCoupon?.isLoyalty) {
          setAppliedCoupon({
            code: affiliate.code,
            discountPercent: affiliate.discount_percent || 10,
            discountAmount: null,
            minOrderAmount: 0,
          });
          setCouponCode(affiliate.code);
        }
      }
    } catch (error) {
      console.error("Error fetching affiliate data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!code.trim()) {
      return { success: false, message: "Please enter a coupon code" };
    }

    setIsLoading(true);
    try {
      // First check if it's an affiliate code using secure RPC
      const { data: affiliateData, error: affiliateError } = await supabase
        .rpc('validate_affiliate_code', { affiliate_code: code.toUpperCase() });

      if (affiliateData && affiliateData.length > 0 && !affiliateError) {
        const affiliate = affiliateData[0];
        setAppliedCoupon({
          code: affiliate.code,
          discountPercent: affiliate.discount_percent || 10,
          discountAmount: null,
          minOrderAmount: 0,
        });
        setIsLoading(false);
        return { success: true, message: `Affiliate discount of ${affiliate.discount_percent}% applied!` };
      }

      // Then check regular coupons using secure RPC
      const { data: couponData, error: couponError } = await supabase
        .rpc('validate_coupon_code', { coupon_code: code.toUpperCase() });

      if (couponData && couponData.length > 0 && !couponError) {
        const coupon = couponData[0];
        
        if (!coupon.is_valid) {
          setIsLoading(false);
          return { success: false, message: "This coupon has expired or reached its usage limit" };
        }

        setAppliedCoupon({
          code: coupon.code,
          discountPercent: coupon.discount_percent,
          discountAmount: coupon.discount_amount,
          minOrderAmount: coupon.min_order_amount || 0,
          freeShipping: coupon.free_shipping || false,
        });
        setIsLoading(false);
        const freeShippingText = coupon.free_shipping ? " + Free Shipping!" : "";
        return { success: true, message: `Coupon applied! ${coupon.discount_percent}% off${freeShippingText}` };
      }

      setIsLoading(false);
      return { success: false, message: "Invalid coupon code" };
    } catch (error) {
      setIsLoading(false);
      return { success: false, message: "Error applying coupon" };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const calculateDiscount = (subtotal: number): number => {
    if (!appliedCoupon) return 0;
    
    if (subtotal < appliedCoupon.minOrderAmount) return 0;

    if (appliedCoupon.discountAmount) {
      return appliedCoupon.discountAmount;
    }

    return (subtotal * appliedCoupon.discountPercent) / 100;
  };

  return (
    <AffiliateContext.Provider
      value={{
        affiliateCode,
        affiliateData,
        appliedCoupon,
        couponCode,
        setCouponCode,
        applyCoupon,
        removeCoupon,
        calculateDiscount,
        isLoading,
      }}
    >
      {children}
    </AffiliateContext.Provider>
  );
};

export const useAffiliate = () => {
  const context = useContext(AffiliateContext);
  if (context === undefined) {
    throw new Error("useAffiliate must be used within an AffiliateProvider");
  }
  return context;
};

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_details: Json | null
          action_type: string
          actor_email: string
          actor_role: string
          created_at: string
          id: string
          order_id: string | null
          order_number: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          actor_email: string
          actor_role: string
          created_at?: string
          id?: string
          order_id?: string | null
          order_number?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          actor_email?: string
          actor_role?: string
          created_at?: string
          id?: string
          order_id?: string | null
          order_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_otps: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_hash: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          otp_hash: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_hash?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          code: string
          commission_percent: number | null
          coupon_discount_percent: number | null
          created_at: string
          email: string
          id: string
          is_active: boolean | null
          name: string
          total_earnings: number | null
          total_referrals: number | null
          user_id: string | null
        }
        Insert: {
          code: string
          commission_percent?: number | null
          coupon_discount_percent?: number | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          total_earnings?: number | null
          total_referrals?: number | null
          user_id?: string | null
        }
        Update: {
          code?: string
          commission_percent?: number | null
          coupon_discount_percent?: number | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          total_earnings?: number | null
          total_referrals?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_rate_limits: {
        Row: {
          attempt_type: string
          attempts: number
          blocked_until: string | null
          created_at: string
          first_attempt_at: string
          id: string
          identifier: string
          updated_at: string
        }
        Insert: {
          attempt_type: string
          attempts?: number
          blocked_until?: string | null
          created_at?: string
          first_attempt_at?: string
          id?: string
          identifier: string
          updated_at?: string
        }
        Update: {
          attempt_type?: string
          attempts?: number
          blocked_until?: string | null
          created_at?: string
          first_attempt_at?: string
          id?: string
          identifier?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          coupon_type: string | null
          created_at: string
          current_uses: number | null
          discount_amount: number | null
          discount_percent: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_bogo: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          user_id: string | null
        }
        Insert: {
          code: string
          coupon_type?: string | null
          created_at?: string
          current_uses?: number | null
          discount_amount?: number | null
          discount_percent: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_bogo?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          user_id?: string | null
        }
        Update: {
          code?: string
          coupon_type?: string | null
          created_at?: string
          current_uses?: number | null
          discount_amount?: number | null
          discount_percent?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_bogo?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      loyalty_rewards: {
        Row: {
          created_at: string
          id: string
          last_coupon_order: number | null
          order_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_coupon_order?: number | null
          order_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_coupon_order?: number | null
          order_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          affiliate_code: string | null
          coupon_code: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          discount: number | null
          id: string
          items: Json
          order_number: string
          order_status: string
          payment_method: string
          payment_status: string
          return_details: string | null
          return_reason: string | null
          return_requested_at: string | null
          return_status: string | null
          shipping: number | null
          shipping_address: Json
          subtotal: number
          tax: number | null
          total: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          affiliate_code?: string | null
          coupon_code?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          discount?: number | null
          id?: string
          items: Json
          order_number: string
          order_status?: string
          payment_method: string
          payment_status?: string
          return_details?: string | null
          return_reason?: string | null
          return_requested_at?: string | null
          return_status?: string | null
          shipping?: number | null
          shipping_address: Json
          subtotal: number
          tax?: number | null
          total: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          affiliate_code?: string | null
          coupon_code?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          discount?: number | null
          id?: string
          items?: Json
          order_number?: string
          order_status?: string
          payment_method?: string
          payment_status?: string
          return_details?: string | null
          return_reason?: string | null
          return_requested_at?: string | null
          return_status?: string | null
          shipping?: number | null
          shipping_address?: Json
          subtotal?: number
          tax?: number | null
          total?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          is_active: boolean
          name: string | null
          password_hash: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          is_active?: boolean
          name?: string | null
          password_hash: string
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          is_active?: boolean
          name?: string | null
          password_hash?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_notifications: {
        Row: {
          details: Json | null
          id: string
          notification_type: string
          order_number: string | null
          recipients: string[]
          sent_at: string
          sent_by: string | null
          staff_email: string
          subject: string
        }
        Insert: {
          details?: Json | null
          id?: string
          notification_type: string
          order_number?: string | null
          recipients: string[]
          sent_at?: string
          sent_by?: string | null
          staff_email: string
          subject: string
        }
        Update: {
          details?: Json | null
          id?: string
          notification_type?: string
          order_number?: string | null
          recipients?: string[]
          sent_at?: string
          sent_by?: string | null
          staff_email?: string
          subject?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_order: { Args: { order_email: string }; Returns: boolean }
      check_account_exists: {
        Args: { check_email: string; check_phone: string }
        Returns: {
          email_exists: boolean
          phone_exists: boolean
        }[]
      }
      cleanup_expired_admin_otps: { Args: never; Returns: undefined }
      cleanup_expired_rate_limits: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      validate_affiliate_code: {
        Args: { affiliate_code: string }
        Returns: {
          code: string
          discount_percent: number
        }[]
      }
      validate_coupon_code: {
        Args: { coupon_code: string }
        Returns: {
          code: string
          discount_amount: number
          discount_percent: number
          is_valid: boolean
          min_order_amount: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

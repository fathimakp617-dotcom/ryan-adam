import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface StaffNotificationRequest {
  type: "account_created" | "password_changed" | "account_blocked" | "account_unblocked" | "order_status_update";
  staff_email?: string;
  staff_role?: "admin" | "shipping";
  created_by?: string;
  temporary_password?: string;
  order_number?: string;
  // For order status updates
  customer_name?: string;
  customer_email?: string;
  old_status?: string;
  new_status?: string;
  updated_by?: string;
  items?: OrderItem[];
  total?: number;
  tracking_number?: string;
  tracking_url?: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getStatusBadge = (status: string) => {
  const statusColors: Record<string, { bg: string; text: string; emoji: string }> = {
    pending: { bg: "#fef3cd", text: "#856404", emoji: "⏳" },
    processing: { bg: "#cce5ff", text: "#004085", emoji: "⚙️" },
    shipped: { bg: "#d4edda", text: "#155724", emoji: "📦" },
    delivered: { bg: "#d1ecf1", text: "#0c5460", emoji: "✅" },
    cancelled: { bg: "#f8d7da", text: "#721c24", emoji: "❌" },
  };
  return statusColors[status] || statusColors.pending;
};

const getOrderStatusEmailTemplate = (
  orderNumber: string,
  customerName: string,
  customerEmail: string,
  oldStatus: string,
  newStatus: string,
  updatedBy: string,
  items: OrderItem[],
  total: number,
  trackingNumber?: string,
  trackingUrl?: string
) => {
  const brandColor = "#a87c39";
  const darkBg = "#1c1c1c";
  const creamBg = "#f5f5f0";
  const newStatusBadge = getStatusBadge(newStatus);
  const oldStatusBadge = getStatusBadge(oldStatus);

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">×${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
      </tr>
    `
    )
    .join("");

  return {
    subject: `RAYN ADAM - Order ${orderNumber} Status Updated to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: ${creamBg}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${creamBg}; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, ${darkBg} 0%, #2d2d2d 100%); padding: 40px; text-align: center;">
                    <h1 style="color: ${brandColor}; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 3px;">RAYN ADAM</h1>
                    <p style="color: #888; margin: 8px 0 0; font-size: 12px; letter-spacing: 2px;">ORDER STATUS UPDATE</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="color: ${darkBg}; margin: 0 0 20px; font-size: 22px;">${newStatusBadge.emoji} Order Status Changed</h2>
                    
                    <!-- Status Change Badge -->
                    <div style="background: ${creamBg}; border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
                      <span style="background: ${oldStatusBadge.bg}; color: ${oldStatusBadge.text}; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block;">
                        ${oldStatusBadge.emoji} ${oldStatus.toUpperCase()}
                      </span>
                      <span style="color: ${brandColor}; font-size: 20px; margin: 0 15px;">→</span>
                      <span style="background: ${newStatusBadge.bg}; color: ${newStatusBadge.text}; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; display: inline-block;">
                        ${newStatusBadge.emoji} ${newStatus.toUpperCase()}
                      </span>
                    </div>
                    
                    <!-- Order Details -->
                    <div style="background: ${creamBg}; border-left: 4px solid ${brandColor}; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 0; color: ${darkBg}; font-size: 16px;"><strong>Order:</strong> ${orderNumber}</p>
                      <p style="margin: 10px 0 0; color: ${darkBg}; font-size: 16px;"><strong>Customer:</strong> ${customerName}</p>
                      <p style="margin: 10px 0 0; color: ${darkBg}; font-size: 16px;"><strong>Email:</strong> ${customerEmail}</p>
                      <p style="margin: 10px 0 0; color: #666; font-size: 14px;"><strong>Updated by:</strong> ${updatedBy}</p>
                      <p style="margin: 10px 0 0; color: #666; font-size: 14px;"><strong>Updated at:</strong> ${new Date().toLocaleString()}</p>
                    </div>

                    ${trackingNumber ? `
                    <div style="background: #d4edda; border: 1px solid #28a745; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 0; color: #155724; font-size: 14px;">
                        <strong>📦 Tracking Number:</strong> ${trackingNumber}
                      </p>
                      ${trackingUrl ? `<p style="margin: 10px 0 0; color: #155724; font-size: 14px;"><strong>🔗 Tracking URL:</strong> <a href="${trackingUrl}" style="color: #155724;">${trackingUrl}</a></p>` : ""}
                    </div>
                    ` : ""}

                    <!-- Items Table -->
                    <h3 style="color: ${darkBg}; margin: 25px 0 15px; font-size: 16px;">Order Items</h3>
                    <table width="100%" style="border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #eee;">
                      <thead>
                        <tr style="background: ${darkBg};">
                          <th style="padding: 12px; text-align: left; color: ${brandColor}; font-size: 13px;">Product</th>
                          <th style="padding: 12px; text-align: center; color: ${brandColor}; font-size: 13px;">Qty</th>
                          <th style="padding: 12px; text-align: right; color: ${brandColor}; font-size: 13px;">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                      </tbody>
                      <tfoot>
                        <tr style="background: ${creamBg};">
                          <td colspan="2" style="padding: 15px; text-align: right; font-weight: 700; color: ${darkBg};">Total:</td>
                          <td style="padding: 15px; text-align: right; font-weight: 700; color: ${brandColor}; font-size: 18px;">${formatCurrency(total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background: ${darkBg}; padding: 30px; text-align: center;">
                    <p style="color: #888; font-size: 12px; margin: 0;">
                      This is an automated staff notification from RAYN ADAM
                    </p>
                    <p style="color: ${brandColor}; font-size: 11px; margin: 10px 0 0; letter-spacing: 1px;">
                      © ${new Date().getFullYear()} RAYN ADAM. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
};

const getEmailTemplate = (type: string, staffEmail: string, staffRole: string, createdBy?: string, tempPassword?: string) => {
  const brandColor = "#a87c39";
  const darkBg = "#1c1c1c";
  const creamBg = "#f5f5f0";

  if (type === "account_created") {
    return {
      subject: `RAYN ADAM - New ${staffRole.charAt(0).toUpperCase() + staffRole.slice(1)} Account Created`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: ${creamBg}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${creamBg}; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, ${darkBg} 0%, #2d2d2d 100%); padding: 40px; text-align: center;">
                      <h1 style="color: ${brandColor}; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 3px;">RAYN ADAM</h1>
                      <p style="color: #888; margin: 8px 0 0; font-size: 12px; letter-spacing: 2px;">STAFF ACCOUNT CREATED</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: ${darkBg}; margin: 0 0 20px; font-size: 22px;">Welcome to the Team!</h2>
                      <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                        A new <strong style="color: ${brandColor};">${staffRole.toUpperCase()}</strong> account has been created for:
                      </p>
                      <div style="background: ${creamBg}; border-left: 4px solid ${brandColor}; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: ${darkBg}; font-size: 16px;"><strong>Email:</strong> ${staffEmail}</p>
                        <p style="margin: 10px 0 0; color: ${darkBg}; font-size: 16px;"><strong>Role:</strong> ${staffRole.charAt(0).toUpperCase() + staffRole.slice(1)}</p>
                        ${createdBy ? `<p style="margin: 10px 0 0; color: #666; font-size: 14px;"><strong>Created by:</strong> ${createdBy}</p>` : ""}
                      </div>
                      ${tempPassword ? `
                      <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: #856404; font-size: 14px;"><strong>⚠️ Temporary Password:</strong> ${tempPassword}</p>
                        <p style="margin: 10px 0 0; color: #856404; font-size: 13px;">Please change this password after your first login.</p>
                      </div>
                      ` : ""}
                      <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                        You can now access the ${staffRole === "admin" ? "Admin" : "Shipping"} Dashboard using your credentials.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background: ${darkBg}; padding: 30px; text-align: center;">
                      <p style="color: #888; font-size: 12px; margin: 0;">This is an automated notification from RAYN ADAM</p>
                      <p style="color: ${brandColor}; font-size: 11px; margin: 10px 0 0; letter-spacing: 1px;">© ${new Date().getFullYear()} RAYN ADAM. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };
  }

  if (type === "account_blocked") {
    return {
      subject: `RAYN ADAM - Staff Account Blocked: ${staffEmail}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: ${creamBg}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${creamBg}; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 40px; text-align: center;">
                      <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 3px;">RAYN ADAM</h1>
                      <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 12px; letter-spacing: 2px;">ACCOUNT BLOCKED</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #dc3545; margin: 0 0 20px; font-size: 22px;">⛔ Account Access Revoked</h2>
                      <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                        The following staff account has been blocked from accessing the portal:
                      </p>
                      <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: ${darkBg}; font-size: 16px;"><strong>Email:</strong> ${staffEmail}</p>
                        <p style="margin: 10px 0 0; color: ${darkBg}; font-size: 16px;"><strong>Role:</strong> ${staffRole.charAt(0).toUpperCase() + staffRole.slice(1)}</p>
                        <p style="margin: 10px 0 0; color: #666; font-size: 14px;"><strong>Blocked at:</strong> ${new Date().toLocaleString()}</p>
                        ${createdBy ? `<p style="margin: 10px 0 0; color: #666; font-size: 14px;"><strong>Blocked by:</strong> ${createdBy}</p>` : ""}
                      </div>
                      <p style="color: #555; font-size: 14px;">This staff member will no longer be able to log in until their account is unblocked.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background: ${darkBg}; padding: 30px; text-align: center;">
                      <p style="color: #888; font-size: 12px; margin: 0;">This is an automated security notification from RAYN ADAM</p>
                      <p style="color: ${brandColor}; font-size: 11px; margin: 10px 0 0; letter-spacing: 1px;">© ${new Date().getFullYear()} RAYN ADAM. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };
  }

  if (type === "account_unblocked") {
    return {
      subject: `RAYN ADAM - Staff Account Unblocked: ${staffEmail}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: ${creamBg}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${creamBg}; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="background: linear-gradient(135deg, #28a745 0%, #218838 100%); padding: 40px; text-align: center;">
                      <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 3px;">RAYN ADAM</h1>
                      <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 12px; letter-spacing: 2px;">ACCOUNT UNBLOCKED</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #28a745; margin: 0 0 20px; font-size: 22px;">✓ Account Access Restored</h2>
                      <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                        The following staff account has been unblocked and can now access the portal:
                      </p>
                      <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; color: ${darkBg}; font-size: 16px;"><strong>Email:</strong> ${staffEmail}</p>
                        <p style="margin: 10px 0 0; color: ${darkBg}; font-size: 16px;"><strong>Role:</strong> ${staffRole.charAt(0).toUpperCase() + staffRole.slice(1)}</p>
                        <p style="margin: 10px 0 0; color: #666; font-size: 14px;"><strong>Unblocked at:</strong> ${new Date().toLocaleString()}</p>
                        ${createdBy ? `<p style="margin: 10px 0 0; color: #666; font-size: 14px;"><strong>Unblocked by:</strong> ${createdBy}</p>` : ""}
                      </div>
                      <p style="color: #555; font-size: 14px;">This staff member can now log in using their existing credentials.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background: ${darkBg}; padding: 30px; text-align: center;">
                      <p style="color: #888; font-size: 12px; margin: 0;">This is an automated notification from RAYN ADAM</p>
                      <p style="color: ${brandColor}; font-size: 11px; margin: 10px 0 0; letter-spacing: 1px;">© ${new Date().getFullYear()} RAYN ADAM. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };
  }

  // Password changed template
  return {
    subject: `RAYN ADAM - Password Changed for ${staffEmail}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: ${creamBg}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${creamBg}; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: linear-gradient(135deg, ${darkBg} 0%, #2d2d2d 100%); padding: 40px; text-align: center;">
                    <h1 style="color: ${brandColor}; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 3px;">RAYN ADAM</h1>
                    <p style="color: #888; margin: 8px 0 0; font-size: 12px; letter-spacing: 2px;">PASSWORD UPDATED</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="color: ${darkBg}; margin: 0 0 20px; font-size: 22px;">Password Changed</h2>
                    <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                      The password for the following staff account has been updated:
                    </p>
                    <div style="background: ${creamBg}; border-left: 4px solid ${brandColor}; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 0; color: ${darkBg}; font-size: 16px;"><strong>Email:</strong> ${staffEmail}</p>
                      <p style="margin: 10px 0 0; color: ${darkBg}; font-size: 16px;"><strong>Role:</strong> ${staffRole.charAt(0).toUpperCase() + staffRole.slice(1)}</p>
                      <p style="margin: 10px 0 0; color: #666; font-size: 14px;"><strong>Changed at:</strong> ${new Date().toLocaleString()}</p>
                      ${createdBy ? `<p style="margin: 10px 0 0; color: #666; font-size: 14px;"><strong>Changed by:</strong> ${createdBy}</p>` : ""}
                    </div>
                    <div style="background: #d4edda; border: 1px solid #28a745; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 0; color: #155724; font-size: 14px;">✓ If you made this change, no further action is needed.</p>
                    </div>
                    <div style="background: #f8d7da; border: 1px solid #dc3545; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <p style="margin: 0; color: #721c24; font-size: 14px;">⚠️ If you did not request this change, please contact an administrator immediately.</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background: ${darkBg}; padding: 30px; text-align: center;">
                    <p style="color: #888; font-size: 12px; margin: 0;">This is an automated security notification from RAYN ADAM</p>
                    <p style="color: ${brandColor}; font-size: 11px; margin: 10px 0 0; letter-spacing: 1px;">© ${new Date().getFullYear()} RAYN ADAM. All rights reserved.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: StaffNotificationRequest = await req.json();
    const { 
      type, 
      staff_email, 
      staff_role, 
      created_by, 
      temporary_password, 
      order_number,
      customer_name,
      customer_email,
      old_status,
      new_status,
      updated_by,
      items,
      total,
      tracking_number,
      tracking_url
    } = requestData;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminEmailsEnv = Deno.env.get("ADMIN_EMAILS") || "";
    const shippingEmailsEnv = Deno.env.get("SHIPPING_EMAILS") || "";
    const mainAdmin = "anfaslenova@gmail.com";

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Handle order status update notifications
    if (type === "order_status_update") {
      if (!order_number || !customer_name || !customer_email || !old_status || !new_status || !updated_by || !items || total === undefined) {
        return new Response(
          JSON.stringify({ error: "Missing required fields for order status update" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get all staff emails (both admins and shipping) that are active
      const envAdmins = adminEmailsEnv.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
      const envShipping = shippingEmailsEnv.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

      // Get active staff from database
      const { data: activeStaff } = await supabase
        .from("staff_members")
        .select("email, role")
        .eq("is_active", true);

      const dbStaffEmails = (activeStaff || []).map((s) => s.email.toLowerCase());

      // Combine all staff emails
      const allStaffEmails = [...new Set([mainAdmin, ...envAdmins, ...envShipping, ...dbStaffEmails])];

      console.log(`Sending order status update to ${allStaffEmails.length} staff members`);

      const template = getOrderStatusEmailTemplate(
        order_number,
        customer_name,
        customer_email,
        old_status,
        new_status,
        updated_by,
        items,
        total,
        tracking_number,
        tracking_url
      );

      // Send to each staff member
      const sendPromises = allStaffEmails.map(async (email) => {
        try {
          await resend.emails.send({
            from: "RAYN ADAM <onboarding@resend.dev>",
            to: [email],
            subject: template.subject,
            html: template.html,
          });
          console.log(`Order status email sent to: ${email}`);
          return { email, success: true };
        } catch (error) {
          console.error(`Failed to send to ${email}:`, error);
          return { email, success: false, error };
        }
      });

      const results = await Promise.all(sendPromises);
      const successCount = results.filter((r) => r.success).length;

      // Log the notification
      try {
        await supabase.from("staff_notifications").insert({
          staff_email: updated_by.toLowerCase(),
          notification_type: "order_status_update",
          subject: template.subject,
          recipients: allStaffEmails,
          sent_by: updated_by,
          order_number: order_number,
          details: {
            old_status,
            new_status,
            customer_name,
            customer_email,
            sent_count: successCount,
            total_recipients: allStaffEmails.length,
          },
        });
        console.log("Order status notification logged to database");
      } catch (logError) {
        console.error("Failed to log notification:", logError);
      }

      return new Response(
        JSON.stringify({ success: true, sent: successCount, total: allStaffEmails.length, results }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle staff account notifications (existing logic)
    if (!staff_email || !staff_role) {
      return new Response(
        JSON.stringify({ error: "Missing staff_email or staff_role" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if the staff member is blocked
    const { data: staffMember } = await supabase
      .from("staff_members")
      .select("is_active")
      .eq("email", staff_email.toLowerCase())
      .maybeSingle();

    // Get all admin emails
    const envAdmins = adminEmailsEnv.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    const { data: dbAdmins } = await supabase
      .from("staff_members")
      .select("email")
      .eq("role", "admin")
      .eq("is_active", true);

    const dbAdminEmails = (dbAdmins || []).map((a) => a.email.toLowerCase());
    const allAdminEmails = [...new Set([...envAdmins, ...dbAdminEmails])];

    // Build recipient list
    const recipients = new Set<string>();
    recipients.add(mainAdmin);
    allAdminEmails.forEach((email) => recipients.add(email));
    
    // Add staff member if active or for block/unblock notifications
    if (type === "account_blocked" || type === "account_unblocked" || !staffMember || staffMember.is_active !== false) {
      recipients.add(staff_email.toLowerCase());
    }

    const recipientList = Array.from(recipients);

    console.log(`Sending ${type} notification to: ${recipientList.join(", ")}`);

    const template = getEmailTemplate(type, staff_email, staff_role, created_by, temporary_password);

    const sendPromises = recipientList.map(async (email) => {
      try {
        await resend.emails.send({
          from: "RAYN ADAM <onboarding@resend.dev>",
          to: [email],
          subject: template.subject,
          html: template.html,
        });
        console.log(`Email sent to: ${email}`);
        return { email, success: true };
      } catch (error) {
        console.error(`Failed to send to ${email}:`, error);
        return { email, success: false, error };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter((r) => r.success).length;

    // Log the notification
    try {
      await supabase.from("staff_notifications").insert({
        staff_email: staff_email.toLowerCase(),
        notification_type: type,
        subject: template.subject,
        recipients: recipientList,
        sent_by: created_by || "system",
        order_number: order_number || null,
        details: {
          staff_role,
          sent_count: successCount,
          total_recipients: recipientList.length,
          results: results.map(r => ({ email: r.email, success: r.success })),
        },
      });
      console.log("Notification logged to database");
    } catch (logError) {
      console.error("Failed to log notification:", logError);
    }

    console.log(`Sent ${successCount}/${recipientList.length} emails successfully`);

    return new Response(
      JSON.stringify({ success: true, sent: successCount, total: recipientList.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in send-staff-notification:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

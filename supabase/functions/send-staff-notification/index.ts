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
  staff_role?: "admin" | "shipping" | "route";
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
    pending: { bg: "#a87c39", text: "#ffffff", emoji: "⏳" },
    processing: { bg: "#c7915e", text: "#1c1c1c", emoji: "⚙️" },
    shipped: { bg: "#22c55e", text: "#ffffff", emoji: "📦" },
    delivered: { bg: "#16a34a", text: "#ffffff", emoji: "✅" },
    cancelled: { bg: "#ef4444", text: "#ffffff", emoji: "❌" },
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
  const newStatusBadge = getStatusBadge(newStatus);
  const oldStatusBadge = getStatusBadge(oldStatus);

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 14px; border-bottom: 1px solid #3d3d3d; color: #f5f5f0;">${item.name}</td>
        <td style="padding: 14px; border-bottom: 1px solid #3d3d3d; text-align: center; color: #e0e0e0;">×${item.quantity}</td>
        <td style="padding: 14px; border-bottom: 1px solid #3d3d3d; text-align: right; color: #f5f5f0;">${formatCurrency(item.price * item.quantity)}</td>
      </tr>
    `
    )
    .join("");

  return {
    subject: `📦 RAYN ADAM - Order ${orderNumber} → ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #1c1c1c; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1c1c1c; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #242424; border-radius: 8px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 100%); padding: 40px; text-align: center; border-bottom: 2px solid #a87c39;">
                    <h1 style="color: #c7915e; margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 3px;">RAYN ADAM</h1>
                    <p style="color: #a87c39; margin: 8px 0 0; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">Staff Notification</p>
                  </td>
                </tr>

                <!-- Status Banner -->
                <tr>
                  <td style="background: linear-gradient(135deg, #a87c39 0%, #c7915e 100%); padding: 25px; text-align: center;">
                    <span style="font-size: 36px;">${newStatusBadge.emoji}</span>
                    <h2 style="color: #1c1c1c; margin: 10px 0 0; font-size: 22px; font-weight: 500;">Order Status Updated</h2>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 35px 30px;">
                    <!-- Status Change -->
                    <div style="text-align: center; margin-bottom: 25px;">
                      <span style="background: ${oldStatusBadge.bg}; color: ${oldStatusBadge.text}; padding: 10px 18px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block;">
                        ${oldStatusBadge.emoji} ${oldStatus.toUpperCase()}
                      </span>
                      <span style="color: #c7915e; font-size: 24px; margin: 0 15px;">→</span>
                      <span style="background: ${newStatusBadge.bg}; color: ${newStatusBadge.text}; padding: 10px 18px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block;">
                        ${newStatusBadge.emoji} ${newStatus.toUpperCase()}
                      </span>
                    </div>
                    
                    <!-- Order Details -->
                    <div style="background: #1c1c1c; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #3d3d3d;">
                      <h3 style="color: #c7915e; margin: 0 0 18px 0; font-weight: 500; letter-spacing: 1px; border-bottom: 2px solid #a87c39; padding-bottom: 12px;">
                        Order #${orderNumber}
                      </h3>
                      <p style="margin: 0 0 10px; color: #f5f5f0; font-size: 15px;"><strong style="color: #a87c39;">Customer:</strong> ${customerName}</p>
                      <p style="margin: 0 0 10px; color: #e0e0e0; font-size: 15px;"><strong style="color: #a87c39;">Email:</strong> ${customerEmail}</p>
                      <p style="margin: 0 0 10px; color: #888; font-size: 14px;"><strong style="color: #a87c39;">Updated by:</strong> ${updatedBy}</p>
                      <p style="margin: 0; color: #888; font-size: 14px;"><strong style="color: #a87c39;">Updated at:</strong> ${new Date().toLocaleString()}</p>
                    </div>

                    ${trackingNumber ? `
                    <div style="background: linear-gradient(135deg, rgba(168, 124, 57, 0.1) 0%, rgba(199, 145, 94, 0.1) 100%); padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid rgba(168, 124, 57, 0.3);">
                      <h3 style="color: #a87c39; margin: 0 0 10px 0;">📍 Tracking Information</h3>
                      <p style="margin: 0 0 5px; color: #f5f5f0;"><strong>Tracking Number:</strong> ${trackingNumber}</p>
                      ${trackingUrl ? `<p style="margin: 10px 0 0;"><a href="${trackingUrl}" style="display: inline-block; background: linear-gradient(135deg, #a87c39 0%, #c7915e 100%); color: #1c1c1c; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: 500;">Track Package</a></p>` : ""}
                    </div>
                    ` : ""}

                    <!-- Items Table -->
                    <div style="background: #1c1c1c; border-radius: 8px; overflow: hidden; margin: 25px 0; border: 1px solid #3d3d3d;">
                      <table width="100%" style="border-collapse: collapse;">
                        <thead>
                          <tr style="background: #2d2d2d;">
                            <th style="padding: 14px; text-align: left; color: #a87c39; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Product</th>
                            <th style="padding: 14px; text-align: center; color: #a87c39; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
                            <th style="padding: 14px; text-align: right; color: #a87c39; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${itemsHtml}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colspan="2" style="padding: 18px 14px; text-align: right; font-weight: bold; color: #f5f5f0; border-top: 1px solid #3d3d3d;">Total:</td>
                            <td style="padding: 18px 14px; text-align: right; font-weight: bold; color: #c7915e; font-size: 20px; border-top: 1px solid #3d3d3d;">${formatCurrency(total)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1c1c1c 0%, #0f0f0f 100%); padding: 25px; text-align: center; border-top: 1px solid #3d3d3d;">
                    <p style="color: #666; font-size: 12px; margin: 0;">
                      This is an automated staff notification from RAYN ADAM
                    </p>
                    <p style="color: #a87c39; margin: 10px 0 0; font-size: 13px; letter-spacing: 2px;">
                      RAYN ADAM
                    </p>
                    <p style="color: #555; margin: 8px 0 0; font-size: 11px;">
                      © 2026 Rayn Adam Private Limited. All rights reserved.
                    </p>
                    <p style="color: #444; margin: 5px 0 0; font-size: 10px;">
                      Malappuram – 673634, Kerala, India | +91 99466 47442
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
  if (type === "account_created") {
    return {
      subject: `🎉 RAYN ADAM - New ${staffRole.charAt(0).toUpperCase() + staffRole.slice(1)} Account Created`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #1c1c1c; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1c1c1c; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #242424; border-radius: 8px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 100%); padding: 40px; text-align: center; border-bottom: 2px solid #a87c39;">
                      <h1 style="color: #c7915e; margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 3px;">RAYN ADAM</h1>
                      <p style="color: #a87c39; margin: 8px 0 0; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">Staff Account Created</p>
                    </td>
                  </tr>

                  <!-- Welcome Banner -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #a87c39 0%, #c7915e 100%); padding: 30px; text-align: center;">
                      <div style="width: 70px; height: 70px; background: #1c1c1c; border-radius: 50%; display: inline-block; line-height: 70px; margin-bottom: 15px;">
                        <span style="color: #c7915e; font-size: 36px;">✓</span>
                      </div>
                      <h2 style="color: #1c1c1c; margin: 0; font-size: 24px; font-weight: 500;">Welcome to the Team!</h2>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 35px 30px;">
                      <p style="color: #e0e0e0; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">
                        A new <strong style="color: #c7915e;">${staffRole.toUpperCase()}</strong> account has been created for you:
                      </p>
                      
                      <div style="background: #1c1c1c; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #3d3d3d;">
                        <p style="margin: 0 0 12px; color: #f5f5f0; font-size: 15px;"><strong style="color: #a87c39;">Email:</strong> ${staffEmail}</p>
                        <p style="margin: 0 0 12px; color: #f5f5f0; font-size: 15px;"><strong style="color: #a87c39;">Role:</strong> ${staffRole.charAt(0).toUpperCase() + staffRole.slice(1)}</p>
                        ${createdBy ? `<p style="margin: 0; color: #888; font-size: 14px;"><strong style="color: #a87c39;">Created by:</strong> ${createdBy}</p>` : ""}
                      </div>
                      
                      ${tempPassword ? `
                      <div style="background: linear-gradient(135deg, rgba(168, 124, 57, 0.15) 0%, rgba(199, 145, 94, 0.15) 100%); padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #a87c39;">
                        <p style="margin: 0 0 8px; color: #c7915e; font-size: 14px; font-weight: 600;">⚠️ Temporary Password</p>
                        <p style="margin: 0 0 10px; color: #f5f5f0; font-size: 18px; font-family: monospace; background: #1c1c1c; padding: 12px; border-radius: 4px;">${tempPassword}</p>
                        <p style="margin: 0; color: #a87c39; font-size: 13px;">Please change this password after your first login.</p>
                      </div>
                      ` : ""}
                      
                      <p style="color: #888; font-size: 14px; line-height: 1.6; margin: 25px 0 0;">
                        You can now access the ${staffRole === "admin" ? "Admin" : staffRole === "shipping" ? "Shipping" : "Route"} Dashboard using your credentials.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1c1c1c 0%, #0f0f0f 100%); padding: 25px; text-align: center; border-top: 1px solid #3d3d3d;">
                      <p style="color: #666; font-size: 12px; margin: 0;">This is an automated notification from RAYN ADAM</p>
                      <p style="color: #a87c39; margin: 10px 0 0; font-size: 13px; letter-spacing: 2px;">RAYN ADAM</p>
                      <p style="color: #555; margin: 8px 0 0; font-size: 11px;">© 2026 Rayn Adam Private Limited. All rights reserved.</p>
                      <p style="color: #444; margin: 5px 0 0; font-size: 10px;">Malappuram – 673634, Kerala, India | +91 99466 47442</p>
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
      subject: `⛔ RAYN ADAM - Staff Account Blocked: ${staffEmail}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #1c1c1c; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1c1c1c; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #242424; border-radius: 8px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 100%); padding: 40px; text-align: center; border-bottom: 2px solid #a87c39;">
                      <h1 style="color: #c7915e; margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 3px;">RAYN ADAM</h1>
                      <p style="color: #a87c39; margin: 8px 0 0; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">Security Alert</p>
                    </td>
                  </tr>

                  <!-- Alert Banner -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center;">
                      <span style="font-size: 48px;">⛔</span>
                      <h2 style="color: #ffffff; margin: 15px 0 0; font-size: 24px; font-weight: 500;">Account Access Revoked</h2>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 35px 30px;">
                      <p style="color: #e0e0e0; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">
                        The following staff account has been blocked from accessing the portal:
                      </p>
                      
                      <div style="background: #1c1c1c; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #ef4444;">
                        <p style="margin: 0 0 12px; color: #f5f5f0; font-size: 15px;"><strong style="color: #ef4444;">Email:</strong> ${staffEmail}</p>
                        <p style="margin: 0 0 12px; color: #f5f5f0; font-size: 15px;"><strong style="color: #ef4444;">Role:</strong> ${staffRole.charAt(0).toUpperCase() + staffRole.slice(1)}</p>
                        <p style="margin: 0 0 12px; color: #888; font-size: 14px;"><strong style="color: #ef4444;">Blocked at:</strong> ${new Date().toLocaleString()}</p>
                        ${createdBy ? `<p style="margin: 0; color: #888; font-size: 14px;"><strong style="color: #ef4444;">Blocked by:</strong> ${createdBy}</p>` : ""}
                      </div>
                      
                      <p style="color: #888; font-size: 14px; line-height: 1.6; margin: 25px 0 0;">
                        If you believe this was done in error, please contact your administrator immediately.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1c1c1c 0%, #0f0f0f 100%); padding: 25px; text-align: center; border-top: 1px solid #3d3d3d;">
                      <p style="color: #666; font-size: 12px; margin: 0;">This is an automated security notification from RAYN ADAM</p>
                      <p style="color: #a87c39; margin: 10px 0 0; font-size: 13px; letter-spacing: 2px;">RAYN ADAM</p>
                      <p style="color: #555; margin: 8px 0 0; font-size: 11px;">© 2026 Rayn Adam Private Limited. All rights reserved.</p>
                      <p style="color: #444; margin: 5px 0 0; font-size: 10px;">Malappuram – 673634, Kerala, India | +91 99466 47442</p>
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
      subject: `✅ RAYN ADAM - Staff Account Restored: ${staffEmail}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #1c1c1c; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1c1c1c; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #242424; border-radius: 8px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 100%); padding: 40px; text-align: center; border-bottom: 2px solid #a87c39;">
                      <h1 style="color: #c7915e; margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 3px;">RAYN ADAM</h1>
                      <p style="color: #a87c39; margin: 8px 0 0; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">Account Update</p>
                    </td>
                  </tr>

                  <!-- Success Banner -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center;">
                      <span style="font-size: 48px;">✅</span>
                      <h2 style="color: #ffffff; margin: 15px 0 0; font-size: 24px; font-weight: 500;">Account Access Restored</h2>
                    </td>
                  </tr>
                  
                  <tr>
                    <td style="padding: 35px 30px;">
                      <p style="color: #e0e0e0; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">
                        The following staff account has been unblocked and can now access the portal again:
                      </p>
                      
                      <div style="background: #1c1c1c; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #22c55e;">
                        <p style="margin: 0 0 12px; color: #f5f5f0; font-size: 15px;"><strong style="color: #22c55e;">Email:</strong> ${staffEmail}</p>
                        <p style="margin: 0 0 12px; color: #f5f5f0; font-size: 15px;"><strong style="color: #22c55e;">Role:</strong> ${staffRole.charAt(0).toUpperCase() + staffRole.slice(1)}</p>
                        <p style="margin: 0 0 12px; color: #888; font-size: 14px;"><strong style="color: #22c55e;">Restored at:</strong> ${new Date().toLocaleString()}</p>
                        ${createdBy ? `<p style="margin: 0; color: #888; font-size: 14px;"><strong style="color: #22c55e;">Restored by:</strong> ${createdBy}</p>` : ""}
                      </div>
                      
                      <p style="color: #888; font-size: 14px; line-height: 1.6; margin: 25px 0 0;">
                        You can now log in with your existing credentials.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1c1c1c 0%, #0f0f0f 100%); padding: 25px; text-align: center; border-top: 1px solid #3d3d3d;">
                      <p style="color: #666; font-size: 12px; margin: 0;">This is an automated notification from RAYN ADAM</p>
                      <p style="color: #a87c39; margin: 10px 0 0; font-size: 13px; letter-spacing: 2px;">RAYN ADAM</p>
                      <p style="color: #555; margin: 8px 0 0; font-size: 11px;">© 2026 Rayn Adam Private Limited. All rights reserved.</p>
                      <p style="color: #444; margin: 5px 0 0; font-size: 10px;">Malappuram – 673634, Kerala, India | +91 99466 47442</p>
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

  // password_changed
  return {
    subject: `🔐 RAYN ADAM - Password Changed for ${staffEmail}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #1c1c1c; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1c1c1c; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #242424; border-radius: 8px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 100%); padding: 40px; text-align: center; border-bottom: 2px solid #a87c39;">
                    <h1 style="color: #c7915e; margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 3px;">RAYN ADAM</h1>
                    <p style="color: #a87c39; margin: 8px 0 0; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">Security Notification</p>
                  </td>
                </tr>

                <!-- Alert Banner -->
                <tr>
                  <td style="background: linear-gradient(135deg, #a87c39 0%, #c7915e 100%); padding: 30px; text-align: center;">
                    <span style="font-size: 48px;">🔐</span>
                    <h2 style="color: #1c1c1c; margin: 15px 0 0; font-size: 24px; font-weight: 500;">Password Updated</h2>
                  </td>
                </tr>
                
                <tr>
                  <td style="padding: 35px 30px;">
                    <p style="color: #e0e0e0; font-size: 16px; line-height: 1.7; margin: 0 0 25px;">
                      The password for the following staff account has been changed:
                    </p>
                    
                    <div style="background: #1c1c1c; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #3d3d3d;">
                      <p style="margin: 0 0 12px; color: #f5f5f0; font-size: 15px;"><strong style="color: #a87c39;">Email:</strong> ${staffEmail}</p>
                      <p style="margin: 0 0 12px; color: #f5f5f0; font-size: 15px;"><strong style="color: #a87c39;">Role:</strong> ${staffRole.charAt(0).toUpperCase() + staffRole.slice(1)}</p>
                      <p style="margin: 0 0 12px; color: #888; font-size: 14px;"><strong style="color: #a87c39;">Changed at:</strong> ${new Date().toLocaleString()}</p>
                      ${createdBy ? `<p style="margin: 0; color: #888; font-size: 14px;"><strong style="color: #a87c39;">Changed by:</strong> ${createdBy}</p>` : ""}
                    </div>
                    
                    <p style="color: #ef4444; font-size: 14px; line-height: 1.6; margin: 25px 0 0;">
                      ⚠️ If you did not request this change, please contact your administrator immediately.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1c1c1c 0%, #0f0f0f 100%); padding: 25px; text-align: center; border-top: 1px solid #3d3d3d;">
                    <p style="color: #666; font-size: 12px; margin: 0;">This is an automated security notification from RAYN ADAM</p>
                    <p style="color: #a87c39; margin: 10px 0 0; font-size: 13px; letter-spacing: 2px;">RAYN ADAM</p>
                    <p style="color: #555; margin: 8px 0 0; font-size: 11px;">© 2026 Rayn Adam Private Limited. All rights reserved.</p>
                    <p style="color: #444; margin: 5px 0 0; font-size: 10px;">Malappuram – 673634, Kerala, India | +91 99466 47442</p>
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const request: StaffNotificationRequest = await req.json();
    console.log("Staff notification request:", request.type);

    // Handle order status update notifications (to all staff)
    if (request.type === "order_status_update") {
      const {
        order_number,
        customer_name,
        customer_email,
        old_status,
        new_status,
        updated_by,
        items = [],
        total = 0,
        tracking_number,
        tracking_url,
      } = request;

      if (!order_number || !old_status || !new_status) {
        throw new Error("Missing required fields for order status update");
      }

      // Get all active staff emails
      const adminEmails = (Deno.env.get("ADMIN_EMAILS") || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
      const shippingEmails = (Deno.env.get("SHIPPING_EMAILS") || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
      
      // Get active staff from database
      const { data: dbStaff } = await supabase
        .from("staff_members")
        .select("email")
        .eq("is_active", true);

      const dbEmails = (dbStaff || []).map((s) => s.email.toLowerCase());
      const allStaffEmails = [...new Set([...adminEmails, ...shippingEmails, ...dbEmails])];

      if (allStaffEmails.length === 0) {
        console.log("No staff emails to notify");
        return new Response(
          JSON.stringify({ success: true, message: "No staff to notify" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const emailTemplate = getOrderStatusEmailTemplate(
        order_number,
        customer_name || "Unknown",
        customer_email || "Unknown",
        old_status,
        new_status,
        updated_by || "System",
        items,
        total,
        tracking_number,
        tracking_url
      );

      // Send to all staff
      const emailPromises = allStaffEmails.map(async (email) => {
        try {
          const { error } = await resend.emails.send({
          from: "Rayn Adam <notifications@raynadamperfume.com>",
            to: [email],
            subject: emailTemplate.subject,
            html: emailTemplate.html,
          });
          
          if (error) {
            console.error(`Failed to send to ${email}:`, error);
            return { email, success: false, error };
          }
          console.log(`Staff notification sent to ${email}`);
          return { email, success: true };
        } catch (err) {
          console.error(`Error sending to ${email}:`, err);
          return { email, success: false, error: err };
        }
      });

      const results = await Promise.all(emailPromises);
      const successCount = results.filter((r) => r.success).length;

      // Log to staff_notifications table
      try {
        await supabase.from("staff_notifications").insert({
          notification_type: "order_status_update",
          staff_email: request.updated_by || "system",
          order_number: request.order_number,
          subject: emailTemplate.subject,
          recipients: allStaffEmails,
          details: {
            old_status: request.old_status,
            new_status: request.new_status,
            customer_name: request.customer_name,
            customer_email: request.customer_email,
            items: items,
            total: total,
          },
        });
      } catch (logError) {
        console.error("Failed to log notification:", logError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Order status notification sent to ${successCount}/${allStaffEmails.length} staff members`,
          results 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle other staff notifications (account_created, password_changed, etc.)
    if (!request.staff_email || !request.staff_role) {
      throw new Error("Missing required fields: staff_email and staff_role");
    }

    // Get admin emails
    const adminEmails = (Deno.env.get("ADMIN_EMAILS") || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

    // Determine recipients
    let recipients: string[] = [];

    if (request.type === "account_created") {
      // Send to the new staff member and all admins
      recipients = [...new Set([request.staff_email.toLowerCase(), ...adminEmails])];
    } else if (request.type === "password_changed") {
      // Send to the staff member who changed password and all admins
      recipients = [...new Set([request.staff_email.toLowerCase(), ...adminEmails])];
    } else if (request.type === "account_blocked" || request.type === "account_unblocked") {
      // Send to the affected staff member and all admins
      recipients = [...new Set([request.staff_email.toLowerCase(), ...adminEmails])];
    }

    if (recipients.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No recipients to notify" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailTemplate = getEmailTemplate(
      request.type,
      request.staff_email,
      request.staff_role,
      request.created_by,
      request.temporary_password
    );

    // Send to all recipients - using onboarding@resend.dev since custom domain may not be verified
    const emailPromises = recipients.map(async (email) => {
      try {
        const { error } = await resend.emails.send({
          from: "Rayn Adam <notifications@raynadamperfume.com>",
          to: [email],
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
        
        if (error) {
          console.error(`Failed to send to ${email}:`, error);
          return { email, success: false, error };
        }
        console.log(`Notification sent to ${email}`);
        return { email, success: true };
      } catch (err) {
        console.error(`Error sending to ${email}:`, err);
        return { email, success: false, error: err };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter((r) => r.success).length;

    // Log to staff_notifications table
    try {
      await supabase.from("staff_notifications").insert({
        notification_type: request.type,
        staff_email: request.staff_email.toLowerCase(),
        subject: emailTemplate.subject,
        recipients: recipients,
        sent_by: request.created_by || null,
        details: {
          staff_role: request.staff_role,
        },
      });
    } catch (logError) {
      console.error("Failed to log notification:", logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notification sent to ${successCount}/${recipients.length} recipients`,
        results 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Staff notification error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

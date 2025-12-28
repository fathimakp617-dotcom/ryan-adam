import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface ShippingAddress {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface OrderConfirmationRequest {
  order_number: string;
  customer_name: string;
  customer_email: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shipping_address: ShippingAddress;
  payment_method: string;
}

const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

const generateOrderEmailHTML = (order: OrderConfirmationRequest): string => {
  const itemsHTML = order.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        ${item.name}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        ${formatCurrency(item.price * item.quantity)}
      </td>
    </tr>
  `).join('');

  const paymentMethodLabel = order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment';

  // Generate a simple text-based invoice for PDF-like attachment simulation
  const invoiceText = `
RAYN ADAM - LUXURY PERFUMES
================================
INVOICE

Order Number: ${order.order_number}
Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}

Customer: ${order.customer_name}
Email: ${order.customer_email}

Shipping Address:
${order.shipping_address.address}
${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zipCode}
${order.shipping_address.country}

--------------------------------
ORDER ITEMS
--------------------------------
${order.items.map(item => `${item.name} x${item.quantity} - ${formatCurrency(item.price * item.quantity)}`).join('\n')}

--------------------------------
Subtotal: ${formatCurrency(order.subtotal)}
${order.discount > 0 ? `Discount: -${formatCurrency(order.discount)}` : ''}
Shipping: ${order.shipping === 0 ? 'FREE' : formatCurrency(order.shipping)}
--------------------------------
TOTAL: ${formatCurrency(order.total)}

Payment Method: ${paymentMethodLabel}

================================
Thank you for shopping with Rayn Adam!
For questions: support@raynadamperfume.com
  `.trim();

  // Base64 encode the invoice text for attachment
  const invoiceBase64 = btoa(unescape(encodeURIComponent(invoiceText)));

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px; text-align: center;">
                  <h1 style="margin: 0; color: #c9a962; font-family: Georgia, serif; font-size: 28px; letter-spacing: 2px;">
                    RAYN ADAM
                  </h1>
                  <p style="margin: 10px 0 0; color: #888; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; letter-spacing: 3px;">
                    LUXURY PERFUMES
                  </p>
                </td>
              </tr>
              
              <!-- Order Confirmation -->
              <tr>
                <td style="padding: 40px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <div style="width: 60px; height: 60px; background-color: #22c55e; border-radius: 50%; display: inline-block; line-height: 60px;">
                      <span style="color: white; font-size: 30px;">✓</span>
                    </div>
                  </div>
                  
                  <h2 style="margin: 0 0 10px; text-align: center; color: #1a1a1a; font-family: Georgia, serif; font-size: 24px;">
                    Thank You for Your Order!
                  </h2>
                  <p style="margin: 0 0 30px; text-align: center; color: #666; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px;">
                    Hi ${order.customer_name}, your order has been confirmed.
                  </p>
                  
                  <!-- Invoice Download Button -->
                  <div style="text-align: center; margin-bottom: 30px;">
                    <p style="margin: 0 0 10px; color: #666; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px;">
                      📄 Your invoice is attached to this email
                    </p>
                  </div>
                  
                  <!-- Order Number -->
                  <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
                    <p style="margin: 0 0 5px; color: #888; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                      Order Number
                    </p>
                    <p style="margin: 0; color: #c9a962; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: bold; letter-spacing: 1px;">
                      ${order.order_number}
                    </p>
                  </div>
                  
                  <!-- Order Items -->
                  <h3 style="margin: 0 0 15px; color: #1a1a1a; font-family: Georgia, serif; font-size: 18px;">
                    Order Summary
                  </h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                    <thead>
                      <tr style="background-color: #f8f8f8;">
                        <th style="padding: 12px; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">
                          Item
                        </th>
                        <th style="padding: 12px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">
                          Qty
                        </th>
                        <th style="padding: 12px; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHTML}
                    </tbody>
                  </table>
                  
                  <!-- Order Totals -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #666;">
                        Subtotal
                      </td>
                      <td style="padding: 8px 0; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a;">
                        ${formatCurrency(order.subtotal)}
                      </td>
                    </tr>
                    ${order.discount > 0 ? `
                    <tr>
                      <td style="padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #22c55e;">
                        Discount
                      </td>
                      <td style="padding: 8px 0; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #22c55e;">
                        -${formatCurrency(order.discount)}
                      </td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td style="padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #666;">
                        Shipping
                      </td>
                      <td style="padding: 8px 0; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a;">
                        ${order.shipping === 0 ? 'FREE' : formatCurrency(order.shipping)}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-top: 2px solid #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: bold; color: #1a1a1a; font-size: 18px;">
                        Total
                      </td>
                      <td style="padding: 12px 0; border-top: 2px solid #1a1a1a; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: bold; color: #c9a962; font-size: 18px;">
                        ${formatCurrency(order.total)}
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Shipping Address -->
                  <div style="display: flex; gap: 20px;">
                    <div style="flex: 1; background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                      <h4 style="margin: 0 0 10px; color: #888; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                        Shipping Address
                      </h4>
                      <p style="margin: 0; color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6;">
                        ${order.customer_name}<br>
                        ${order.shipping_address.address}<br>
                        ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zipCode}<br>
                        ${order.shipping_address.country}
                      </p>
                    </div>
                  </div>
                  
                  <!-- Payment Method -->
                  <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                    <h4 style="margin: 0 0 10px; color: #888; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                      Payment Method
                    </h4>
                    <p style="margin: 0; color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px;">
                      ${paymentMethodLabel}
                    </p>
                  </div>
                  
                  <!-- Footer Message -->
                  <p style="margin: 0; text-align: center; color: #888; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6;">
                    If you have any questions about your order, please contact us at<br>
                    <a href="mailto:support@raynadamperfume.com" style="color: #c9a962;">support@raynadamperfume.com</a>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #1a1a1a; padding: 30px; text-align: center;">
                  <p style="margin: 0 0 10px; color: #c9a962; font-family: Georgia, serif; font-size: 16px; letter-spacing: 2px;">
                    RAYN ADAM
                  </p>
                  <p style="margin: 0; color: #666; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px;">
                    © 2024 Rayn Adam. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

const generateInvoiceAttachment = (order: OrderConfirmationRequest): string => {
  const formattedDate = new Date().toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  
  const paymentMethodLabel = order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment';
  
  const itemsText = order.items.map(item => 
    `${item.name.padEnd(30)} x${item.quantity.toString().padStart(2)}    ${formatCurrency(item.price * item.quantity).padStart(12)}`
  ).join('\n');

  const invoiceText = `
================================================================================
                              RAYN ADAM
                           LUXURY PERFUMES
================================================================================

                                INVOICE

--------------------------------------------------------------------------------
Order Number: ${order.order_number}
Date: ${formattedDate}
--------------------------------------------------------------------------------

BILL TO:
${order.customer_name}
${order.customer_email}

SHIP TO:
${order.shipping_address.address}
${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zipCode}
${order.shipping_address.country}

================================================================================
                             ORDER DETAILS
================================================================================

${itemsText}

--------------------------------------------------------------------------------
                                          Subtotal:    ${formatCurrency(order.subtotal).padStart(12)}
${order.discount > 0 ? `                                          Discount:   -${formatCurrency(order.discount).padStart(11)}` : ''}
                                          Shipping:    ${order.shipping === 0 ? 'FREE'.padStart(12) : formatCurrency(order.shipping).padStart(12)}
--------------------------------------------------------------------------------
                                          TOTAL:       ${formatCurrency(order.total).padStart(12)}
================================================================================

Payment Method: ${paymentMethodLabel}

================================================================================
                     Thank you for shopping with Rayn Adam!
              For questions, contact: support@raynadamperfume.com
================================================================================
  `.trim();

  return invoiceText;
};

const generateAdminOrderEmailHTML = (order: OrderConfirmationRequest): string => {
  const itemsHTML = order.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #ddd; font-family: Arial, sans-serif;">
        ${item.name}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: center; font-family: Arial, sans-serif;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: right; font-family: Arial, sans-serif;">
        ${formatCurrency(item.price * item.quantity)}
      </td>
    </tr>
  `).join('');

  const paymentMethodLabel = order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f0f0f0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f0f0; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 2px solid #c9a962;">
              <!-- Header -->
              <tr>
                <td style="background-color: #1a1a1a; padding: 20px; text-align: center;">
                  <h1 style="margin: 0; color: #c9a962; font-family: Arial, sans-serif; font-size: 20px;">
                    🚚 NEW ORDER - PACK & SHIP
                  </h1>
                </td>
              </tr>
              
              <!-- Order Details -->
              <tr>
                <td style="padding: 30px;">
                  <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <h2 style="margin: 0; color: #856404; font-family: Arial, sans-serif; font-size: 18px;">
                      ⚠️ Order Ready for Fulfillment
                    </h2>
                  </div>
                  
                  <!-- Order Number & Date -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                    <tr>
                      <td style="padding: 10px; background-color: #f8f9fa; border-radius: 4px;">
                        <strong style="font-family: Arial, sans-serif;">Order Number:</strong>
                        <span style="color: #c9a962; font-weight: bold; font-family: Arial, sans-serif; font-size: 18px;"> ${order.order_number}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px;">
                        <strong style="font-family: Arial, sans-serif;">Order Date:</strong>
                        <span style="font-family: Arial, sans-serif;"> ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px; background-color: ${order.payment_method === 'cod' ? '#fff3cd' : '#d4edda'}; border-radius: 4px;">
                        <strong style="font-family: Arial, sans-serif;">Payment:</strong>
                        <span style="font-family: Arial, sans-serif; font-weight: bold; color: ${order.payment_method === 'cod' ? '#856404' : '#155724'};"> ${paymentMethodLabel}</span>
                        ${order.payment_method === 'cod' ? '<span style="font-family: Arial, sans-serif; color: #856404;"> - Collect ₹' + order.total.toLocaleString('en-IN') + '</span>' : ''}
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Customer Info -->
                  <h3 style="margin: 0 0 10px; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; border-bottom: 2px solid #c9a962; padding-bottom: 5px;">
                    📋 Customer Information
                  </h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; background-color: #f8f9fa; border-radius: 4px;">
                    <tr>
                      <td style="padding: 10px; font-family: Arial, sans-serif;">
                        <strong>Name:</strong> ${order.customer_name}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px; font-family: Arial, sans-serif;">
                        <strong>Email:</strong> ${order.customer_email}
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Shipping Address -->
                  <h3 style="margin: 0 0 10px; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; border-bottom: 2px solid #c9a962; padding-bottom: 5px;">
                    📍 Shipping Address
                  </h3>
                  <div style="background-color: #e7f3ff; border: 1px solid #0066cc; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <p style="margin: 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
                      <strong>${order.customer_name}</strong><br>
                      ${order.shipping_address.address}<br>
                      ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zipCode}<br>
                      <strong>${order.shipping_address.country}</strong>
                    </p>
                  </div>
                  
                  <!-- Order Items -->
                  <h3 style="margin: 0 0 10px; color: #1a1a1a; font-family: Arial, sans-serif; font-size: 16px; border-bottom: 2px solid #c9a962; padding-bottom: 5px;">
                    📦 Items to Pack
                  </h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; border: 1px solid #ddd; border-radius: 4px;">
                    <thead>
                      <tr style="background-color: #1a1a1a;">
                        <th style="padding: 12px; text-align: left; font-family: Arial, sans-serif; font-size: 12px; color: #c9a962; text-transform: uppercase;">
                          Product
                        </th>
                        <th style="padding: 12px; text-align: center; font-family: Arial, sans-serif; font-size: 12px; color: #c9a962; text-transform: uppercase;">
                          Qty
                        </th>
                        <th style="padding: 12px; text-align: right; font-family: Arial, sans-serif; font-size: 12px; color: #c9a962; text-transform: uppercase;">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHTML}
                    </tbody>
                  </table>
                  
                  <!-- Order Totals -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; background-color: #f8f9fa; border-radius: 4px;">
                    <tr>
                      <td style="padding: 8px 15px; font-family: Arial, sans-serif;">Subtotal</td>
                      <td style="padding: 8px 15px; text-align: right; font-family: Arial, sans-serif;">${formatCurrency(order.subtotal)}</td>
                    </tr>
                    ${order.discount > 0 ? `
                    <tr>
                      <td style="padding: 8px 15px; font-family: Arial, sans-serif; color: #28a745;">Discount</td>
                      <td style="padding: 8px 15px; text-align: right; font-family: Arial, sans-serif; color: #28a745;">-${formatCurrency(order.discount)}</td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td style="padding: 8px 15px; font-family: Arial, sans-serif;">Shipping</td>
                      <td style="padding: 8px 15px; text-align: right; font-family: Arial, sans-serif;">${order.shipping === 0 ? 'FREE' : formatCurrency(order.shipping)}</td>
                    </tr>
                    <tr style="background-color: #1a1a1a;">
                      <td style="padding: 12px 15px; font-family: Arial, sans-serif; font-weight: bold; color: #ffffff; font-size: 16px;">TOTAL</td>
                      <td style="padding: 12px 15px; text-align: right; font-family: Arial, sans-serif; font-weight: bold; color: #c9a962; font-size: 16px;">${formatCurrency(order.total)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #1a1a1a; padding: 15px; text-align: center;">
                  <p style="margin: 0; color: #888; font-family: Arial, sans-serif; font-size: 12px;">
                    Rayn Adam Order Management System
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

const generateShippingLabelPDF = async (order: OrderConfirmationRequest): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([400, 300]); // 4x3 inch label size
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const { width, height } = page.getSize();
  
  // Draw border
  page.drawRectangle({
    x: 10,
    y: 10,
    width: width - 20,
    height: height - 20,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
  });
  
  // Header - FROM
  page.drawText('FROM:', {
    x: 20,
    y: height - 35,
    size: 8,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  page.drawText('RAYN ADAM PERFUMES', {
    x: 20,
    y: height - 48,
    size: 10,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('India', {
    x: 20,
    y: height - 62,
    size: 9,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  // Divider line
  page.drawLine({
    start: { x: 20, y: height - 80 },
    end: { x: width - 20, y: height - 80 },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });
  
  // TO section
  page.drawText('SHIP TO:', {
    x: 20,
    y: height - 100,
    size: 10,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  // Customer name
  page.drawText(order.customer_name.toUpperCase(), {
    x: 20,
    y: height - 125,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  // Address
  page.drawText(order.shipping_address.address, {
    x: 20,
    y: height - 145,
    size: 11,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  // City, State, ZIP
  page.drawText(`${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zipCode}`, {
    x: 20,
    y: height - 162,
    size: 11,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  // Country
  page.drawText(order.shipping_address.country.toUpperCase(), {
    x: 20,
    y: height - 179,
    size: 11,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  // Divider line
  page.drawLine({
    start: { x: 20, y: 70 },
    end: { x: width - 20, y: 70 },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });
  
  // Order number box
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: 40,
    color: rgb(0.95, 0.95, 0.95),
    borderColor: rgb(0.7, 0.7, 0.7),
    borderWidth: 1,
  });
  
  page.drawText('ORDER:', {
    x: 30,
    y: 45,
    size: 8,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  page.drawText(order.order_number, {
    x: 70,
    y: 43,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  // Payment method indicator
  const paymentText = order.payment_method === 'cod' ? `COD: ${formatCurrency(order.total)}` : 'PREPAID';
  page.drawText(paymentText, {
    x: width - 120,
    y: 43,
    size: 10,
    font: boldFont,
    color: order.payment_method === 'cod' ? rgb(0.8, 0.2, 0) : rgb(0, 0.5, 0),
  });
  
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const orderData: OrderConfirmationRequest = await req.json();
    
    console.log("Sending order confirmation email to:", orderData.customer_email);
    console.log("Order number:", orderData.order_number);

    const emailHTML = generateOrderEmailHTML(orderData);
    const invoiceContent = generateInvoiceAttachment(orderData);

    // Convert invoice text to base64 for attachment
    const encoder = new TextEncoder();
    const invoiceBytes = encoder.encode(invoiceContent);
    const invoiceBase64 = btoa(String.fromCharCode(...invoiceBytes));

    // Send customer confirmation email
    const emailResponse = await resend.emails.send({
      from: "Rayn Adam <orders@raynadamperfume.com>",
      to: [orderData.customer_email],
      subject: `Order Confirmed - ${orderData.order_number}`,
      html: emailHTML,
      attachments: [
        {
          filename: `invoice-${orderData.order_number}.txt`,
          content: invoiceBase64,
        },
      ],
    });

    console.log("Customer email sent successfully:", emailResponse);

    // Send admin notification email for packing and shipping
    const adminEmail = Deno.env.get("ADMIN_ORDER_EMAIL");
    console.log("Admin email configured:", adminEmail ? "YES" : "NO");
    
    if (adminEmail) {
      try {
        console.log("Generating admin email HTML...");
        const adminEmailHTML = generateAdminOrderEmailHTML(orderData);
        
        // Generate shipping label PDF
        console.log("Generating shipping label PDF...");
        const shippingLabelPdf = await generateShippingLabelPDF(orderData);
        const shippingLabelBase64 = btoa(String.fromCharCode(...shippingLabelPdf));
        console.log("Shipping label PDF generated, size:", shippingLabelPdf.length);
        
        console.log("Sending admin notification email to:", adminEmail);
        const adminEmailResponse = await resend.emails.send({
          from: "Rayn Adam Orders <orders@raynadamperfume.com>",
          to: [adminEmail],
          subject: `🚚 NEW ORDER - ${orderData.order_number} - ${orderData.customer_name}`,
          html: adminEmailHTML,
          attachments: [
            {
              filename: `invoice-${orderData.order_number}.txt`,
              content: invoiceBase64,
            },
            {
              filename: `shipping-label-${orderData.order_number}.pdf`,
              content: shippingLabelBase64,
            },
          ],
        });
        console.log("Admin notification email sent successfully:", JSON.stringify(adminEmailResponse));
      } catch (adminError: any) {
        console.error("Failed to send admin notification email:", adminError.message);
        console.error("Admin email error details:", JSON.stringify(adminError));
      }
    } else {
      console.warn("ADMIN_ORDER_EMAIL not configured, skipping admin notification");
    }

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending order confirmation email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

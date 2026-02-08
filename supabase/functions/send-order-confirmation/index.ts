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
  address?: string;
  street?: string;
  city: string;
  state: string;
  zipCode?: string;
  pincode?: string;
  country?: string;
}

// Helper function to safely get address string from shipping address
const getAddressString = (addr: ShippingAddress): string => {
  return addr.address || addr.street || '';
};

// Helper function to safely get zipcode string
const getZipCode = (addr: ShippingAddress): string => {
  return addr.zipCode || addr.pincode || '';
};

interface OrderConfirmationRequest {
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shipping_address: ShippingAddress;
  payment_method: string;
  coupon_code?: string;
  affiliate_code?: string;
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
RAYN ADAM PRIVATE LIMITED
Ward No. 21, Door No. 553/1, Kavumpadi, Pallikkal
Tirurangadi, Malappuram – 673634, Kerala, India
Phone: +91 99466 47442
GSTIN: 32AAPCR2931R1ZS | TAN: CHNR06383G
================================

INVOICE

Order Number: ${order.order_number}
Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}

Customer: ${order.customer_name}
Email: ${order.customer_email}

Shipping Address:
${getAddressString(order.shipping_address)}
${order.shipping_address.city}, ${order.shipping_address.state} ${getZipCode(order.shipping_address)}
${order.shipping_address.country || 'India'}

--------------------------------
ORDER ITEMS
--------------------------------
${order.items.map(item => `${item.name} x${item.quantity} - ${formatCurrency(item.price * item.quantity)}`).join('\n')}

--------------------------------
Subtotal: ${formatCurrency(order.subtotal)}
${order.discount > 0 ? `Discount${order.coupon_code ? ` (${order.coupon_code})` : order.affiliate_code ? ` (${order.affiliate_code})` : ''}: -${formatCurrency(order.discount)}` : ''}
Shipping: ${order.shipping === 0 ? 'FREE' : formatCurrency(order.shipping)}
--------------------------------
TOTAL: ${formatCurrency(order.total)}

Payment Method: ${paymentMethodLabel}

================================
Thank you for shopping with Rayn Adam!
For questions: support@raynadamperfume.com
© ${new Date().getFullYear()} Rayn Adam Private Limited
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
    <body style="margin: 0; padding: 0; background-color: #1c1c1c;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1c1c1c; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #242424; border-radius: 8px; overflow: hidden; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 100%); padding: 45px 40px; text-align: center; border-bottom: 2px solid #a87c39;">
                  <h1 style="margin: 0; color: #c7915e; font-family: Georgia, serif; font-size: 32px; letter-spacing: 3px; font-weight: 300;">
                    RAYN ADAM
                  </h1>
                  <p style="margin: 10px 0 0; color: #a87c39; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">
                    Luxury Perfumes
                  </p>
                </td>
              </tr>
              
              <!-- Order Confirmation -->
              <tr>
                <td style="padding: 40px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <div style="width: 70px; height: 70px; background: linear-gradient(135deg, #a87c39 0%, #c7915e 100%); border-radius: 50%; display: inline-block; line-height: 70px;">
                      <span style="color: #1c1c1c; font-size: 36px;">✓</span>
                    </div>
                  </div>
                  
                  <h2 style="margin: 0 0 10px; text-align: center; color: #f5f5f0; font-family: Georgia, serif; font-size: 26px; font-weight: 400;">
                    Thank You for Your Order!
                  </h2>
                  <p style="margin: 0 0 30px; text-align: center; color: #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px;">
                    Hi ${order.customer_name}, your order has been confirmed.
                  </p>
                  
                  <!-- Invoice Download Button -->
                  <div style="text-align: center; margin-bottom: 30px;">
                    <p style="margin: 0 0 10px; color: #888; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px;">
                      📄 Your invoice is attached to this email
                    </p>
                  </div>
                  
                  <!-- Order Number -->
                  <div style="background-color: #1c1c1c; border-radius: 8px; padding: 25px; margin-bottom: 30px; text-align: center; border: 1px solid #3d3d3d;">
                    <p style="margin: 0 0 8px; color: #a87c39; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">
                      Order Number
                    </p>
                    <p style="margin: 0; color: #c7915e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: bold; letter-spacing: 2px;">
                      ${order.order_number}
                    </p>
                  </div>
                  
                  <!-- Order Items -->
                  <h3 style="margin: 0 0 18px; color: #c7915e; font-family: Georgia, serif; font-size: 18px; font-weight: 500; letter-spacing: 1px;">
                    Order Summary
                  </h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px; background: #1c1c1c; border-radius: 6px; overflow: hidden;">
                    <thead>
                      <tr style="background-color: #2d2d2d;">
                        <th style="padding: 14px; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #a87c39; text-transform: uppercase; letter-spacing: 1px;">
                          Item
                        </th>
                        <th style="padding: 14px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #a87c39; text-transform: uppercase; letter-spacing: 1px;">
                          Qty
                        </th>
                        <th style="padding: 14px; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #a87c39; text-transform: uppercase; letter-spacing: 1px;">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      ${order.items.map(item => `
                        <tr>
                          <td style="padding: 14px; border-bottom: 1px solid #3d3d3d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f5f5f0;">
                            ${item.name}
                          </td>
                          <td style="padding: 14px; border-bottom: 1px solid #3d3d3d; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #e0e0e0;">
                            ${item.quantity}
                          </td>
                          <td style="padding: 14px; border-bottom: 1px solid #3d3d3d; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f5f5f0;">
                            ${formatCurrency(item.price * item.quantity)}
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                  
                  <!-- Order Totals -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #888;">
                        Subtotal
                      </td>
                      <td style="padding: 10px 0; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f5f5f0;">
                        ${formatCurrency(order.subtotal)}
                      </td>
                    </tr>
                    ${order.discount > 0 ? `
                    <tr>
                      <td style="padding: 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #22c55e;">
                        Discount ${order.coupon_code ? `<span style="color: #888; font-size: 12px;">(${order.coupon_code})</span>` : order.affiliate_code ? `<span style="color: #888; font-size: 12px;">(${order.affiliate_code})</span>` : ''}
                      </td>
                      <td style="padding: 10px 0; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #22c55e;">
                        -${formatCurrency(order.discount)}
                      </td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td style="padding: 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #888;">
                        Shipping
                      </td>
                      <td style="padding: 10px 0; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f5f5f0;">
                        ${order.shipping === 0 ? 'FREE' : formatCurrency(order.shipping)}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 15px 0; border-top: 2px solid #a87c39; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: bold; color: #f5f5f0; font-size: 18px;">
                        Total
                      </td>
                      <td style="padding: 15px 0; border-top: 2px solid #a87c39; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: bold; color: #c7915e; font-size: 20px;">
                        ${formatCurrency(order.total)}
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Shipping Address -->
                  <div style="background-color: #1c1c1c; border-radius: 8px; padding: 25px; margin-bottom: 20px; border: 1px solid #3d3d3d;">
                    <h4 style="margin: 0 0 12px; color: #c7915e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">
                      📍 Shipping Address
                    </h4>
                    <p style="margin: 0; color: #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.7;">
                      ${order.customer_name}<br>
                      ${getAddressString(order.shipping_address)}<br>
                      ${order.shipping_address.city}, ${order.shipping_address.state} ${getZipCode(order.shipping_address)}<br>
                      ${order.shipping_address.country || 'India'}
                    </p>
                  </div>
                  
                  <!-- Payment Method -->
                  <div style="background-color: #1c1c1c; border-radius: 8px; padding: 25px; margin-bottom: 30px; border: 1px solid #3d3d3d;">
                    <h4 style="margin: 0 0 12px; color: #c7915e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">
                      💳 Payment Method
                    </h4>
                    <p style="margin: 0; color: #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px;">
                      ${paymentMethodLabel}
                    </p>
                  </div>
                  
                  <!-- Footer Message -->
                  <p style="margin: 0; text-align: center; color: #888; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6;">
                    If you have any questions about your order, please contact us at<br>
                    <a href="mailto:support@raynadamperfume.com" style="color: #c7915e; text-decoration: none;">support@raynadamperfume.com</a>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: linear-gradient(135deg, #1c1c1c 0%, #0f0f0f 100%); padding: 30px; text-align: center; border-top: 1px solid #3d3d3d;">
                  <p style="margin: 0 0 10px; color: #a87c39; font-family: Georgia, serif; font-size: 14px; letter-spacing: 2px;">
                    RAYN ADAM
                  </p>
                  <p style="margin: 0; color: #666; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px;">
                    © ${new Date().getFullYear()} Rayn Adam Private Limited. All rights reserved.
                  </p>
                  <p style="margin: 8px 0 0; color: #555; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px;">
                    Ward No. 21, Door No. 553/1, Kavumpadi, Pallikkal<br>
                    Tirurangadi, Malappuram – 673634, Kerala, India<br>
                    Phone: +91 99466 47442
                  </p>
                  <p style="margin: 8px 0 0; color: #555; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 9px;">
                    GSTIN: 32AAPCR2931R1ZS | TAN: CHNR06383G
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

const generateInvoicePDF = async (order: OrderConfirmationRequest): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const { width, height } = page.getSize();
  
  const formattedDate = new Date().toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  
  const paymentMethodLabel = order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment';
  
  let yPos = height - 50;
  
  // Header
  page.drawText('RAYN ADAM', {
    x: width / 2 - 50,
    y: yPos,
    size: 24,
    font: boldFont,
    color: rgb(0.79, 0.66, 0.38), // Gold color
  });
  
  yPos -= 20;
  page.drawText('LUXURY PERFUMES', {
    x: width / 2 - 55,
    y: yPos,
    size: 12,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  yPos -= 12;
  page.drawText('RAYN ADAM PRIVATE LIMITED', {
    x: width / 2 - 70,
    y: yPos,
    size: 9,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  yPos -= 12;
  page.drawText('Ward No. 21, Door No. 553/1, Kavumpadi, Pallikkal, Tirurangadi', {
    x: width / 2 - 155,
    y: yPos,
    size: 9,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  yPos -= 12;
  page.drawText('Malappuram – 673634, Kerala, India | Ph: +91 99466 47442', {
    x: width / 2 - 140,
    y: yPos,
    size: 9,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  yPos -= 12;
  page.drawText('GSTIN: 32AAPCR2931R1ZS | TAN: CHNR06383G', {
    x: width / 2 - 100,
    y: yPos,
    size: 9,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  yPos -= 40;
  page.drawText('INVOICE', {
    x: width / 2 - 30,
    y: yPos,
    size: 18,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  
  // Order info
  yPos -= 40;
  page.drawText(`Order Number: ${order.order_number}`, {
    x: 50,
    y: yPos,
    size: 11,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  
  page.drawText(`Date: ${formattedDate}`, {
    x: width - 200,
    y: yPos,
    size: 11,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  // Divider
  yPos -= 20;
  page.drawLine({
    start: { x: 50, y: yPos },
    end: { x: width - 50, y: yPos },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  
  // Bill To / Ship To
  yPos -= 30;
  page.drawText('BILL TO:', {
    x: 50,
    y: yPos,
    size: 10,
    font: boldFont,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  page.drawText('SHIP TO:', {
    x: width / 2 + 20,
    y: yPos,
    size: 10,
    font: boldFont,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  yPos -= 18;
  page.drawText(order.customer_name, {
    x: 50,
    y: yPos,
    size: 11,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  
  page.drawText(order.customer_name, {
    x: width / 2 + 20,
    y: yPos,
    size: 11,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  
  yPos -= 15;
  page.drawText(order.customer_email, {
    x: 50,
    y: yPos,
    size: 10,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  page.drawText(getAddressString(order.shipping_address), {
    x: width / 2 + 20,
    y: yPos,
    size: 10,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  yPos -= 15;
  const customerPhone = order.customer_phone || 'N/A';
  page.drawText(`Ph: ${customerPhone}`, {
    x: 50,
    y: yPos,
    size: 10,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  page.drawText(`${order.shipping_address.city}, ${order.shipping_address.state} ${getZipCode(order.shipping_address)}`, {
    x: width / 2 + 20,
    y: yPos,
    size: 10,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  yPos -= 15;
  page.drawText(order.shipping_address.country || 'India', {
    x: width / 2 + 20,
    y: yPos,
    size: 10,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  // Order Items Header
  yPos -= 40;
  page.drawRectangle({
    x: 50,
    y: yPos - 5,
    width: width - 100,
    height: 25,
    color: rgb(0.1, 0.1, 0.1),
  });
  
  page.drawText('Product', {
    x: 60,
    y: yPos + 3,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  
  page.drawText('Qty', {
    x: 350,
    y: yPos + 3,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  
  page.drawText('Price', {
    x: 450,
    y: yPos + 3,
    size: 10,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  
  // Order Items
  yPos -= 25;
  for (const item of order.items) {
    yPos -= 20;
    page.drawText(item.name.substring(0, 40), {
      x: 60,
      y: yPos,
      size: 10,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    page.drawText(item.quantity.toString(), {
      x: 360,
      y: yPos,
      size: 10,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    page.drawText(`INR ${(item.price * item.quantity).toLocaleString('en-IN')}`, {
      x: 440,
      y: yPos,
      size: 10,
      font: font,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    // Item divider
    yPos -= 8;
    page.drawLine({
      start: { x: 50, y: yPos },
      end: { x: width - 50, y: yPos },
      thickness: 0.5,
      color: rgb(0.9, 0.9, 0.9),
    });
  }
  
  // Totals section
  yPos -= 30;
  page.drawText('Subtotal:', {
    x: 350,
    y: yPos,
    size: 10,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });
  page.drawText(`INR ${order.subtotal.toLocaleString('en-IN')}`, {
    x: 440,
    y: yPos,
    size: 10,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  if (order.discount > 0) {
    yPos -= 18;
    page.drawText('Discount:', {
      x: 350,
      y: yPos,
      size: 10,
      font: font,
      color: rgb(0.16, 0.65, 0.27),
    });
    page.drawText(`-INR ${order.discount.toLocaleString('en-IN')}`, {
      x: 440,
      y: yPos,
      size: 10,
      font: font,
      color: rgb(0.16, 0.65, 0.27),
    });
  }
  
  yPos -= 18;
  page.drawText('Shipping:', {
    x: 350,
    y: yPos,
    size: 10,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });
  page.drawText(order.shipping === 0 ? 'FREE' : `INR ${order.shipping.toLocaleString('en-IN')}`, {
    x: 440,
    y: yPos,
    size: 10,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  // Total
  yPos -= 25;
  page.drawRectangle({
    x: 340,
    y: yPos - 5,
    width: 200,
    height: 25,
    color: rgb(0.95, 0.95, 0.95),
  });
  
  page.drawText('TOTAL:', {
    x: 350,
    y: yPos + 3,
    size: 12,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText(`INR ${order.total.toLocaleString('en-IN')}`, {
    x: 440,
    y: yPos + 3,
    size: 12,
    font: boldFont,
    color: rgb(0.79, 0.66, 0.38),
  });
  
  // Payment method
  yPos -= 40;
  page.drawText(`Payment Method: ${paymentMethodLabel}`, {
    x: 50,
    y: yPos,
    size: 10,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  // Footer
  yPos = 80;
  page.drawLine({
    start: { x: 50, y: yPos },
    end: { x: width - 50, y: yPos },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  
  yPos -= 20;
  page.drawText('Thank you for shopping with Rayn Adam!', {
    x: width / 2 - 100,
    y: yPos,
    size: 11,
    font: boldFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  yPos -= 18;
  page.drawText('For questions, contact us:', {
    x: width / 2 - 55,
    y: yPos,
    size: 9,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  yPos -= 14;
  page.drawText('Email: support@raynadamperfume.com | Phone: +91 99466 47442', {
    x: width / 2 - 150,
    y: yPos,
    size: 9,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
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
                      ${getAddressString(order.shipping_address)}<br>
                      ${order.shipping_address.city}, ${order.shipping_address.state} ${getZipCode(order.shipping_address)}<br>
                      <strong>${order.shipping_address.country || 'India'}</strong>
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
  const page = pdfDoc.addPage([595, 842]); // A4 size
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const { width, height } = page.getSize();
  const margin = 40;
  const contentWidth = width - margin * 2;
  
  const isPrepaid = order.payment_method !== 'cod';
  const totalAmount = Math.round(order.total);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const orderDate = new Date().toISOString().split('T')[0];
  
  let yPos = height - 50;
  
  // Outer border
  page.drawRectangle({
    x: margin - 10,
    y: 80,
    width: contentWidth + 20,
    height: height - 110,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
  });
  
  // Header - RAYN ADAM
  page.drawText('RAYN ADAM', {
    x: margin,
    y: yPos,
    size: 28,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  yPos -= 18;
  page.drawText('LUXURY PERFUME', {
    x: margin,
    y: yPos,
    size: 11,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  // Header divider
  yPos -= 15;
  page.drawLine({
    start: { x: margin - 10, y: yPos },
    end: { x: width - margin + 10, y: yPos },
    thickness: 2,
    color: rgb(0, 0, 0),
  });
  
  // Order Info Box
  yPos -= 25;
  const orderBoxY = yPos - 55;
  page.drawRectangle({
    x: margin,
    y: orderBoxY,
    width: contentWidth,
    height: 80,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
  });
  
  page.drawText(`ORDER: ${order.order_number}`, {
    x: margin + 10,
    y: yPos,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  yPos -= 16;
  page.drawText(`DATE: ${orderDate}`, {
    x: margin + 10,
    y: yPos,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  // Payment Label Box
  yPos -= 25;
  const paymentLabel = isPrepaid ? `PREPAID : INR ${totalAmount}` : `CASH ON DELIVERY : INR ${totalAmount}`;
  const paymentBoxWidth = paymentLabel.length * 9 + 20;
  
  page.drawRectangle({
    x: margin + 10,
    y: yPos - 8,
    width: paymentBoxWidth,
    height: 25,
    borderColor: rgb(0, 0, 0),
    borderWidth: 3,
  });
  
  page.drawText(paymentLabel, {
    x: margin + 20,
    y: yPos,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  // Items count on the right
  page.drawText(`Items: ${itemCount}`, {
    x: width - margin - 60,
    y: yPos + 35,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  // Address Tables
  yPos = orderBoxY - 20;
  const addressBoxHeight = 130;
  const halfWidth = (contentWidth - 10) / 2;
  
  // Ship To Box
  page.drawRectangle({
    x: margin,
    y: yPos - addressBoxHeight,
    width: halfWidth,
    height: addressBoxHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
  });
  
  page.drawText('SHIP TO', {
    x: margin + 10,
    y: yPos - 18,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawLine({
    start: { x: margin + 10, y: yPos - 23 },
    end: { x: margin + halfWidth - 10, y: yPos - 23 },
    thickness: 2,
    color: rgb(0, 0, 0),
  });
  
  let addrY = yPos - 40;
  page.drawText(order.customer_name, {
    x: margin + 10,
    y: addrY,
    size: 11,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  addrY -= 16;
  page.drawText(getAddressString(order.shipping_address).substring(0, 40), {
    x: margin + 10,
    y: addrY,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  addrY -= 14;
  page.drawText(`${order.shipping_address.city}, ${order.shipping_address.state} - ${order.shipping_address.zipCode || order.shipping_address.pincode || ''}`, {
    x: margin + 10,
    y: addrY,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  addrY -= 14;
  page.drawText(order.shipping_address.country || 'India', {
    x: margin + 10,
    y: addrY,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  addrY -= 14;
  page.drawText(`PHONE: ${order.customer_phone || 'N/A'}`, {
    x: margin + 10,
    y: addrY,
    size: 10,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  // Seller Box
  const sellerX = margin + halfWidth + 10;
  page.drawRectangle({
    x: sellerX,
    y: yPos - addressBoxHeight,
    width: halfWidth,
    height: addressBoxHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
  });
  
  page.drawText('SELLER', {
    x: sellerX + 10,
    y: yPos - 18,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawLine({
    start: { x: sellerX + 10, y: yPos - 23 },
    end: { x: sellerX + halfWidth - 10, y: yPos - 23 },
    thickness: 2,
    color: rgb(0, 0, 0),
  });
  
  let sellerY = yPos - 40;
  page.drawText('RAYN ADAM PRIVATE LIMITED', {
    x: sellerX + 10,
    y: sellerY,
    size: 11,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  sellerY -= 14;
  page.drawText('Ward No. 21, Door No. 553/1', {
    x: sellerX + 10,
    y: sellerY,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  sellerY -= 14;
  page.drawText('Kavumpadi, Pallikkal, Tirurangadi', {
    x: sellerX + 10,
    y: sellerY,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  sellerY -= 14;
  page.drawText('Malappuram, Kerala – 673634', {
    x: sellerX + 10,
    y: sellerY,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  sellerY -= 14;
  page.drawText('PHONE: +91 99466 47442', {
    x: sellerX + 10,
    y: sellerY,
    size: 10,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  // Product Table
  yPos = yPos - addressBoxHeight - 30;
  const productColWidth = contentWidth * 0.8;
  const qtyColWidth = contentWidth * 0.2;
  
  // Table header
  page.drawRectangle({
    x: margin,
    y: yPos - 25,
    width: productColWidth,
    height: 25,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
  });
  page.drawRectangle({
    x: margin + productColWidth,
    y: yPos - 25,
    width: qtyColWidth,
    height: 25,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
  });
  
  page.drawText('PRODUCT', {
    x: margin + 10,
    y: yPos - 17,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('QTY', {
    x: margin + productColWidth + 10,
    y: yPos - 17,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  // Table rows
  yPos -= 25;
  for (const item of order.items) {
    page.drawRectangle({
      x: margin,
      y: yPos - 25,
      width: productColWidth,
      height: 25,
      borderColor: rgb(0, 0, 0),
      borderWidth: 2,
    });
    page.drawRectangle({
      x: margin + productColWidth,
      y: yPos - 25,
      width: qtyColWidth,
      height: 25,
      borderColor: rgb(0, 0, 0),
      borderWidth: 2,
    });
    
    page.drawText(item.name.substring(0, 45), {
      x: margin + 10,
      y: yPos - 17,
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(String(item.quantity), {
      x: margin + productColWidth + qtyColWidth - 25,
      y: yPos - 17,
      size: 11,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    
    yPos -= 25;
  }
  
  // Total Box
  yPos -= 20;
  page.drawRectangle({
    x: margin,
    y: yPos - 30,
    width: contentWidth,
    height: 30,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
  });
  
  page.drawText(`TOTAL : INR ${totalAmount}`, {
    x: width - margin - 130,
    y: yPos - 20,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  // Return Address Box
  yPos -= 50;
  page.drawRectangle({
    x: margin,
    y: yPos - 60,
    width: contentWidth,
    height: 60,
    borderColor: rgb(0, 0, 0),
    borderWidth: 2,
  });
  
  page.drawText('RETURN ADDRESS', {
    x: margin + 10,
    y: yPos - 18,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawLine({
    start: { x: margin + 10, y: yPos - 23 },
    end: { x: margin + 120, y: yPos - 23 },
    thickness: 2,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('RAYN ADAM PRIVATE LIMITED, Ward No. 21, Door No. 553/1, Kavumpadi, Pallikkal,', {
    x: margin + 20,
    y: yPos - 40,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('Tirurangadi, Malappuram, Kerala – 673634, PHONE: +91 99466 47442', {
    x: margin + 70,
    y: yPos - 52,
    size: 9,
    font: font,
    color: rgb(0, 0, 0),
  });
  
  // Footer
  page.drawText('THANK YOU FOR SHOPPING', {
    x: width / 2 - 70,
    y: 100,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
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
    // This is an internal-only endpoint - verify it's called with service role key
    const authHeader = req.headers.get("authorization");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!authHeader || !supabaseServiceKey || authHeader !== `Bearer ${supabaseServiceKey}`) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderData: OrderConfirmationRequest = await req.json();
    
    console.log("Sending order confirmation for order:", orderData.order_number);

    const emailHTML = generateOrderEmailHTML(orderData);
    
    // Generate PDF invoice for customer
    console.log("Generating PDF invoice...");
    const invoicePdf = await generateInvoicePDF(orderData);
    const invoicePdfBase64 = btoa(String.fromCharCode(...invoicePdf));
    console.log("PDF invoice generated, size:", invoicePdf.length);

    // Generate plain text version for email
    const plainTextEmail = `Thank you for your order, ${orderData.customer_name}!

Order Number: ${orderData.order_number}

Order Summary:
${orderData.items.map(item => `- ${item.name} x${item.quantity}: ₹${(item.price * item.quantity).toLocaleString('en-IN')}`).join('\n')}

Subtotal: ₹${orderData.subtotal.toLocaleString('en-IN')}
${orderData.discount > 0 ? `Discount: -₹${orderData.discount.toLocaleString('en-IN')}\n` : ''}Shipping: ${orderData.shipping === 0 ? 'FREE' : `₹${orderData.shipping.toLocaleString('en-IN')}`}
Total: ₹${orderData.total.toLocaleString('en-IN')}

Shipping Address:
${orderData.customer_name}
${getAddressString(orderData.shipping_address)}
${orderData.shipping_address.city}, ${orderData.shipping_address.state} ${getZipCode(orderData.shipping_address)}
${orderData.shipping_address.country || 'India'}

Payment Method: ${orderData.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}

Your invoice is attached to this email.

For questions, contact us at support@raynadamperfume.com

Thank you for shopping with Rayn Adam!
`;

    // Send customer confirmation email with PDF invoice
    const emailResponse = await resend.emails.send({
      from: "Rayn Adam <orders@raynadamperfume.com>",
      to: [orderData.customer_email],
      subject: `Order Confirmed - ${orderData.order_number}`,
      html: emailHTML,
      text: plainTextEmail,
      attachments: [
        {
          filename: `invoice-${orderData.order_number}.pdf`,
          content: invoicePdfBase64,
        },
      ],
    });

    console.log("Customer email sent successfully:", emailResponse);

    // Send admin and shipping notification email for packing and shipping
    const adminOrderEmailRaw = Deno.env.get("ADMIN_ORDER_EMAIL") || "";
    const shippingEmailsRaw = Deno.env.get("SHIPPING_EMAILS") || "";
    
    const adminEmails = adminOrderEmailRaw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0);
    
    const shippingEmails = shippingEmailsRaw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0);
    
    // Combine and deduplicate all recipients
    const allRecipients = [...new Set([...adminEmails, ...shippingEmails])];

    console.log("Admin notification recipients configured:", allRecipients.length);

    if (allRecipients.length > 0) {
      try {
        console.log("Generating admin email HTML...");
        const adminEmailHTML = generateAdminOrderEmailHTML(orderData);

        // Generate shipping label PDF
        console.log("Generating shipping label PDF...");
        const shippingLabelPdf = await generateShippingLabelPDF(orderData);
        const shippingLabelBase64 = btoa(String.fromCharCode(...shippingLabelPdf));
        console.log("Shipping label PDF generated, size:", shippingLabelPdf.length);

        const adminPlainText = `New Order Received!

Order: ${orderData.order_number}
Customer: ${orderData.customer_name}
Email: ${orderData.customer_email}
Phone: ${orderData.customer_phone || 'N/A'}
Total: ₹${orderData.total.toLocaleString('en-IN')}
Payment: ${orderData.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}

Items:
${orderData.items.map(item => `- ${item.name} x${item.quantity}`).join('\n')}

Shipping Address:
${getAddressString(orderData.shipping_address)}
${orderData.shipping_address.city}, ${orderData.shipping_address.state}

Invoice and shipping label are attached.
`;

        const sendAdminEmail = async () =>
          await resend.emails.send({
            from: "Rayn Adam <notifications@raynadamperfume.com>",
            to: allRecipients,
            subject: `🚚 NEW ORDER - ${orderData.order_number} - ${orderData.customer_name}`,
            html: adminEmailHTML,
            text: adminPlainText,
            attachments: [
              {
                filename: `invoice-${orderData.order_number}.pdf`,
                content: invoicePdfBase64,
              },
              {
                filename: `shipping-label-${orderData.order_number}.pdf`,
                content: shippingLabelBase64,
              },
            ],
          });

        console.log("Sending order notification email to:", allRecipients.join(", "));
        let adminResp = await sendAdminEmail();

        // Resend API can rate-limit bursts; do one retry with a short backoff.
        if ((adminResp as any)?.error?.statusCode === 429) {
          console.warn("Rate limited sending admin email; retrying after 650ms...");
          await new Promise((r) => setTimeout(r, 650));
          adminResp = await sendAdminEmail();
        }

        if ((adminResp as any)?.error) {
          console.error("Order notification email failed:", JSON.stringify(adminResp));
        } else {
          console.log("Order notification email sent successfully:", JSON.stringify(adminResp));
        }
      } catch (adminError: any) {
        console.error("Failed to send order notification email:", adminError?.message || adminError);
        console.error("Email error details:", JSON.stringify(adminError));
      }
    } else {
      console.warn("No ADMIN_ORDER_EMAIL or SHIPPING_EMAILS configured, skipping order notification");
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

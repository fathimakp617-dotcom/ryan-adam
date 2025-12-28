import { useState } from "react";
import { motion } from "framer-motion";
import { Download, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface OrderReceiptProps {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  orderDate: string;
  onClose: () => void;
}

const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

const OrderReceipt = ({
  orderNumber,
  customerName,
  customerEmail,
  items,
  subtotal,
  discount,
  shipping,
  total,
  shippingAddress,
  paymentMethod,
  orderDate,
  onClose,
}: OrderReceiptProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const generateReceiptHTML = () => {
    const itemsHTML = items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt - ${orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #c9a962; padding-bottom: 20px; }
          .logo { font-size: 28px; font-weight: bold; color: #1a1a1a; letter-spacing: 2px; }
          .logo-sub { font-size: 12px; color: #888; letter-spacing: 3px; margin-top: 5px; }
          .order-info { background: #f8f8f8; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .order-number { font-size: 20px; font-weight: bold; color: #c9a962; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #1a1a1a; color: #fff; padding: 12px; text-align: left; }
          .totals { margin-top: 20px; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
          .total-final { font-size: 18px; font-weight: bold; color: #c9a962; border-top: 2px solid #1a1a1a; padding-top: 12px; margin-top: 12px; }
          .address-section { background: #f8f8f8; padding: 20px; border-radius: 8px; margin-top: 30px; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">RAYN ADAM</div>
          <div class="logo-sub">LUXURY PERFUMES</div>
        </div>
        
        <div class="order-info">
          <p style="margin: 0 0 10px; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Order Receipt</p>
          <p class="order-number">${orderNumber}</p>
          <p style="margin: 10px 0 0; color: #666;">Date: ${new Date(orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        <h3>Order Items</h3>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal</span>
            <span>${formatCurrency(subtotal)}</span>
          </div>
          ${discount > 0 ? `
          <div class="total-row" style="color: #22c55e;">
            <span>Discount</span>
            <span>-${formatCurrency(discount)}</span>
          </div>
          ` : ''}
          <div class="total-row">
            <span>Shipping</span>
            <span>${shipping === 0 ? 'FREE' : formatCurrency(shipping)}</span>
          </div>
          <div class="total-row total-final">
            <span>Total</span>
            <span>${formatCurrency(total)}</span>
          </div>
        </div>

        <div class="address-section">
          <h4 style="margin: 0 0 10px; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Shipping Address</h4>
          <p style="margin: 0; line-height: 1.6;">
            ${customerName}<br>
            ${shippingAddress.address}<br>
            ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}<br>
            ${shippingAddress.country}
          </p>
        </div>

        <div class="address-section">
          <h4 style="margin: 0 0 10px; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Payment Method</h4>
          <p style="margin: 0;">${paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'razorpay' ? 'Razorpay' : paymentMethod}</p>
        </div>

        <div class="footer">
          <p>Thank you for shopping with Rayn Adam!</p>
          <p>For questions, contact: support@raynadamperfume.com</p>
          <p style="margin-top: 15px;">© ${new Date().getFullYear()} Rayn Adam. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownload = () => {
    setIsDownloading(true);
    
    const html = generateReceiptHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${orderNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setTimeout(() => setIsDownloading(false), 1000);
  };

  const handlePrint = () => {
    const html = generateReceiptHTML();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card border border-border rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-heading text-foreground">Order Receipt</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <p className="text-primary font-medium text-lg">{orderNumber}</p>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date(orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-foreground">{item.name} × {item.quantity}</span>
              <span className="text-muted-foreground">{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-4 space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-primary">
              <span>Discount</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="text-foreground">{shipping === 0 ? 'FREE' : formatCurrency(shipping)}</span>
          </div>
          <div className="flex justify-between font-medium pt-2 border-t border-border">
            <span className="text-foreground">Total</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleDownload}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isDownloading}
          >
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex-1 border-border hover:border-primary"
          >
            Print
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OrderReceipt;
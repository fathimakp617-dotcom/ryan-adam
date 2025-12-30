import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Package, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  CreditCard,
  Calendar,
  Truck,
  Tag,
  ExternalLink
} from "lucide-react";

interface OrderItem {
  productId?: string;
  name?: string;
  product_name?: string;
  price: number;
  quantity: number;
}

interface ShippingAddress {
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  pincode?: string;
  country: string;
}

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total: number;
  subtotal: number;
  discount?: number | null;
  shipping?: number | null;
  order_status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  items: OrderItem[];
  shipping_address: ShippingAddress;
  coupon_code?: string | null;
  affiliate_code?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
}

interface OrderViewDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const OrderViewDialog = ({ order, open, onOpenChange }: OrderViewDialogProps) => {
  if (!order) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "processing": return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "shipped": return "bg-purple-500/10 text-purple-600 border-purple-200";
      case "delivered": return "bg-green-500/10 text-green-600 border-green-200";
      case "cancelled": return "bg-red-500/10 text-red-600 border-red-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-500/10 text-green-600 border-green-200";
      case "pending": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "failed": return "bg-red-500/10 text-red-600 border-red-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const zipCode = order.shipping_address?.zipCode || order.shipping_address?.pincode || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Order Details - {order.order_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Order Status:</span>
              <Badge variant="outline" className={`capitalize ${getStatusColor(order.order_status)}`}>
                {order.order_status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Payment:</span>
              <Badge variant="outline" className={`capitalize ${getPaymentStatusColor(order.payment_status)}`}>
                {order.payment_status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Method:</span>
              <Badge variant="secondary">
                {order.payment_method === "cod" ? "Cash on Delivery" : "Online Payment"}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Order Date</p>
                <p className="text-sm font-medium">{formatDate(order.created_at)}</p>
              </div>
            </div>
            {order.tracking_number && (
              <div className="flex items-start gap-3">
                <Truck className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Tracking Number</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{order.tracking_number}</p>
                    {order.tracking_url && (
                      <a 
                        href={order.tracking_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Customer Info */}
          <div>
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer Information
            </h3>
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{order.customer_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{order.customer_email}</span>
              </div>
              {order.customer_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customer_phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Shipping Address
            </h3>
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-sm">
                {order.shipping_address?.address}<br />
                {order.shipping_address?.city}, {order.shipping_address?.state} {zipCode}<br />
                {order.shipping_address?.country}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Order Items
            </h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center text-sm p-3 bg-muted/30 rounded-lg"
                >
                  <div>
                    <span className="font-medium">{item.name || item.product_name || "Product"}</span>
                    <span className="text-muted-foreground ml-2">×{item.quantity}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Coupons & Affiliates */}
          {(order.coupon_code || order.affiliate_code) && (
            <div className="flex flex-wrap gap-3">
              {order.coupon_code && (
                <div className="flex items-center gap-2 text-sm bg-green-500/10 text-green-600 px-3 py-1.5 rounded-full">
                  <Tag className="h-3 w-3" />
                  Coupon: {order.coupon_code}
                </div>
              )}
              {order.affiliate_code && (
                <div className="flex items-center gap-2 text-sm bg-purple-500/10 text-purple-600 px-3 py-1.5 rounded-full">
                  <Tag className="h-3 w-3" />
                  Affiliate: {order.affiliate_code}
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Order Summary */}
          <div>
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Order Summary
            </h3>
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount && order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              {order.shipping !== undefined && order.shipping !== null && order.shipping > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatCurrency(order.shipping)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderViewDialog;

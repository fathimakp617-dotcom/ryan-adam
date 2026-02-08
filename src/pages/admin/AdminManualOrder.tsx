import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, FileText, Package, Download, Loader2 } from "lucide-react";
import { downloadInvoicePDF, generateShippingLabelPDF } from "@/lib/generateInvoicePDF";

interface ManualItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const generateManualOrderNumber = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "WA-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const AdminManualOrder = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState<"invoice" | "label" | null>(null);

  // Order details
  const [orderNumber, setOrderNumber] = useState(generateManualOrderNumber());
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);

  // Customer details
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // Shipping address
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("India");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<string>("cod");
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");

  // Items
  const [items, setItems] = useState<ManualItem[]>([
    { id: crypto.randomUUID(), name: "", price: 0, quantity: 1 },
  ]);

  // Financials
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal - discount + shipping;

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), name: "", price: 0, quantity: 1 }]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof ManualItem, value: string | number) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const validate = (): boolean => {
    if (!customerName.trim()) {
      toast({ title: "Error", description: "Customer name is required", variant: "destructive" });
      return false;
    }
    if (!address.trim() || !city.trim() || !state.trim() || !zipCode.trim()) {
      toast({ title: "Error", description: "Complete shipping address is required", variant: "destructive" });
      return false;
    }
    const validItems = items.filter((item) => item.name.trim() && item.price > 0);
    if (validItems.length === 0) {
      toast({ title: "Error", description: "Add at least one product with name and price", variant: "destructive" });
      return false;
    }
    return true;
  };

  const getOrderData = () => {
    const validItems = items.filter((item) => item.name.trim() && item.price > 0);
    return {
      order_number: orderNumber,
      customer_name: customerName,
      customer_phone: customerPhone || null,
      customer_email: customerEmail || "whatsapp-order@raynadamperfume.com",
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      total,
      subtotal,
      created_at: new Date(orderDate).toISOString(),
      shipping_address: { address, city, state, zipCode, country },
      items: validItems.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        productId: "",
      })),
    };
  };

  const handleDownloadInvoice = async () => {
    if (!validate()) return;
    setIsGenerating("invoice");
    try {
      const order = getOrderData();
      await downloadInvoicePDF({
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        items: order.items,
        subtotal: order.subtotal,
        discount,
        shipping,
        total: order.total,
        shippingAddress: order.shipping_address,
        paymentMethod: order.payment_method,
        orderDate: order.created_at,
      });
      toast({ title: "Invoice Downloaded", description: `Invoice ${order.order_number} saved` });
    } catch (error) {
      console.error("Invoice generation error:", error);
      toast({ title: "Error", description: "Failed to generate invoice", variant: "destructive" });
    } finally {
      setIsGenerating(null);
    }
  };

  const handleDownloadLabel = async () => {
    if (!validate()) return;
    setIsGenerating("label");
    try {
      const order = getOrderData();
      await generateShippingLabelPDF(order);
      toast({ title: "Shipping Label Downloaded", description: `Label ${order.order_number} saved` });
    } catch (error) {
      console.error("Label generation error:", error);
      toast({ title: "Error", description: "Failed to generate shipping label", variant: "destructive" });
    } finally {
      setIsGenerating(null);
    }
  };

  const handleDownloadBoth = async () => {
    if (!validate()) return;
    setIsGenerating("invoice");
    try {
      const order = getOrderData();
      await downloadInvoicePDF({
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        items: order.items,
        subtotal: order.subtotal,
        discount,
        shipping,
        total: order.total,
        shippingAddress: order.shipping_address,
        paymentMethod: order.payment_method,
        orderDate: order.created_at,
      });
      await generateShippingLabelPDF(order);
      toast({ title: "Downloads Complete", description: "Invoice and shipping label saved" });
    } catch (error) {
      console.error("Generation error:", error);
      toast({ title: "Error", description: "Failed to generate documents", variant: "destructive" });
    } finally {
      setIsGenerating(null);
    }
  };

  const handleReset = () => {
    setOrderNumber(generateManualOrderNumber());
    setOrderDate(new Date().toISOString().split("T")[0]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setAddress("");
    setCity("");
    setState("");
    setZipCode("");
    setCountry("India");
    setPaymentMethod("cod");
    setPaymentStatus("pending");
    setItems([{ id: crypto.randomUUID(), name: "", price: 0, quantity: 1 }]);
    setDiscount(0);
    setShipping(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Manual Order Documents</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Generate invoices & shipping labels for WhatsApp / manual orders
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          Reset Form
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Order & Customer Details */}
        <div className="space-y-6">
          {/* Order Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Order Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="orderNumber">Order Number</Label>
                  <Input
                    id="orderNumber"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="orderDate">Order Date</Label>
                  <Input
                    id="orderDate"
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cod">Cash on Delivery</SelectItem>
                      <SelectItem value="online">Online Payment</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Payment Status</Label>
                  <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Details */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full name"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Optional"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, house number"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zipCode">PIN Code *</Label>
                  <Input
                    id="zipCode"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Products & Actions */}
        <div className="space-y-6">
          {/* Products */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Products</CardTitle>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="flex gap-2 items-end">
                  <div className="flex-1">
                    {index === 0 && <Label className="text-xs text-muted-foreground">Product Name</Label>}
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(item.id, "name", e.target.value)}
                      placeholder="Product name"
                      className="mt-1"
                    />
                  </div>
                  <div className="w-24">
                    {index === 0 && <Label className="text-xs text-muted-foreground">Price (₹)</Label>}
                    <Input
                      type="number"
                      min={0}
                      value={item.price || ""}
                      onChange={(e) => updateItem(item.id, "price", Number(e.target.value))}
                      placeholder="0"
                      className="mt-1"
                    />
                  </div>
                  <div className="w-16">
                    {index === 0 && <Label className="text-xs text-muted-foreground">Qty</Label>}
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", Math.max(1, Number(e.target.value)))}
                      className="mt-1"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Price Summary */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Price Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground w-20">Discount</Label>
                <Input
                  type="number"
                  min={0}
                  value={discount || ""}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0"
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground w-20">Shipping</Label>
                <Input
                  type="number"
                  min={0}
                  value={shipping || ""}
                  onChange={(e) => setShipping(Number(e.target.value))}
                  placeholder="0"
                  className="flex-1"
                />
              </div>
              <div className="border-t border-border pt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">₹{total.toLocaleString("en-IN")}</span>
              </div>
            </CardContent>
          </Card>

          {/* Download Actions */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Generate Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                onClick={handleDownloadBoth}
                disabled={!!isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download Invoice + Shipping Label
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleDownloadInvoice}
                  disabled={!!isGenerating}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Invoice Only
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadLabel}
                  disabled={!!isGenerating}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Label Only
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminManualOrder;

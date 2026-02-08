import { useState, useRef, useCallback } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, FileText, Package, Download, Loader2, ChevronDown, Check, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { downloadInvoicePDF, generateShippingLabelPDF } from "@/lib/generateInvoicePDF";
import { products as catalogProducts, formatPrice } from "@/data/products";
import { cn } from "@/lib/utils";
import { usePinCodeLookup } from "@/hooks/usePinCodeLookup";
import { supabase } from "@/integrations/supabase/client";

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

// Product combobox for selecting from catalog
const ProductCombobox = ({
  value,
  onSelect,
  onChange,
}: {
  value: string;
  onSelect: (product: { name: string; price: number }) => void;
  onChange: (name: string) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between mt-1 font-normal h-10"
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || "Select product..."}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search products..." />
          <CommandList>
            <CommandEmpty>No product found.</CommandEmpty>
            <CommandGroup heading="Catalog Products">
              {catalogProducts.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => {
                    onSelect({ name: product.name, price: product.price });
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === product.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{product.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {product.size} • {formatPrice(product.price)}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const AdminManualOrder = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState<"invoice" | "label" | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedOrderId, setSavedOrderId] = useState<string | null>(null);

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
  const [postOffice, setPostOffice] = useState("");

  // PIN code auto-lookup
  const { isLoading: isPinLoading, lookupPinCode } = usePinCodeLookup();

  const handlePinCodeChange = useCallback(async (value: string) => {
    setZipCode(value);
    setPostOffice("");
    if (value.replace(/\s/g, "").length === 6) {
      const result = await lookupPinCode(value);
      if (result) {
        setCity(result.city);
        setState(result.state);
        setCountry(result.country);
        setPostOffice(result.postOffice);
      }
    }
  }, [lookupPinCode]);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<string>("cod");
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");
  const [orderStatus, setOrderStatus] = useState<string>("pending");

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

  // Save order to database — returns true on success
  const saveOrderToDb = async (): Promise<boolean> => {
    if (savedOrderId) return true; // Already saved
    try {
      const stored = sessionStorage.getItem("rayn_admin_session");
      if (!stored) {
        toast({ title: "Error", description: "Admin session expired. Please re-login.", variant: "destructive" });
        return false;
      }
      const session = JSON.parse(stored);
      const sessionToken = session.token;
      if (!sessionToken) {
        toast({ title: "Error", description: "Admin session expired. Please re-login.", variant: "destructive" });
        return false;
      }

      const orderData = getOrderData();
      const { data, error } = await supabase.functions.invoke("create-manual-order", {
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: {
          ...orderData,
          order_status: orderStatus,
          discount,
          shipping,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return false;
      }

      setSavedOrderId(data.order?.id || "saved");
      return true;
    } catch (error: any) {
      console.error("Save order error:", error);
      toast({ title: "Save Failed", description: error.message || "Failed to save order to database", variant: "destructive" });
      return false;
    }
  };

  const handleDownloadInvoice = async () => {
    if (!validate()) return;
    setIsGenerating("invoice");
    try {
      const saved = await saveOrderToDb();
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
      toast({ title: saved ? "Saved & Invoice Downloaded ✅" : "Invoice Downloaded", description: `Invoice ${order.order_number} saved` });
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
      const saved = await saveOrderToDb();
      const order = getOrderData();
      await generateShippingLabelPDF(order);
      toast({ title: saved ? "Saved & Label Downloaded ✅" : "Label Downloaded", description: `Label ${order.order_number} saved` });
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
      const saved = await saveOrderToDb();
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
      toast({ title: saved ? "Saved & Documents Downloaded ✅" : "Downloads Complete", description: "Invoice and shipping label saved" });
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
    setPostOffice("");
    setPaymentMethod("cod");
    setPaymentStatus("pending");
    setOrderStatus("pending");
    setItems([{ id: crypto.randomUUID(), name: "", price: 0, quantity: 1 }]);
    setDiscount(0);
    setShipping(0);
    setSavedOrderId(null);
    setQuickFillText("");
  };

  // Quick fill parser
  const [quickFillText, setQuickFillText] = useState("");

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Delhi", "New Delhi", "Jammu and Kashmir", "Ladakh", "Chandigarh",
    "Andaman and Nicobar Islands", "Dadra and Nagar Haveli", "Daman and Diu",
    "Lakshadweep", "Puducherry"
  ];

  const parseQuickFill = () => {
    const raw = quickFillText.trim();
    if (!raw) {
      toast({ title: "Empty", description: "Paste customer details first", variant: "destructive" });
      return;
    }

    // Normalize: strip common labels like "Name:", "Phone:", "Address:", etc.
    const cleaned = raw
      .replace(/^(name|customer|full\s?name|contact|person)\s*[:=\->\|]\s*/gmi, "")
      .replace(/^(phone|mobile|mob|cell|tel|number|ph)\s*[:=\->\|]\s*/gmi, "PHONE_TAG:")
      .replace(/^(email|e-mail|mail)\s*[:=\->\|]\s*/gmi, "EMAIL_TAG:")
      .replace(/^(address|addr|shipping\s?address|delivery\s?address|street)\s*[:=\->\|]\s*/gmi, "ADDR_TAG:")
      .replace(/^(city|town|district)\s*[:=\->\|]\s*/gmi, "CITY_TAG:")
      .replace(/^(state|province)\s*[:=\->\|]\s*/gmi, "STATE_TAG:")
      .replace(/^(pin\s?code|pincode|zip\s?code|zip|postal\s?code|postal)\s*[:=\->\|]\s*/gmi, "PIN_TAG:")
      .replace(/^(country)\s*[:=\->\|]\s*/gmi, "COUNTRY_TAG:");

    const segments = cleaned.split(/\n/).map(l => l.trim()).filter(Boolean);

    const phoneRegex = /(?:\+?91[\s-]?)?(?:0)?([6-9]\d{4}[\s-]?\d{5}|\d{10})/;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const pinRegex = /\b[1-9]\d{5}\b/;

    let foundName = "";
    let foundPhone = "";
    let foundEmail = "";
    let foundPin = "";
    let foundState = "";
    let foundCity = "";
    let foundAddress: string[] = [];

    for (const seg of segments) {
      // Tagged lines
      if (seg.startsWith("PHONE_TAG:")) {
        const ph = seg.replace("PHONE_TAG:", "").trim();
        const m = ph.match(phoneRegex);
        foundPhone = m ? m[0] : ph;
        continue;
      }
      if (seg.startsWith("EMAIL_TAG:")) {
        foundEmail = seg.replace("EMAIL_TAG:", "").trim();
        continue;
      }
      if (seg.startsWith("ADDR_TAG:")) {
        foundAddress.push(seg.replace("ADDR_TAG:", "").trim());
        continue;
      }
      if (seg.startsWith("CITY_TAG:")) {
        foundCity = seg.replace("CITY_TAG:", "").trim();
        continue;
      }
      if (seg.startsWith("STATE_TAG:")) {
        foundState = seg.replace("STATE_TAG:", "").trim();
        continue;
      }
      if (seg.startsWith("PIN_TAG:")) {
        const p = seg.replace("PIN_TAG:", "").trim();
        const m = p.match(pinRegex);
        foundPin = m ? m[0] : p;
        continue;
      }
      if (seg.startsWith("COUNTRY_TAG:")) {
        setCountry(seg.replace("COUNTRY_TAG:", "").trim());
        continue;
      }

      // Auto-detect untagged lines
      if (!foundPhone && phoneRegex.test(seg) && !emailRegex.test(seg)) {
        const m = seg.match(phoneRegex);
        if (m) { foundPhone = m[0]; continue; }
      }
      if (!foundEmail && emailRegex.test(seg)) {
        const m = seg.match(emailRegex);
        if (m) { foundEmail = m[0]; continue; }
      }
      if (!foundPin && pinRegex.test(seg)) {
        const m = seg.match(pinRegex);
        if (m) foundPin = m[0];
      }
      if (!foundState) {
        const lower = seg.toLowerCase();
        for (const s of indianStates) {
          if (lower.includes(s.toLowerCase())) {
            foundState = s;
            break;
          }
        }
      }
      // Name — first text-only line
      if (!foundName && !phoneRegex.test(seg) && !emailRegex.test(seg) && !/\d{5,}/.test(seg) && seg.length < 60) {
        foundName = seg;
        continue;
      }
      if (seg !== foundName) {
        foundAddress.push(seg);
      }
    }

    // Apply parsed values
    if (foundName) setCustomerName(foundName);
    if (foundPhone) {
      const rp = foundPhone.replace(/[\s-]/g, "");
      setCustomerPhone(rp.startsWith("+91") ? rp : rp.startsWith("91") && rp.length > 10 ? `+${rp}` : `+91${rp.replace(/^0/, "")}`);
    }
    if (foundEmail) setCustomerEmail(foundEmail);
    if (foundPin) handlePinCodeChange(foundPin);
    if (foundState) setState(foundState);

    if (foundAddress.length > 0) {
      if (!foundCity && foundAddress.length >= 2) {
        const lastLine = foundAddress[foundAddress.length - 1];
        const cityCandidate = lastLine
          .replace(pinRegex, "")
          .replace(/,\s*$/, "")
          .trim()
          .split(",")
          .map(s => s.trim())
          .filter(s => !indianStates.some(st => st.toLowerCase() === s.toLowerCase()) && s.length > 0);
        if (cityCandidate.length > 0) foundCity = cityCandidate[0];
        setAddress(foundAddress.slice(0, -1).join(", "));
      } else {
        setAddress(foundAddress.join(", "));
      }
    }
    if (foundCity) setCity(foundCity);

    toast({ title: "Auto-filled!", description: "Review the parsed details below" });
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

      {/* Quick Fill */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Quick Fill — Paste Customer Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={quickFillText}
            onChange={(e) => setQuickFillText(e.target.value)}
            placeholder={"Paste any format — labeled or plain:\n\nRahul Sharma\n+91 98765 43210\n42, MG Road, Sector 5\nMumbai, Maharashtra 400001\n\nOR: Name: Rahul | Phone: 9876543210 | Address: 42 MG Road | City: Mumbai | PIN: 400001"}
            rows={5}
            className="bg-background text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={parseQuickFill} className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Auto Fill Details
            </Button>
            <Button size="sm" variant="outline" onClick={() => setQuickFillText("")}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

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
              <div>
                <Label>Order Status</Label>
                <Select value={orderStatus} onValueChange={setOrderStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
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
                  <div className="relative">
                    <Input
                      id="zipCode"
                      value={zipCode}
                      onChange={(e) => handlePinCodeChange(e.target.value)}
                      placeholder="6-digit PIN"
                      maxLength={6}
                      className={cn("mt-1", isPinLoading && "animate-pulse")}
                    />
                    {isPinLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {postOffice && (
                    <p className="text-xs text-primary mt-1 flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      {postOffice}
                    </p>
                  )}
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
                    <ProductCombobox
                      value={item.name}
                      onSelect={(product) => {
                        setItems(items.map((i) =>
                          i.id === item.id
                            ? { ...i, name: product.name, price: product.price }
                            : i
                        ));
                      }}
                      onChange={(name) => updateItem(item.id, "name", name)}
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
          <Card className={savedOrderId ? "border-green-500/50 bg-green-500/5" : ""}>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">
                {savedOrderId ? "✅ Order Saved & Generated" : "Generate Documents"}
              </CardTitle>
              {!savedOrderId && (
                <p className="text-xs text-muted-foreground">Orders are automatically saved to database</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                variant="outline"
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
                  size="sm"
                  onClick={handleDownloadInvoice}
                  disabled={!!isGenerating}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Invoice
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadLabel}
                  disabled={!!isGenerating}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Label
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

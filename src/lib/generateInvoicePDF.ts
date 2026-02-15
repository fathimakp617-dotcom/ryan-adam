import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface InvoiceData {
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
}

const formatCurrency = (amount: number): string => {
  const rounded = Math.round(Number(amount) || 0);
  return `Rs. ${rounded.toLocaleString("en-IN")}`;
};

export const generateInvoicePDF = async (data: InvoiceData): Promise<jsPDF> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors
  const goldColor: [number, number, number] = [201, 169, 98];
  const darkColor: [number, number, number] = [26, 26, 26];
  const grayColor: [number, number, number] = [136, 136, 136];

  // Header with logo
  doc.setFillColor(...darkColor);
  doc.rect(0, 0, pageWidth, 58, "F");

  // Try to load and add logo
  const logoUrl = "https://ryanadamperfume.lovable.app/lovable-uploads/eb8b7d91-8b18-4a81-a5e1-9d3f91d4f7df.png";
  
  try {
    const response = await fetch(logoUrl);
    const blob = await response.blob();
    const logoDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    // Add logo centered at the top
    const logoWidth = 50;
    const logoHeight = 18;
    doc.addImage(logoDataUrl, "PNG", (pageWidth - logoWidth) / 2, 6, logoWidth, logoHeight);
  } catch (error) {
    // Fallback to text if logo fails
    doc.setTextColor(...goldColor);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("RAYN ADAM", pageWidth / 2, 18, { align: "center" });
  }

  doc.setTextColor(...goldColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("LUXURY PERFUMES", pageWidth / 2, 28, { align: "center" });

  doc.setTextColor(180, 180, 180);
  doc.setFontSize(8);
  doc.text("RAYN ADAM PRIVATE LIMITED", pageWidth / 2, 36, { align: "center" });
  doc.text("Ward No. 21, Door No. 553/1, Kavumpadi, Pallikkal, Tirurangadi", pageWidth / 2, 43, { align: "center" });
  doc.text("Malappuram – 673634, Kerala, India | Ph: +91 99466 47442", pageWidth / 2, 50, { align: "center" });

  // Invoice title
  doc.setTextColor(...darkColor);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth / 2, 70, { align: "center" });

  // Order info box
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(15, 78, pageWidth - 30, 30, 3, 3, "F");

  doc.setTextColor(...grayColor);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Order Number", 20, 88);
  doc.text("Date", pageWidth - 20, 88, { align: "right" });

  doc.setTextColor(...goldColor);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(data.orderNumber, 20, 98);

  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "normal");
  const formattedDate = new Date(data.orderDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.text(formattedDate, pageWidth - 20, 98, { align: "right" });

  // Items table
  const tableData = data.items.map((item) => [
    item.name,
    item.quantity.toString(),
    formatCurrency(item.price),
    formatCurrency(item.price * item.quantity),
  ]);

  autoTable(doc, {
    startY: 118,
    head: [["Item", "Qty", "Unit Price", "Total"]],
    body: tableData,
    headStyles: {
      fillColor: darkColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      textColor: darkColor,
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 25, halign: "center" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
    },
    margin: { left: 15, right: 15 },
  });

  // Get the Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Totals section
  const totalsX = pageWidth - 80;
  let totalsY = finalY;

  doc.setTextColor(...grayColor);
  doc.setFontSize(10);
  doc.text("Subtotal:", totalsX, totalsY);
  doc.setTextColor(...darkColor);
  doc.text(formatCurrency(data.subtotal), pageWidth - 20, totalsY, {
    align: "right",
  });

  if (data.discount > 0) {
    totalsY += 8;
    doc.setTextColor(34, 197, 94);
    doc.text("Discount:", totalsX, totalsY);
    doc.text(`-${formatCurrency(data.discount)}`, pageWidth - 20, totalsY, {
      align: "right",
    });
  }

  totalsY += 8;
  doc.setTextColor(...grayColor);
  doc.text("Shipping:", totalsX, totalsY);
  doc.setTextColor(...darkColor);
  doc.text(
    data.shipping === 0 ? "FREE" : formatCurrency(data.shipping),
    pageWidth - 20,
    totalsY,
    { align: "right" }
  );

  totalsY += 12;
  doc.setDrawColor(...darkColor);
  doc.line(totalsX - 5, totalsY - 4, pageWidth - 15, totalsY - 4);

  doc.setTextColor(...darkColor);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Total:", totalsX, totalsY + 2);
  doc.setTextColor(...goldColor);
  doc.text(formatCurrency(data.total), pageWidth - 20, totalsY + 2, {
    align: "right",
  });

  // Shipping Address
  const addressY = totalsY + 25;
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(15, addressY, (pageWidth - 40) / 2, 45, 3, 3, "F");

  doc.setTextColor(...grayColor);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("SHIPPING ADDRESS", 20, addressY + 10);

  doc.setTextColor(...darkColor);
  doc.setFontSize(10);
  doc.text(data.customerName, 20, addressY + 20);
  doc.text(data.shippingAddress.address, 20, addressY + 27);
  doc.text(
    `${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}`,
    20,
    addressY + 34
  );
  doc.text(data.shippingAddress.country, 20, addressY + 41);

  // Payment Method
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(
    pageWidth / 2 + 5,
    addressY,
    (pageWidth - 40) / 2,
    45,
    3,
    3,
    "F"
  );

  doc.setTextColor(...grayColor);
  doc.setFontSize(9);
  doc.text("PAYMENT METHOD", pageWidth / 2 + 10, addressY + 10);

  doc.setTextColor(...darkColor);
  doc.setFontSize(10);
  const paymentLabel =
    data.paymentMethod === "cod"
      ? "Cash on Delivery"
      : data.paymentMethod === "razorpay"
      ? "Razorpay"
      : data.paymentMethod;
  doc.text(paymentLabel, pageWidth / 2 + 10, addressY + 20);

  doc.setTextColor(...grayColor);
  doc.text("Customer Email", pageWidth / 2 + 10, addressY + 32);
  doc.setTextColor(...darkColor);
  doc.text(data.customerEmail, pageWidth / 2 + 10, addressY + 40);

  // Footer
  const footerY = addressY + 60;
  doc.setDrawColor(230, 230, 230);
  doc.line(15, footerY, pageWidth - 15, footerY);

  doc.setTextColor(...grayColor);
  doc.setFontSize(9);
  doc.text("Thank you for shopping with Rayn Adam!", pageWidth / 2, footerY + 8, {
    align: "center",
  });
  doc.text(
    "For questions, contact: support@raynadamperfume.com | Ph: +91 99466 47442",
    pageWidth / 2,
    footerY + 16,
    { align: "center" }
  );
  doc.setFontSize(8);
  doc.text(
    "GSTIN: 32AAPCR2931R1ZS | TAN: CHNR06383G",
    pageWidth / 2,
    footerY + 24,
    { align: "center" }
  );
  doc.text(
    `© ${new Date().getFullYear()} Rayn Adam Private Limited. All rights reserved.`,
    pageWidth / 2,
    footerY + 32,
    { align: "center" }
  );

  return doc;
};

export const downloadInvoicePDF = async (data: InvoiceData): Promise<void> => {
  const doc = await generateInvoicePDF(data);
  doc.save(`invoice-${data.orderNumber}.pdf`);
};

// Shipping Slip PDF - A4 size, matches the ShippingSlip component design
interface ShippingLabelOrder {
  order_number: string;
  customer_name: string;
  customer_phone?: string | null;
  payment_method?: string;
  payment_status?: string;
  total?: number;
  created_at?: string;
  shipping_address: {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    pincode?: string;
    country?: string;
  };
  items?: any[];
}

export const generateShippingLabelPDF = async (order: ShippingLabelOrder): Promise<void> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  const darkColor: [number, number, number] = [0, 0, 0];
  const isPrepaid = order.payment_status === "paid" || order.payment_method !== "cod";
  const totalAmount = Math.round(order.total || 0);
  const itemCount = order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0;

  let yPos = 50;

  // Outer border
  doc.setDrawColor(0);
  doc.setLineWidth(2);
  doc.rect(margin - 10, 30, contentWidth + 20, 700);

  // Header - RAYN ADAM
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...darkColor);
  doc.text("RAYN ADAM", margin, yPos);

  yPos += 15;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("LUXURY PERFUME", margin, yPos);

  // Header divider
  yPos += 12;
  doc.setLineWidth(2);
  doc.line(margin - 10, yPos, pageWidth - margin + 10, yPos);

  // Order Info Table
  yPos += 25;
  doc.setLineWidth(2);
  doc.rect(margin, yPos - 15, contentWidth, 80);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`ORDER: ${order.order_number}`, margin + 10, yPos);

  yPos += 16;
  const orderDate = order.created_at ? new Date(order.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
  doc.text(`DATE: ${orderDate}`, margin + 10, yPos);

  yPos += 20;
  doc.setFontSize(16);
  const paymentLabel = isPrepaid ? `PREPAID : INR ${totalAmount}` : `CASH ON DELIVERY : INR ${totalAmount}`;
  
  // Payment box
  const paymentBoxWidth = doc.getTextWidth(paymentLabel) + 20;
  doc.setLineWidth(3);
  doc.rect(margin + 10, yPos - 15, paymentBoxWidth, 25);
  doc.text(paymentLabel, margin + 20, yPos);

  // Items count on the right
  doc.setFontSize(12);
  doc.text(`Items: ${itemCount}`, pageWidth - margin - 10, yPos - 35, { align: "right" });

  // Address Table
  yPos += 45;
  const addressBoxHeight = 130;
  const halfWidth = (contentWidth - 10) / 2;

  // Ship To Box
  doc.setLineWidth(2);
  doc.rect(margin, yPos, halfWidth, addressBoxHeight);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("SHIP TO", margin + 10, yPos + 20);
  doc.setLineWidth(2);
  doc.line(margin + 10, yPos + 25, margin + halfWidth - 10, yPos + 25);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  let addrY = yPos + 42;
  doc.text(order.customer_name, margin + 10, addrY);
  
  addrY += 16;
  doc.setFont("helvetica", "normal");
  const address = order.shipping_address;
  if (address?.address) {
    const lines = doc.splitTextToSize(address.address, halfWidth - 25);
    doc.text(lines, margin + 10, addrY);
    addrY += lines.length * 14;
  }
  
  const cityState = `${address?.city || ""}, ${address?.state || ""} - ${address?.zipCode || address?.pincode || ""}`;
  doc.text(cityState, margin + 10, addrY);
  addrY += 14;
  
  doc.text(address?.country || "India", margin + 10, addrY);
  addrY += 14;
  
  doc.text(`PHONE: ${order.customer_phone || "N/A"}`, margin + 10, addrY);

  // Seller Box
  const sellerX = margin + halfWidth + 10;
  doc.rect(sellerX, yPos, halfWidth, addressBoxHeight);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("SELLER", sellerX + 10, yPos + 20);
  doc.line(sellerX + 10, yPos + 25, sellerX + halfWidth - 10, yPos + 25);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  let sellerY = yPos + 42;
  doc.text("RAYN ADAM PRIVATE LIMITED", sellerX + 10, sellerY);
  
  sellerY += 16;
  doc.setFont("helvetica", "normal");
  doc.text("Ward No. 21, Door No. 553/1", sellerX + 10, sellerY);
  sellerY += 14;
  doc.text("Kavumpadi, Pallikkal, Tirurangadi", sellerX + 10, sellerY);
  sellerY += 14;
  doc.text("Malappuram, Kerala – 673634", sellerX + 10, sellerY);
  sellerY += 14;
  doc.text("PHONE: +91 99466 47442", sellerX + 10, sellerY);

  // Product Details Table
  yPos += addressBoxHeight + 20;
  
  // Table header
  doc.setFillColor(255, 255, 255);
  doc.setLineWidth(2);
  doc.rect(margin, yPos, contentWidth * 0.8, 25);
  doc.rect(margin + contentWidth * 0.8, yPos, contentWidth * 0.2, 25);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PRODUCT", margin + 10, yPos + 17);
  doc.text("QTY", margin + contentWidth * 0.8 + 10, yPos + 17);

  // Table rows
  yPos += 25;
  const items = order.items || [];
  items.forEach((item: any) => {
    doc.rect(margin, yPos, contentWidth * 0.8, 25);
    doc.rect(margin + contentWidth * 0.8, yPos, contentWidth * 0.2, 25);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(item.name || item.product_name || "Product", margin + 10, yPos + 17);
    doc.text(String(item.quantity || 1), margin + contentWidth - 30, yPos + 17, { align: "right" });
    yPos += 25;
  });

  // Total Amount Box
  yPos += 15;
  doc.setLineWidth(2);
  doc.rect(margin, yPos, contentWidth, 30);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL : INR ${totalAmount}`, pageWidth - margin - 10, yPos + 20, { align: "right" });

  // Return Address Box
  yPos += 45;
  doc.rect(margin, yPos, contentWidth, 65);
  
  doc.setFontSize(12);
  doc.text("RETURN ADDRESS", margin + 10, yPos + 18);
  doc.setLineWidth(2);
  doc.line(margin + 10, yPos + 23, margin + 120, yPos + 23);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const returnAddr = "RAYN ADAM PRIVATE LIMITED, Ward No. 21, Door No. 553/1, Kavumpadi, Pallikkal, Tirurangadi, Malappuram, Kerala – 673634, PHONE: +91 99466 47442";
  const returnLines = doc.splitTextToSize(returnAddr, contentWidth - 20);
  doc.text(returnLines, pageWidth / 2, yPos + 42, { align: "center" });

  // Footer
  yPos += 80;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("THANK YOU FOR SHOPPING", pageWidth / 2, yPos, { align: "center" });

  // Save
  doc.save(`shipping-slip-${order.order_number}.pdf`);
};

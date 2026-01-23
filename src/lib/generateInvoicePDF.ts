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
  return `₹${amount.toLocaleString("en-IN")}`;
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

// Shipping Label PDF - 4x6 inches (288 x 432 points)
interface ShippingLabelOrder {
  order_number: string;
  customer_name: string;
  customer_phone?: string | null;
  shipping_address: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  items?: any[];
}

export const generateShippingLabelPDF = async (order: ShippingLabelOrder): Promise<void> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: [288, 432], // 4x6 inches
  });

  const pageWidth = 288;
  const pageHeight = 432;

  // Colors
  const darkColor: [number, number, number] = [26, 26, 26];
  const goldColor: [number, number, number] = [168, 124, 57]; // #a87c39

  // Load and add logo
  const logoUrl = "https://ryanadamperfume.lovable.app/lovable-uploads/eb8b7d91-8b18-4a81-a5e1-9d3f91d4f7df.png";
  
  try {
    const response = await fetch(logoUrl);
    const blob = await response.blob();
    const logoDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    // Header with dark background
    doc.setFillColor(...darkColor);
    doc.rect(0, 0, pageWidth, 60, "F");

    // Add logo centered
    const logoWidth = 120;
    const logoHeight = 40;
    doc.addImage(logoDataUrl, "PNG", (pageWidth - logoWidth) / 2, 10, logoWidth, logoHeight);
  } catch (error) {
    // Fallback to text if logo fails to load
    doc.setFillColor(...darkColor);
    doc.rect(0, 0, pageWidth, 60, "F");

    doc.setTextColor(...goldColor);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("RAYN ADAM", pageWidth / 2, 28, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("LUXURY PERFUMES", pageWidth / 2, 45, { align: "center" });
  }

  // Order Number
  doc.setFillColor(248, 248, 248);
  doc.rect(0, 60, pageWidth, 35, "F");

  doc.setTextColor(...darkColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("ORDER #", 15, 80);
  doc.setFontSize(14);
  doc.text(order.order_number, 75, 80);

  // Ship To Section
  let yPos = 110;

  doc.setTextColor(136, 136, 136);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("SHIP TO:", 15, yPos);

  yPos += 20;
  doc.setTextColor(...darkColor);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(order.customer_name.toUpperCase(), 15, yPos, { maxWidth: pageWidth - 30 });

  yPos += 25;
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  const address = order.shipping_address;
  if (address?.address) {
    const addressLines = doc.splitTextToSize(address.address, pageWidth - 30);
    doc.text(addressLines, 15, yPos);
    yPos += addressLines.length * 14;
  }

  if (address?.city || address?.state) {
    doc.text(`${address.city || ""}, ${address.state || ""}`, 15, yPos);
    yPos += 16;
  }

  if (address?.pincode) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`PIN: ${address.pincode}`, 15, yPos);
    yPos += 20;
  }

  if (order.customer_phone) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Phone: ${order.customer_phone}`, 15, yPos);
    yPos += 20;
  }

  // Items count
  yPos += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 15;

  const itemCount = order.items?.length || 0;
  doc.setFontSize(10);
  doc.setTextColor(136, 136, 136);
  doc.text(`ITEMS: ${itemCount}`, 15, yPos);

  // From section at bottom
  const fromY = pageHeight - 90;
  doc.setDrawColor(200, 200, 200);
  doc.line(15, fromY - 10, pageWidth - 15, fromY - 10);

  doc.setTextColor(136, 136, 136);
  doc.setFontSize(8);
  doc.text("FROM:", 15, fromY);

  doc.setTextColor(...darkColor);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("RAYN ADAM PRIVATE LIMITED", 15, fromY + 12);
  doc.setFont("helvetica", "normal");
  doc.text("Ward No. 21, Door No. 553/1, Kavumpadi", 15, fromY + 24);
  doc.text("Pallikkal, Tirurangadi, Malappuram – 673634", 15, fromY + 36);
  doc.text("Kerala, India | Ph: +91 99466 47442", 15, fromY + 48);

  // Save
  doc.save(`shipping-label-${order.order_number}.pdf`);
};

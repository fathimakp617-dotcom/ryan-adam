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

export const generateInvoicePDF = (data: InvoiceData): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Colors
  const goldColor: [number, number, number] = [201, 169, 98];
  const darkColor: [number, number, number] = [26, 26, 26];
  const grayColor: [number, number, number] = [136, 136, 136];

  // Header
  doc.setFillColor(...darkColor);
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setTextColor(...goldColor);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("RAYN ADAM", pageWidth / 2, 22, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("LUXURY PERFUMES", pageWidth / 2, 32, { align: "center" });

  // Invoice title
  doc.setTextColor(...darkColor);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", pageWidth / 2, 60, { align: "center" });

  // Order info box
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(15, 68, pageWidth - 30, 30, 3, 3, "F");

  doc.setTextColor(...grayColor);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Order Number", 20, 78);
  doc.text("Date", pageWidth - 20, 78, { align: "right" });

  doc.setTextColor(...goldColor);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(data.orderNumber, 20, 88);

  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "normal");
  const formattedDate = new Date(data.orderDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.text(formattedDate, pageWidth - 20, 88, { align: "right" });

  // Items table
  const tableData = data.items.map((item) => [
    item.name,
    item.quantity.toString(),
    formatCurrency(item.price),
    formatCurrency(item.price * item.quantity),
  ]);

  autoTable(doc, {
    startY: 108,
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
  doc.text("Thank you for shopping with Rayn Adam!", pageWidth / 2, footerY + 10, {
    align: "center",
  });
  doc.text(
    "For questions, contact: support@raynadamperfume.com",
    pageWidth / 2,
    footerY + 18,
    { align: "center" }
  );
  doc.text(
    `© ${new Date().getFullYear()} Rayn Adam. All rights reserved.`,
    pageWidth / 2,
    footerY + 26,
    { align: "center" }
  );

  return doc;
};

export const downloadInvoicePDF = (data: InvoiceData): void => {
  const doc = generateInvoicePDF(data);
  doc.save(`invoice-${data.orderNumber}.pdf`);
};

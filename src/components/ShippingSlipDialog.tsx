import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import type { Order } from "@/hooks/useAdminData";
import ShippingSlip from "./ShippingSlip";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ShippingSlipDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShippingSlipDialog({ order, open, onOpenChange }: ShippingSlipDialogProps) {
  const slipRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!slipRef.current) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const content = slipRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shipping Slip - ${order?.order_number}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 15px;
              font-weight: bold;
              padding: 20px;
              background: white;
              color: black;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            table {
              border-collapse: collapse;
              width: 100%;
            }
            td, th {
              border: 2px solid black;
              padding: 10px;
              vertical-align: top;
            }
            .border-2 { border: 2px solid black; }
            .border-b-2 { border-bottom: 2px solid black; }
            .p-5 { padding: 20px; }
            .p-2\\.5 { padding: 10px; }
            .pb-2\\.5 { padding-bottom: 10px; }
            .pb-1\\.5 { padding-bottom: 6px; }
            .mb-4 { margin-bottom: 16px; }
            .mb-1\\.5 { margin-bottom: 6px; }
            .mt-2\\.5 { margin-top: 10px; }
            .w-full { width: 100%; }
            .w-1\\/2 { width: 50%; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .text-xl { font-size: 20px; }
            .text-base { font-size: 16px; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .inline-block { display: inline-block; }
            .align-top { vertical-align: top; }
            @media print {
              @page {
                size: A4;
                margin: 10mm;
              }
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 100);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = async () => {
    if (!slipRef.current || !order) return;

    try {
      const canvas = await html2canvas(slipRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, Math.min(imgHeight, pdfHeight - 20));
      pdf.save(`shipping-slip-${order.order_number}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Shipping Slip - {order.order_number}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="default" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="border rounded-lg overflow-hidden mt-4">
          <ShippingSlip ref={slipRef} order={order} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, Eye } from "lucide-react";
import type { Order } from "@/hooks/useAdminData";
import ShippingSlip from "./ShippingSlip";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ShippingSlipDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LABEL_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9px;
    font-weight: bold;
    background: white;
    color: black;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  table { border-collapse: collapse; width: 100%; }
  td, th { vertical-align: top; }
`;

export default function ShippingSlipDialog({ order, open, onOpenChange }: ShippingSlipDialogProps) {
  const slipRef = useRef<HTMLDivElement>(null);

  const handlePreview = () => {
    if (!slipRef.current || !order) return;
    const previewWindow = window.open("", "_blank");
    if (!previewWindow) return;

    previewWindow.document.write(`
      <!DOCTYPE html><html><head>
        <title>Preview - ${order.order_number}</title>
        <style>
          ${LABEL_STYLES}
          body { padding: 20px; background: #f5f5f5; display: flex; justify-content: center; min-height: 100vh; }
          .preview-container { background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.15); width: fit-content; }
        </style>
      </head><body>
        <div class="preview-container">${slipRef.current.innerHTML}</div>
      </body></html>
    `);
    previewWindow.document.close();
  };

  const handlePrint = () => {
    if (!slipRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html><html><head>
        <title>Shipping Slip - ${order?.order_number}</title>
        <style>
          ${LABEL_STYLES}
          @media print {
            @page { size: 10cm 15cm; margin: 0; }
            body { padding: 0; }
          }
        </style>
      </head><body>
        ${slipRef.current.innerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }, 100);
          };
        </script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = async () => {
    if (!slipRef.current || !order) return;
    try {
      const canvas = await html2canvas(slipRef.current, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      // 100mm x 150mm label
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [100, 150],
      });

      const pdfWidth = 100;
      const pdfHeight = 150;
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, Math.min(imgHeight, pdfHeight));
      pdf.save(`shipping-slip-${order.order_number}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Shipping Slip - {order.order_number}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
              <Button variant="default" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="border rounded-lg overflow-hidden mt-4 flex justify-center">
          <ShippingSlip ref={slipRef} order={order} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Printer, Loader2 } from "lucide-react";
import type { Order } from "@/hooks/useAdminData";
import ShippingSlip from "./ShippingSlip";

interface BulkShippingSlipPrintProps {
  orders: Order[];
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
  .slip-container { page-break-after: always; }
  .slip-container:last-child { page-break-after: auto; }
  table { border-collapse: collapse; width: 100%; }
  td, th { vertical-align: top; }
  @media print {
    @page { size: 100mm 150mm; margin: 0; }
    body { padding: 0; }
    .slip-container { padding: 0; }
  }
`;

export default function BulkShippingSlipPrint({ orders, open, onOpenChange }: BulkShippingSlipPrintProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    if (!containerRef.current || orders.length === 0) return;
    setIsPrinting(true);

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setIsPrinting(false);
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html><html><head>
        <title>Shipping Slips - Bulk Print</title>
        <style>${LABEL_STYLES}</style>
      </head><body>
        ${containerRef.current.innerHTML}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }, 200);
          };
        </script>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => setIsPrinting(false), 500);
  };

  if (orders.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Bulk Print - {orders.length} Labels</span>
            <Button variant="default" size="sm" onClick={handlePrint} disabled={isPrinting}>
              {isPrinting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
              Print All ({orders.length})
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div ref={containerRef} className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="slip-container border rounded-lg overflow-hidden flex justify-center">
              <ShippingSlip order={order} />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

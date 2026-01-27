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

    const content = containerRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Shipping Slips - Bulk Print</title>
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
              background: white;
              color: black;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .slip-container {
              padding: 20px;
              page-break-after: always;
            }
            .slip-container:last-child {
              page-break-after: auto;
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
            .border-black { border-color: black; }
            .p-5 { padding: 20px; }
            .p-2\\.5 { padding: 10px; }
            .pb-2\\.5 { padding-bottom: 10px; }
            .pb-1\\.5 { padding-bottom: 6px; }
            .mb-4 { margin-bottom: 16px; }
            .mb-1\\.5 { margin-bottom: 6px; }
            .mt-2\\.5 { margin-top: 10px; }
            .w-full { width: 100%; }
            .w-1\\/2 { width: 50%; }
            .w-\\[70\\%\\] { width: 70%; }
            .w-\\[30\\%\\] { width: 30%; }
            .w-\\[80\\%\\] { width: 80%; }
            .w-\\[20\\%\\] { width: 20%; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .text-xl { font-size: 20px; }
            .text-base { font-size: 16px; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .inline-block { display: inline-block; }
            .align-top { vertical-align: top; }
            .max-w-\\[800px\\] { max-width: 800px; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            .bg-white { background-color: white; }
            .text-black { color: black; }
            @media print {
              @page {
                size: A4;
                margin: 10mm;
              }
              body {
                padding: 0;
              }
              .slip-container {
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
              }, 200);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    
    setTimeout(() => setIsPrinting(false), 500);
  };

  if (orders.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Bulk Print - {orders.length} Shipping Slips</span>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handlePrint}
              disabled={isPrinting}
            >
              {isPrinting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Printer className="h-4 w-4 mr-2" />
              )}
              Print All ({orders.length})
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div ref={containerRef} className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="slip-container border rounded-lg overflow-hidden">
              <ShippingSlip order={order} />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

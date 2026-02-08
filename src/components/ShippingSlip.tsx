import { forwardRef } from "react";
import type { Order } from "@/hooks/useAdminData";

interface ShippingSlipProps {
  order: Order;
}

const ShippingSlip = forwardRef<HTMLDivElement, ShippingSlipProps>(({ order }, ref) => {
  const isPrepaid = order.payment_status === "paid" || order.payment_method !== "cod";
  const totalAmount = Math.round(order.total);

  return (
    <div
      ref={ref}
      className="bg-white text-black mx-auto"
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "9px",
        fontWeight: "bold",
        width: "10cm",
        minHeight: "15cm",
        padding: "0.4cm",
        boxSizing: "border-box",
      }}
    >
      <div style={{ border: "1.5px solid black", padding: "0.3cm", height: "100%" }}>
        {/* Header */}
        <div style={{ borderBottom: "1.5px solid black", paddingBottom: "0.2cm", marginBottom: "0.2cm" }}>
          <h1 style={{ fontSize: "16px", fontWeight: "bold", letterSpacing: "1.5px", margin: 0, fontFamily: "Georgia, serif" }}>
            RAYN ADAM
          </h1>
          <p style={{ fontSize: "7px", letterSpacing: "2px", marginTop: "1px" }}>LUXURY PERFUME</p>
        </div>

        {/* Order Info */}
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1.5px solid black" }}>
          <tbody>
            <tr>
              <td style={{ padding: "0.2cm", verticalAlign: "top", fontWeight: "bold", width: "70%", border: "1.5px solid black", fontSize: "8px" }}>
                ORDER: {order.order_number}<br />
                DATE: {new Date(order.created_at).toISOString().split("T")[0]}<br />
                <div style={{
                  fontSize: "11px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  border: "2px solid black",
                  padding: "0.2cm",
                  display: "inline-block",
                  marginTop: "0.2cm",
                }}>
                  {isPrepaid ? <>PREPAID : ₹{totalAmount}</> : <>COD : ₹{totalAmount}</>}
                </div>
              </td>
              <td style={{ padding: "0.2cm", verticalAlign: "top", fontWeight: "bold", width: "30%", textAlign: "right", border: "1.5px solid black", fontSize: "8px" }}>
                Items: {order.items.reduce((sum, item) => sum + item.quantity, 0)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Address Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.2cm" }}>
          <tbody>
            <tr>
              <td style={{ padding: "0.2cm", verticalAlign: "top", fontWeight: "bold", width: "50%", border: "1.5px solid black", fontSize: "8px" }}>
                <div style={{ fontSize: "9px", textTransform: "uppercase", borderBottom: "1.5px solid black", paddingBottom: "0.1cm", marginBottom: "0.1cm" }}>
                  SHIP TO
                </div>
                {order.customer_name}<br />
                {order.shipping_address.address}<br />
                {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.zipCode}<br />
                {order.shipping_address.country}<br />
                PH: {order.customer_phone || "N/A"}
              </td>
              <td style={{ padding: "0.2cm", verticalAlign: "top", fontWeight: "bold", width: "50%", border: "1.5px solid black", fontSize: "8px" }}>
                <div style={{ fontSize: "9px", textTransform: "uppercase", borderBottom: "1.5px solid black", paddingBottom: "0.1cm", marginBottom: "0.1cm" }}>
                  SELLER
                </div>
                RAYN ADAM PVT LTD<br />
                Ward 21, Door 553/1<br />
                Kavumpadi, Pallikkal<br />
                Tirurangadi, Malappuram<br />
                Kerala – 673634<br />
                PH: +91 99466 47442
              </td>
            </tr>
          </tbody>
        </table>

        {/* Product Details */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.2cm" }}>
          <thead>
            <tr>
              <th style={{ padding: "0.15cm 0.2cm", fontWeight: "bold", width: "80%", border: "1.5px solid black", textAlign: "left", fontSize: "8px" }}>PRODUCT</th>
              <th style={{ padding: "0.15cm 0.2cm", fontWeight: "bold", width: "20%", border: "1.5px solid black", textAlign: "right", fontSize: "8px" }}>QTY</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index}>
                <td style={{ padding: "0.15cm 0.2cm", fontWeight: "bold", border: "1.5px solid black", fontSize: "8px" }}>{item.name}</td>
                <td style={{ padding: "0.15cm 0.2cm", fontWeight: "bold", border: "1.5px solid black", textAlign: "right", fontSize: "8px" }}>{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1.5px solid black", marginTop: "0.2cm" }}>
          <tbody>
            <tr>
              <td style={{ padding: "0.15cm 0.2cm", fontWeight: "bold", textAlign: "right", fontSize: "9px" }}>
                TOTAL : ₹{totalAmount}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Return Address */}
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1.5px solid black", marginTop: "0.2cm" }}>
          <tbody>
            <tr>
              <td style={{ padding: "0.2cm", fontWeight: "bold", fontSize: "7px" }}>
                <div style={{ fontSize: "8px", textTransform: "uppercase", borderBottom: "1.5px solid black", paddingBottom: "0.1cm", marginBottom: "0.1cm" }}>
                  RETURN ADDRESS
                </div>
                <p style={{ textAlign: "center", margin: 0, lineHeight: "1.3" }}>
                  RAYN ADAM PVT LTD, Ward 21, Door 553/1, Kavumpadi, Pallikkal, Tirurangadi, Malappuram, Kerala – 673634, PH: +91 99466 47442
                </p>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div style={{ textAlign: "center", fontWeight: "bold", marginTop: "0.2cm", fontSize: "8px" }}>
          THANK YOU FOR SHOPPING
        </div>
      </div>
    </div>
  );
});

ShippingSlip.displayName = "ShippingSlip";

export default ShippingSlip;

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
      className="bg-white text-black p-5 max-w-[800px] mx-auto"
      style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "15px", fontWeight: "bold" }}
    >
      <div className="border-2 border-black p-5">
        {/* Header with Logo */}
        <div className="text-right border-b-2 border-black pb-2.5 mb-4">
          <img
            src="https://ryanadamperfume.lovable.app/lovable-uploads/eb8b7d91-8b18-4a81-a5e1-9d3f91d4f7df.png"
            alt="Rayn Adam"
            width={180}
            className="ml-auto"
            crossOrigin="anonymous"
          />
        </div>

        {/* Order Info */}
        <table className="w-full border-collapse border-2 border-black">
          <tbody>
            <tr>
              <td className="p-2.5 align-top font-bold w-[70%]">
                ORDER: {order.order_number}
                <br />
                DATE: {new Date(order.created_at).toISOString().split("T")[0]}
                <br />
                <div
                  className="text-xl font-bold uppercase border-[3px] border-black p-2.5 inline-block mt-2.5"
                >
                  {isPrepaid ? (
                    <>PREPAID : INR {totalAmount}</>
                  ) : (
                    <>CASH ON DELIVERY : INR {totalAmount}</>
                  )}
                </div>
              </td>
              <td className="p-2.5 align-top font-bold w-[30%] text-right">
                Items: {order.items.reduce((sum, item) => sum + item.quantity, 0)}
              </td>
            </tr>
          </tbody>
        </table>

        <br />

        {/* Address Table */}
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="p-2.5 align-top font-bold w-1/2 border-2 border-black">
                <div className="text-base uppercase border-b-2 border-black pb-1.5 mb-1.5">
                  SHIP TO
                </div>
                {order.customer_name}
                <br />
                {order.shipping_address.address}
                <br />
                {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.zipCode}
                <br />
                {order.shipping_address.country}
                <br />
                PHONE: {order.customer_phone || "N/A"}
              </td>
              <td className="p-2.5 align-top font-bold w-1/2 border-2 border-black">
                <div className="text-base uppercase border-b-2 border-black pb-1.5 mb-1.5">
                  SELLER
                </div>
                RAYN ADAM PRIVATE LIMITED
                <br />
                Ward No. 21, Door No. 553/1
                <br />
                Kavumpadi, Pallikkal, Tirurangadi
                <br />
                Malappuram, Kerala – 673634
                <br />
                PHONE: +91 99466 47442
              </td>
            </tr>
          </tbody>
        </table>

        <br />

        {/* Product Details */}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2.5 font-bold w-[80%] border-2 border-black text-left">PRODUCT</th>
              <th className="p-2.5 font-bold w-[20%] border-2 border-black text-right">QTY</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index}>
                <td className="p-2.5 font-bold border-2 border-black">{item.name}</td>
                <td className="p-2.5 font-bold border-2 border-black text-right">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <br />

        {/* Total Amount */}
        <table className="w-full border-collapse border-2 border-black">
          <tbody>
            <tr>
              <td className="p-2.5 font-bold text-right text-[15px]">
                TOTAL : INR {totalAmount}
              </td>
            </tr>
          </tbody>
        </table>

        <br />

        {/* Return Address */}
        <table className="w-full border-collapse border-2 border-black">
          <tbody>
            <tr>
              <td className="p-2.5 font-bold">
                <div className="text-base uppercase border-b-2 border-black pb-1.5 mb-1.5">
                  RETURN ADDRESS
                </div>
                <p className="text-center">
                  RAYN ADAM PRIVATE LIMITED, Ward No. 21, Door No. 553/1, Kavumpadi, Pallikkal, Tirurangadi, Malappuram, Kerala – 673634, PHONE: +91 99466 47442
                </p>
              </td>
            </tr>
          </tbody>
        </table>

        <br />

        {/* Footer */}
        <div className="text-center font-bold">THANK YOU FOR SHOPPING</div>
      </div>
    </div>
  );
});

ShippingSlip.displayName = "ShippingSlip";

export default ShippingSlip;

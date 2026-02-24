// Meta Pixel eCommerce event helpers
// fbq is loaded globally via index.html

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

const fbq = (...args: any[]) => {
  if (typeof window !== "undefined" && window.fbq) {
    console.log("[MetaPixel] Firing event:", args[1], args[2]);
    window.fbq(...args);
  } else {
    console.warn("[MetaPixel] fbq not available – event skipped:", args[1]);
  }
};

export const trackViewContent = (product: {
  id: string;
  name: string;
  price: number;
}) => {
  fbq("track", "ViewContent", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    value: product.price,
    currency: "INR",
  });
};

export const trackAddToCart = (product: {
  id: string;
  name: string;
  price: number;
  quantity: number;
}) => {
  fbq("track", "AddToCart", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    value: product.price * product.quantity,
    currency: "INR",
  });
};

export const trackPurchase = (order: {
  orderId: string;
  value: number;
  items: Array<{ productId?: string; id?: string; name: string; price: number; quantity: number }>;
}) => {
  fbq("track", "Purchase", {
    content_ids: order.items.map((i) => i.productId || i.id || ""),
    content_type: "product",
    value: order.value,
    currency: "INR",
    order_id: order.orderId,
    num_items: order.items.reduce((sum, i) => sum + i.quantity, 0),
  });
};

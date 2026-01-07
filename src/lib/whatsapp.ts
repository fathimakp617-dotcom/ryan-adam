// WhatsApp Business Number
export const WHATSAPP_NUMBER = "919946647442";

export const generateWhatsAppLink = (productName: string, productPrice: string) => {
  const message = encodeURIComponent(
    `Hi! I'm interested in purchasing:\n\n` +
    `🌸 *${productName}*\n` +
    `💰 Price: ${productPrice}\n\n` +
    `Please let me know how to proceed with the order.`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
};

export const generateWhatsAppLinkSimple = () => {
  const message = encodeURIComponent(
    `Hi! I'm interested in your perfume collection. Please share more details.`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
};

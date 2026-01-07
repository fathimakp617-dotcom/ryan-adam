// WhatsApp Business Number - Update this with your actual WhatsApp number
export const WHATSAPP_NUMBER = "919876543210"; // Format: country code + number without + or spaces

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

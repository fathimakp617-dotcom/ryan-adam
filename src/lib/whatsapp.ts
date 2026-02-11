// WhatsApp Business Number
export const WHATSAPP_NUMBER = "919946647442";

export const generateWhatsAppLink = (productName: string, productPrice: string) => {
  const message = encodeURIComponent(
    `Assalamu Alaikum! ✨\n\n` +
    `I'd love to purchase this exquisite fragrance:\n\n` +
    `🌹 *${productName}*\n` +
    `💎 Price: ${productPrice}\n\n` +
    `Kindly assist me with placing the order. JazakAllah Khair 🤍`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
};

export const generateWhatsAppLinkSimple = () => {
  const message = encodeURIComponent(
    `Hi! I'm interested in your perfume collection. Please share more details.`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
};

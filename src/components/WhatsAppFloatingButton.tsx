import { memo } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { generateWhatsAppLinkSimple } from "@/lib/whatsapp";

const WhatsAppFloatingButton = memo(() => {
  const { pathname } = useLocation();

  if (pathname.startsWith("/admin") || pathname.startsWith("/shipping")) {
    return null;
  }

  return (
    <a
      href={generateWhatsAppLinkSimple()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:shadow-[0_0_20px_rgba(37,211,102,0.5)] hover:scale-110 transition-all duration-300"
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
});

WhatsAppFloatingButton.displayName = "WhatsAppFloatingButton";

export default WhatsAppFloatingButton;

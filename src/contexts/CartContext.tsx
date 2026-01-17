import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product } from "@/data/products";

export interface CartItem {
  product: Product;
  quantity: number;
}

// Bulk discount tiers
export const BULK_DISCOUNT_TIERS = [
  { minQty: 100, discountPercent: 30, label: "100+ pieces" },
  { minQty: 50, discountPercent: 20, label: "50+ pieces" },
  { minQty: 25, discountPercent: 10, label: "25+ pieces" },
] as const;

export const getBulkDiscountPercent = (totalQuantity: number): number => {
  for (const tier of BULK_DISCOUNT_TIERS) {
    if (totalQuantity >= tier.minQty) {
      return tier.discountPercent;
    }
  }
  return 0;
};

export const getNextBulkTier = (totalQuantity: number): { neededQty: number; discountPercent: number } | null => {
  // Find the next tier the customer hasn't reached yet
  const sortedTiers = [...BULK_DISCOUNT_TIERS].sort((a, b) => a.minQty - b.minQty);
  for (const tier of sortedTiers) {
    if (totalQuantity < tier.minQty) {
      return { neededQty: tier.minQty - totalQuantity, discountPercent: tier.discountPercent };
    }
  }
  return null; // Already at max tier
};

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  buyNow: (product: Product, quantity?: number) => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  totalItems: number;
  totalPrice: number;
  bulkDiscountPercent: number;
  bulkDiscountAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setIsOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setItems([]);
  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const buyNow = (product: Product, quantity = 1) => {
    setItems([{ product, quantity }]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  
  const bulkDiscountPercent = getBulkDiscountPercent(totalItems);
  const bulkDiscountAmount = Math.round(totalPrice * (bulkDiscountPercent / 100));

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        buyNow,
        isOpen,
        openCart,
        closeCart,
        totalItems,
        totalPrice,
        bulkDiscountPercent,
        bulkDiscountAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};

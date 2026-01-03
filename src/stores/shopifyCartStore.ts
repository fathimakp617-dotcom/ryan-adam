import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ShopifyCartItem, ShopifyProduct, createStorefrontCheckout } from '@/lib/shopify';

interface ShopifyCartStore {
  items: ShopifyCartItem[];
  isLoading: boolean;
  checkoutUrl: string | null;
  
  // Actions
  addItem: (product: ShopifyProduct, variant: ShopifyProduct['node']['variants']['edges'][0]['node']) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  setLoading: (loading: boolean) => void;
  createCheckout: () => Promise<string | null>;
  
  // Computed
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useShopifyCartStore = create<ShopifyCartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      checkoutUrl: null,

      addItem: (product, variant) => {
        const { items } = get();
        const existingItem = items.find(i => i.variantId === variant.id);
        
        if (existingItem) {
          set({
            items: items.map(i =>
              i.variantId === variant.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          });
        } else {
          const newItem: ShopifyCartItem = {
            product,
            variantId: variant.id,
            variantTitle: variant.title,
            price: variant.price,
            quantity: 1,
            selectedOptions: variant.selectedOptions || []
          };
          set({ items: [...items, newItem] });
        }
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        
        set({
          items: get().items.map(item =>
            item.variantId === variantId ? { ...item, quantity } : item
          )
        });
      },

      removeItem: (variantId) => {
        set({
          items: get().items.filter(item => item.variantId !== variantId)
        });
      },

      clearCart: () => {
        set({ items: [], checkoutUrl: null });
      },

      setLoading: (isLoading) => set({ isLoading }),

      createCheckout: async () => {
        const { items, setLoading } = get();
        if (items.length === 0) return null;

        setLoading(true);
        try {
          const checkoutUrl = await createStorefrontCheckout(items);
          set({ checkoutUrl });
          return checkoutUrl;
        } catch (error) {
          console.error('Failed to create checkout:', error);
          return null;
        } finally {
          setLoading(false);
        }
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((sum, item) => 
          sum + (parseFloat(item.price.amount) * item.quantity), 0
        );
      }
    }),
    {
      name: 'shopify-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

import { useQuery } from '@tanstack/react-query';
import { fetchShopifyProducts, fetchShopifyProductByHandle, ShopifyProduct } from '@/lib/shopify';

export function useShopifyProducts(first: number = 50, query?: string) {
  return useQuery({
    queryKey: ['shopify-products', first, query],
    queryFn: () => fetchShopifyProducts(first, query),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useShopifyProductByHandle(handle: string) {
  return useQuery({
    queryKey: ['shopify-product', handle],
    queryFn: () => fetchShopifyProductByHandle(handle),
    enabled: !!handle,
    staleTime: 5 * 60 * 1000,
  });
}

// Convert Shopify product to local Product format for backward compatibility
export function shopifyToLocalProduct(shopifyProduct: ShopifyProduct['node']) {
  const firstImage = shopifyProduct.images.edges[0]?.node;
  const firstVariant = shopifyProduct.variants.edges[0]?.node;
  
  return {
    id: shopifyProduct.handle,
    name: shopifyProduct.title,
    tagline: '',
    description: shopifyProduct.description,
    story: shopifyProduct.description,
    price: parseFloat(firstVariant?.price.amount || '0'),
    category: 'Unisex',
    size: '100ml',
    image: firstImage?.url || '',
    gallery: shopifyProduct.images.edges.map(e => e.node.url),
    notes: {
      top: [],
      heart: [],
      base: []
    },
    ingredients: [],
    concentration: 'Eau de Parfum',
    longevity: '8-10 hours',
    sillage: 'Moderate',
    season: ['All Seasons'],
    occasion: ['Daily Wear']
  };
}

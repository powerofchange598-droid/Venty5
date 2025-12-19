import { User, Product } from '../types';
import { mockProducts } from '../data/mockData';

export const subscribeProducts = (onProducts: (products: Product[]) => void, merchantSlug?: string) => {
  // Fallback to mock data since Firestore is not configured
  // In a real app with Firestore, we would initialize it here or import from a config file
  setTimeout(() => {
    if (merchantSlug) {
        onProducts(mockProducts.filter(p => p.merchantInfo?.slug === merchantSlug));
    } else {
        onProducts(mockProducts);
    }
  }, 0);
  
  return () => {};
};

export const createProduct = async (user: User, data: Partial<Product> & { status?: 'published' | 'draft' }) => {
    // Mock implementation
    return { ok: true, id: 'mock-new-product-' + Date.now() };
};


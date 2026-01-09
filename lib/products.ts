import { User, Product, Merchant } from '../types';
import { api } from './api';

export const subscribeProducts = (onProducts: (products: Product[]) => void, merchantSlug?: string) => {
  let cancelled = false;
  (async () => {
    try {
      const res = merchantSlug ? await api.listMerchantProducts(merchantSlug) : await api.listAllProducts();
      const items = res.ok && Array.isArray((res.data as any)?.items) ? ((res.data as any).items as Product[]) : [];
      if (!cancelled) onProducts(items);
    } catch {
      if (!cancelled) onProducts([]);
    }
  })();
  return () => { cancelled = true; };
};

export const createProduct = async (user: User, data: Partial<Product> & { status?: 'published' | 'draft' }) => {
  if (user.accountType === 'merchant') {
    await api.setRole('merchant');
  }
  let slug = user.merchantProfile?.slug;
  if (!slug && user.email) {
      slug = user.email.replace(/[^a-z0-9]/gi, '-');
  }
  if (!slug) return { ok: false, status: 400, error: 'merchant_slug_missing' } as any;
  const payload = {
    ...data,
    status: data.status || 'draft',
    ownerId: user.id,
    ownerName: user.name,
    condition: (data as any).condition || 'New',
    created_at: new Date().toISOString(),
  };
  try {
    let res = await api.createMerchantProduct(slug, payload);
    if (!res.ok && (res.status === 404) && ((res.data as any)?.error === 'merchant_not_found')) {
      const bootstrap = {
        storeName: user.merchantProfile?.brandName || user.name,
        ownerId: user.id,
        email: user.email,
        storeStatus: 'active'
      };
      const up = await api.updateMerchant(slug, bootstrap);
      if (up.ok) {
        res = await api.createMerchantProduct(slug, payload);
      }
    }
    return res;
  } catch (e: any) {
    return { ok: false, status: 0, error: e?.message || 'network_error' } as any;
  }
};

export const fetchMerchantBySlug = async (slug: string): Promise<Merchant | null> => {
  const res = await api.getMerchantBySlug(slug);
  if (res.ok && (res.data as any)?.merchant) return (res.data as any).merchant as Merchant;
  return null;
};

export const fetchMerchantProducts = async (slug: string): Promise<Product[]> => {
  const res = await api.listMerchantProducts(slug);
  if (res.ok && Array.isArray((res.data as any)?.items)) return ((res.data as any).items || []) as Product[];
  return [];
};

export const fetchProductById = async (id: string): Promise<Product | null> => {
  const res = await api.getProductById(id);
  if (res.ok && (res.data as any)?.product) return (res.data as any).product as Product;
  return null;
};

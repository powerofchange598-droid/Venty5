import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, StoreConfig, Product, Merchant, Section, MerchantAd } from '../types';
import { fetchMerchantBySlug, fetchMerchantProducts } from '../lib/products';
import ProductCard from '../components/ProductCard';
import ShareModal from '../components/ShareModal';
import Card from '../components/Card';
import HorizontalScroller from '../components/HorizontalScroller';
import { ShareIcon, UserPlusIcon, CheckBadgeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';

const productCategories = [
   { id: 'all', name: 'All Products' },
   { id: 'new-arrivals', name: 'New Arrivals' },
   { id: 'best-sellers', name: 'Best Sellers' },
   { id: 'beauty-skincare', name: 'Beauty & Skincare' },
   { id: 'health-wellness', name: 'Health & Wellness' },
   { id: 'gym-fitness', name: 'Gym & Fitness' },
   { id: 'electronics-gadgets', name: 'Electronics & Gadgets' },
   { id: 'fashion-apparel', name: 'Fashion & Apparel' },
   { id: 'home-living', name: 'Home & Living' },
   { id: 'food-beverages', name: 'Food & Beverages' },
   { id: 'subscriptions-digital', name: 'Subscriptions & Digital' },
   { id: 'kids-toys', name: 'Kids & Toys' },
   { id: 'seasonal-picks', name: 'Seasonal Picks' },
];

const StoreHeader: React.FC<{ merchant: Merchant, onSearch: (term: string) => void, onShare: () => void }> = ({ merchant, onSearch, onShare }) => (
    <header className="sticky top-0 z-20 bg-bg-primary/80 backdrop-blur-sm border-b border-border-primary p-3 space-y-3">
        <div className="flex items-center justify-between gap-4">
            <Link to="/market" className="flex items-center gap-3 flex-shrink-0">
                <img src={merchant.logoUrl || ''} alt={merchant.storeName} className="w-10 h-10 rounded-full object-contain bg-white" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />
                <h1 className="font-bold text-lg truncate flex items-center">
                    {merchant.storeName}
                    {merchant.isVerified && <CheckBadgeIcon className="h-5 w-5 text-text-secondary ml-1" title="Verified Merchant" />}
                </h1>
            </Link>
            <div className="flex items-center gap-2">
                 <button onClick={onShare} className="p-2 rounded-full hover:bg-bg-tertiary transition-colors">
                    <ShareIcon className="h-6 w-6" />
                </button>
                 <button className="p-2 rounded-full hover:bg-bg-tertiary transition-colors">
                    <UserPlusIcon className="h-6 w-6" />
                </button>
            </div>
        </div>
        <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
            <input 
                type="text" 
                placeholder="Search in this store..." 
                onChange={(e) => onSearch(e.target.value)}
                className="w-full bg-bg-secondary border border-border-primary rounded-lg p-2 pl-10 focus:outline-none focus:ring-2 focus:ring-text-primary"
            />
        </div>
    </header>
);

const CategoryScroller: React.FC<{ activeCategory: string, onSelectCategory: (id: string) => void }> = ({ activeCategory, onSelectCategory }) => (
    <nav className="sticky top-[125px] z-10 border-b border-border-primary bg-bg-primary">
        <HorizontalScroller>
            <div className="flex gap-2 p-2">
                {productCategories.map(cat => (
                    <button 
                        key={cat.id} 
                        onClick={() => onSelectCategory(cat.id)}
                        className={`relative px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-colors snap-start hover:bg-bg-tertiary ${activeCategory === cat.id ? 'store-category-active' : 'bg-transparent text-text-primary'}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
        </HorizontalScroller>
    </nav>
);

const StoreFooter: React.FC<{ merchant: Merchant }> = ({ merchant }) => {
    const FacebookIcon = () => <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"></path></svg>;
    const InstagramIcon = () => <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.069-1.645-.069-4.85s.011-3.584.069-4.85c.149-3.225 1.664 4.771 4.919-4.919 1.266.058 1.644.07 4.85.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.059-1.281.073 1.689.073-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.281-.059-1.689-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path></svg>;
    const TwitterIcon = () => <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-.424.727-.666 1.561-.666 2.477 0 1.645.838 3.099 2.112 3.957-.778-.025-1.503-.238-2.143-.593v.064c0 2.298 1.634 4.215 3.799 4.658-.396.108-.813.165-1.246.165-.305 0-.6-.03-.892-.086.604 1.884 2.353 3.258 4.436 3.295-1.621 1.272-3.666 2.029-5.884 2.029-.383 0-.761-.022-1.135-.067 2.099 1.353 4.599 2.143 7.282 2.143 8.733 0 13.52-7.243 13.52-13.52 0-.206-.005-.411-.013-.615.928-.67 1.733-1.512 2.37-2.457z"></path></svg>;

    const socialIcons = { facebook: <FacebookIcon/>, instagram: <InstagramIcon/>, twitter: <TwitterIcon/> };

    return (
        <footer className="p-6 mt-6 border-t border-border-primary bg-bg-primary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
                <div>
                    <h3 className="font-bold text-lg mb-2 flex items-center justify-center md:justify-start">
                        <span>{merchant.storeName}</span>
                        {merchant.isVerified && <CheckBadgeIcon className="h-5 w-5 text-text-secondary ml-1" title="Verified Merchant" />}
                    </h3>
                    <p className="text-sm opacity-80">{merchant.storeDescription || ''}</p>
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-2">Customer Service</h3>
                    <ul className="space-y-1 text-sm opacity-80">
                        <li><Link to="#" className="hover:underline">Contact Us</Link></li>
                        <li><Link to="#" className="hover:underline">Shipping Policy</Link></li>
                        <li><Link to="#" className="hover:underline">Refund Policy</Link></li>
                        <li><Link to="#" className="hover:underline">Terms of Service</Link></li>
                    </ul>
                </div>
                 <div>
                    <h3 className="font-bold text-lg mb-2">Follow Us</h3>
                    <div className="flex justify-center md:justify-start space-x-4">
                        {merchant.socialLinks?.map(link => (
                            <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100">{socialIcons[link.platform]}</a>
                        ))}
                    </div>
                </div>
            </div>
             <div className="text-center text-xs opacity-60 mt-8 pt-4 border-t border-border-primary">
                &copy; {new Date().getFullYear()} {merchant.storeName}. Powered by Venty.
            </div>
        </footer>
    )
}

const StoreAdRenderer: React.FC<{ ad: MerchantAd; user: User; merchantProducts: Product[] }> = ({ ad, user, merchantProducts }) => {
    switch (ad.adType) {
        case 'video':
            return (
                <div className="w-full my-4">
                    <Card>
                        <video src={ad.content.videoUrl} controls autoPlay muted loop playsInline className="w-full rounded-lg aspect-video bg-black"></video>
                        {ad.content.caption && <p className="font-semibold mt-2 p-2">{ad.content.caption}</p>}
                    </Card>
                </div>
            );
        case 'banner':
            return (
                 <div className="w-full my-4">
                    {ad.content.link ? (
                        <Link to={ad.content.link}>
                            <img src={ad.content.imageUrl || ''} alt={ad.content.caption || 'Advertisement'} className="w-full rounded-lg" />
                        </Link>
                    ) : (
                        <img src={ad.content.imageUrl || ''} alt={ad.content.caption || 'Advertisement'} className="w-full rounded-lg" />
                    )}
                </div>
            );
        case 'carousel':
            return (
                <div className="w-full my-4 col-span-2 md:col-span-3">
                <Card>
                        <HorizontalScroller>
                             <div className="flex gap-4 p-2">
                                {(ad.content.carouselImages || []).map((img, i) => (
                                    <img key={i} src={img || ''} alt={`Ad slide ${i+1}`} className="w-64 h-40 object-cover rounded-lg snap-center"/>
                                ))}
                             </div>
                     </HorizontalScroller>
                     {ad.content.caption && <p className="font-semibold mt-2 p-2">{ad.content.caption}</p>}
                 </Card>
                </div>
            );
        case 'product':
            const adProduct = merchantProducts.find(p => p.id === ad.content.productId);
            if (!adProduct) return null;
            return (
                <div>
                    <ProductCard product={adProduct} user={user} isAd={true} />
                </div>
            );
        default:
            return null;
    }
}

interface MerchantStoreScreenProps {
    user: User;
    ads: MerchantAd[];
}

const MerchantStoreScreen: React.FC<MerchantStoreScreenProps> = ({ user, ads }) => {
    const { t } = useTranslation();
    const { merchantSlug } = useParams<{ merchantSlug: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState('');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [priceMin, setPriceMin] = useState<string>('');
    const [priceMax, setPriceMax] = useState<string>('');
    const [inStockOnly, setInStockOnly] = useState<boolean>(false);
    const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'newest' | 'oldest' | 'discount'>('recommended');

    const activeCategory = searchParams.get('category') || 'all';
    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [merchantProducts, setMerchantProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!merchantSlug) return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        setMerchant(null);
        setMerchantProducts([]);
        Promise.resolve().then(async () => {
            const m = await fetchMerchantBySlug(merchantSlug);
            if (cancelled) return;
            if (!m) {
                setError('not_found');
                setLoading(false);
                return;
            }
            setMerchant(m);
            const p = await fetchMerchantProducts(merchantSlug);
            if (cancelled) return;
            setMerchantProducts(Array.isArray(p) ? p : []);
            setLoading(false);
        });
        return () => { cancelled = true; };
    }, [merchantSlug]);

    const merchantAds = useMemo(() => {
        if (!merchant) return [];
        return ads.filter(ad => ad.merchantId === merchant.id && ad.status === 'active');
    }, [ads, merchant]);

    const displayAds = useMemo(() => {
        return merchantAds.filter(ad => ad.adType === 'banner' || ad.adType === 'video' || ad.adType === 'carousel');
    }, [merchantAds]);

    const productsWithAds = useMemo(() => {
        const isActiveStore = !!merchant && merchant.storeStatus !== 'inactive';
        const productAds = merchantAds
            .filter(ad => ad.adType === 'product')
            .map(ad => {
                const product = merchantProducts.find(p => p.id === ad.content.productId);
                if (!product) return null;
                if (product.status && product.status === 'draft') return null;
                return { ...product, isAd: true };
            })
            .filter((p): p is Product & { isAd: true } => p !== null);

        let regularProducts = merchantProducts
            .filter(p => !p.status || p.status === 'published')
            .filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

        const min = priceMin ? Number(priceMin) : undefined;
        const max = priceMax ? Number(priceMax) : undefined;
        regularProducts = regularProducts.filter(p => {
            const withinMin = min === undefined || p.price >= min;
            const withinMax = max === undefined || p.price <= max;
            const stockOk = !inStockOnly || (Number(p.stock || 0) > 0);
            return withinMin && withinMax && stockOk;
        });

        const categoryData = productCategories.find(c => c.id === activeCategory);
        if (categoryData && activeCategory !== 'all') {
             if (categoryData.id === 'new-arrivals') {
                regularProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            } else if (categoryData.id === 'best-sellers') {
                regularProducts.sort((a, b) => (b.merchantInfo?.rating || 0) - (a.merchantInfo?.rating || 0));
            } else {
                regularProducts = regularProducts.filter(p => 
                    p.category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-') === categoryData.id
                );
            }
        }
        
        if (sortBy === 'price_asc') {
            regularProducts.sort((a, b) => Number(a.price) - Number(b.price));
        } else if (sortBy === 'price_desc') {
            regularProducts.sort((a, b) => Number(b.price) - Number(a.price));
        } else if (sortBy === 'newest') {
            regularProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else if (sortBy === 'oldest') {
            regularProducts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        } else if (sortBy === 'discount') {
            regularProducts.sort((a, b) => {
                const adisc = a.originalPrice ? (Number(a.originalPrice) - Number(a.price)) : 0;
                const bdisc = b.originalPrice ? (Number(b.originalPrice) - Number(b.price)) : 0;
                return bdisc - adisc;
            });
        }
        
        if (!isActiveStore) return [];
        return [...productAds, ...regularProducts.filter(p => !productAds.some(ap => ap.id === p.id))];

    }, [merchantAds, merchantProducts, searchTerm, activeCategory, priceMin, priceMax, inStockOnly, sortBy, merchant]);

    if (!merchant) {
        return <div className="p-8 text-center">Sorry, we couldn't find this merchant.</div>;
    }

    const handleSelectCategory = (id: string) => {
        if (id === 'all') {
            searchParams.delete('category');
        } else {
            searchParams.set('category', id);
        }
        setSearchParams(searchParams);
    };

    if (loading) {
        return (
            <div className="bg-bg-primary text-text-primary min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl font-semibold">Loading store...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-bg-primary text-text-primary min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl font-semibold">{error === 'not_found' ? 'Store not found' : 'Unable to load store'}</p>
                    <p className="opacity-70 mt-2">Please try again later.</p>
                </div>
            </div>
        );
    }

    if (!merchant) {
        return (
            <div className="bg-bg-primary text-text-primary min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl font-semibold">Store not found</p>
                </div>
            </div>
        );
    }

    const shareUrl = `${window.location.origin}${window.location.pathname}${window.location.hash}`;
    const activeCategoryName = productCategories.find(c => c.id === activeCategory)?.name || 'Store';
    const shareTitle = activeCategory === 'all' ? `Share "${merchant.storeName}"` : `Share "${activeCategoryName}"`;
    const shareText = `Check out ${merchant.storeName} on Venty! Great deals available.`;

    return (
        <div className={`bg-bg-primary text-text-primary min-h-screen`}>
            {isShareModalOpen && (
                <ShareModal
                    title={shareTitle}
                    subtitle="Share this store with your friends"
                    text={shareText}
                    url={shareUrl}
                    onClose={() => setIsShareModalOpen(false)}
                />
            )}

            <StoreHeader merchant={merchant} onSearch={setSearchTerm} onShare={() => setIsShareModalOpen(true)} />
            <CategoryScroller activeCategory={activeCategory} onSelectCategory={handleSelectCategory} />

            <main className="p-4">
                <Card className="!p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="flex items-center gap-2">
                            <input type="number" min="0" placeholder="Min" value={priceMin} onChange={e => setPriceMin(e.target.value)} className="w-full p-2 bg-bg-secondary rounded-lg border border-bg-tertiary" />
                            <span className="opacity-60">-</span>
                            <input type="number" min="0" placeholder="Max" value={priceMax} onChange={e => setPriceMax(e.target.value)} className="w-full p-2 bg-bg-secondary rounded-lg border border-bg-tertiary" />
                        </div>
                        <div className="flex items-center">
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)} />
                                <span>In Stock</span>
                            </label>
                        </div>
                        <div className="md:col-span-2">
                            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="w-full p-2 bg-bg-secondary rounded-lg border border-bg-tertiary">
                                <option value="recommended">Sort: Recommended</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                                <option value="discount">Best Discount</option>
                            </select>
                        </div>
                    </div>
                </Card>
                {displayAds.length > 0 && (
                    <div className="mb-6 space-y-6">
                        {displayAds.map(ad => (
                            <StoreAdRenderer key={ad.id} ad={ad} user={user} merchantProducts={merchantProducts} />
                        ))}
                    </div>
                )}

                <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`}>
                    {productsWithAds.map((product, index) => (
                        <div key={`${product.id}-${index}`} style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}>
                            <ProductCard product={product} user={user} isAd={(product as any).isAd || false} />
                        </div>
                    ))}
                </div>

                 {productsWithAds.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-2xl font-semibold">No products found</p>
                        <p className="opacity-70 mt-2">Try adjusting your search or category filters.</p>
                    </div>
                )}
            </main>
            
            <StoreFooter merchant={merchant} />
        </div>
    );
};

export default MerchantStoreScreen;

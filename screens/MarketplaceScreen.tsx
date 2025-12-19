
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, User, MerchantAd } from '../types';
import { subscribeProducts } from '../lib/products';
import { ShoppingCartIcon, MagnifyingGlassIcon, HeartIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import PageLayout from '../components/PageLayout';
import ProductCard from '../components/ProductCard';
import { useCart } from '../hooks/useCart';
import { useFavourites } from '../hooks/useFavourites';
import VentyButton from '../components/VentyButton';
import HorizontalScroller from '../components/HorizontalScroller';
import AdCarousel from '../components/ads/AdCarousel';
import Card from '../components/Card';

const PRODUCTS_PER_PAGE = 8; // Adjusted for 2-col grid on mobile

type SortOption = 'popular' | 'price-asc' | 'price-desc' | 'newest';
type FilterOption = 'forYou' | 'new' | 'trending' | 'offers' | 'electronics' | 'under-500';

const filters: { id: FilterOption, name: string }[] = [
    { id: 'forYou', name: 'For You' },
    { id: 'new', name: 'New' },
    { id: 'trending', name: 'Trending' },
    { id: 'offers', name: 'Offers' },
    { id: 'electronics', name: 'Electronics' },
    { id: 'under-500', name: 'Under 500' },
];

const HeaderIcons: React.FC = () => {
    const { items } = useCart();
    const { favourites } = useFavourites();
    const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const favouritesCount = favourites.length;

    return (
        <div className="flex items-center space-x-2">
            <Link to="/favourites" className="relative p-2 rounded-full hover:bg-bg-tertiary transition-colors">
                <HeartIcon className="h-6 w-6 text-feedback-error" />
                {favouritesCount > 0 && (
                    <span className="absolute -top-1 -right-1 block h-4 w-4 rounded-full bg-feedback-error text-white text-[10px] flex items-center justify-center border-2 border-bg-primary">
                        {favouritesCount}
                    </span>
                )}
            </Link>
            <Link to="/cart" className="relative p-2 rounded-full hover:bg-bg-tertiary transition-colors">
                <ShoppingCartIcon className="h-6 w-6 text-brand-primary" />
                {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 block h-4 w-4 rounded-full bg-feedback-error text-white text-[10px] flex items-center justify-center border-2 border-bg-primary">
                        {cartCount}
                    </span>
                )}
            </Link>
        </div>
    );
};

// Removed stock cards section


interface MarketplaceScreenProps {
    user: User;
    ads: MerchantAd[];
}

const MarketplaceScreen: React.FC<MarketplaceScreenProps> = ({ user, ads }) => {
    const { t } = useTranslation();
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterOption>('forYou');
    const [sortOption, setSortOption] = useState<SortOption>('popular');
    const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
    
    const displayAds = useMemo(() => ads.filter(ad => ad.status === 'active'), [ads]);

    useEffect(() => {
        const unsub = subscribeProducts(setProducts);
        return () => { try { unsub && unsub(); } catch {} };
    }, []);
    
    const filteredProducts = useMemo(() => {
        let processedProducts = [...products].filter(p => 
            p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.merchant.toLowerCase().includes(searchTerm.toLowerCase())
        );

        switch(activeFilter) {
            case 'new': processedProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
            case 'trending': processedProducts = processedProducts.filter(p => p.isTrending); break;
            case 'offers': processedProducts = processedProducts.filter(p => p.isHotDeal || p.originalPrice); break;
            case 'electronics': processedProducts = processedProducts.filter(p => p.category === 'Electronics & Gadgets'); break;
            case 'under-500': processedProducts = processedProducts.filter(p => p.price < 500); break;
            default: processedProducts.sort((a, b) => (b.merchantInfo?.rating || 0) - (a.merchantInfo?.rating || 0)); break;
        }

        switch(sortOption) {
            case 'price-asc': processedProducts.sort((a, b) => a.price - b.price); break;
            case 'price-desc': processedProducts.sort((a, b) => b.price - a.price); break;
            case 'newest': processedProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
            default: break;
        }
        return processedProducts;

    }, [products, activeFilter, sortOption, searchTerm]);

    const visibleProducts = useMemo(() => {
        return filteredProducts.slice(0, visibleCount);
    }, [filteredProducts, visibleCount]);

    const hasMoreProducts = useMemo(() => {
        return visibleCount < filteredProducts.length;
    }, [filteredProducts, visibleCount]);

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + PRODUCTS_PER_PAGE);
    };
    
    const handleFilterClick = (filterId: FilterOption) => {
        setActiveFilter(filterId);
        setVisibleCount(PRODUCTS_PER_PAGE);
    };

    return (
        <PageLayout title="Venty Store" rightAccessory={<HeaderIcons />}>
            <div className="space-y-4 md:space-y-6">
                {/* Controls */}
                <div className="px-4 pt-2 space-y-4">
                    <div className="relative flex items-center">
                        <MagnifyingGlassIcon className="absolute left-4 h-5 w-5 text-text-tertiary" />
                        <input 
                            type="text" 
                            placeholder="Search products..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="w-full p-3 pl-12 pr-4 bg-bg-secondary rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary shadow-sm"
                        />
                    </div>

                    <div className="flex items-center">
                         <HorizontalScroller activeId={`filter-${activeFilter}`} className="flex-grow">
                             <div className="flex gap-2 py-1">
                                {filters.map(filter => (
                                    <button
                                        id={`filter-${filter.id}`}
                                        key={filter.id}
                                        onClick={() => handleFilterClick(filter.id)}
                                        className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-colors snap-start whitespace-nowrap ${activeFilter === filter.id ? 'bg-brand-primary text-white' : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary border border-border-primary'}`}
                                    >
                                        {filter.name}
                                    </button>
                                ))}
                            </div>
                        </HorizontalScroller>
                         <div className="relative ml-2 flex-shrink-0">
                             <select 
                                 value={sortOption} 
                                 onChange={(e) => setSortOption(e.target.value as SortOption)}
                                 className="appearance-none bg-bg-secondary rounded-full pl-3 pr-8 py-2 font-semibold text-xs md:text-sm text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary border border-border-primary"
                            >
                                 <option value="popular">Popular</option>
                                 <option value="newest">Newest</option>
                                 <option value="price-asc">Low $</option>
                                 <option value="price-desc">High $</option>
                             </select>
                             <AdjustmentsHorizontalIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none"/>
                         </div>
                    </div>
                </div>
                {/* Ad Carousel */}
                {displayAds.length > 0 && (
                    <div className="px-4">
                         <AdCarousel ads={displayAds} />
                    </div>
                )}
                
                {/* Product Grid */}
                <div className="px-4 pb-4">
                     <motion.div 
                        layout 
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6"
                    >
                         <AnimatePresence>
                            {visibleProducts.map((product, index) => {
                                const isPromoted = displayAds.some(ad => ad.adType === 'product' && ad.content.productId === product.id);
                                return (
                                   <motion.div
                                        key={product.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3, delay: (index % PRODUCTS_PER_PAGE) * 0.03 }}
                                    >
                                        <ProductCard product={product} user={user} isAd={isPromoted} />
                                   </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>

                    {hasMoreProducts && (
                        <div className="text-center mt-8">
                            <VentyButton onClick={handleLoadMore} variant="secondary" className="!w-auto px-6">
                                Load More Products
                            </VentyButton>
                        </div>
                    )}

                    {filteredProducts.length === 0 && (
                        <div className="text-center py-20">
                            <h3 className="text-xl font-semibold">No Products Found</h3>
                            <p className="text-text-secondary mt-2">Try adjusting your search or filters.</p>
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
};

export default MarketplaceScreen;

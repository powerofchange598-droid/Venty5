import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, MerchantAd, Product } from '../../types';
import { mockAllMerchants, mockProducts } from '../../data/mockData';
import VentyButton from '../VentyButton';
import { useWindowSize } from '../../hooks/useWindowSize';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useLocalization } from '../../hooks/useLocalization';

const SponsorTag: React.FC<{ merchantId: string }> = ({ merchantId }) => {
    const merchant = useMemo(() => mockAllMerchants.find(m => m.userId === merchantId || m.id === merchantId), [merchantId]);
    if (!merchant) return null;
    return (
        <span className="absolute top-3 left-3 text-xs font-bold bg-black/40 text-white px-2 py-1 rounded-full backdrop-blur-sm z-10">
            Sponsored by {merchant.storeName}
        </span>
    );
};

const AdCardWrapper: React.FC<{ children: React.ReactNode; link: string; }> = ({ children, link }) => (
    <Link to={link}>
        <div className="relative ad-card-interactive bg-bg-secondary rounded-2xl shadow-lg h-full">
            {children}
        </div>
    </Link>
);

const PromotedProductAd: React.FC<{ ad: MerchantAd }> = ({ ad }) => {
    const product = useMemo(() => mockProducts.find(p => p.id === ad.content.productId), [ad.content.productId]);
    if (!product) return null;

    return (
        <AdCardWrapper link={ad.content.link}>
            <SponsorTag merchantId={ad.merchantId} />
            <div className="flex flex-col md:flex-row h-full">
                <div className="w-full md:w-1/2 h-48 md:h-full flex-shrink-0">
                    <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-6 flex flex-col justify-center">
                    <h3 className="text-xl font-bold font-serif">{product.title}</h3>
                    <p className="text-text-secondary text-sm my-2">{product.description}</p>
                    <VentyButton variant="primary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="!w-auto !py-2 !px-4 !text-sm mt-2">
                        View Offer
                    </VentyButton>
                </div>
            </div>
        </AdCardWrapper>
    );
};

const BannerAd: React.FC<{ ad: MerchantAd }> = ({ ad }) => (
    <AdCardWrapper link={ad.content.link}>
        <SponsorTag merchantId={ad.merchantId} />
        <img src={ad.content.imageUrl} alt={ad.content.caption || 'Advertisement'} className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-6 flex flex-col justify-end">
            <h3 className="text-white text-2xl font-bold font-serif">{ad.content.caption}</h3>
        </div>
    </AdCardWrapper>
);

const VideoAd: React.FC<{ ad: MerchantAd }> = ({ ad }) => (
    <AdCardWrapper link={ad.content.link}>
        <SponsorTag merchantId={ad.merchantId} />
        <video src={ad.content.videoUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/30 p-6 flex flex-col justify-end">
            <h3 className="text-white text-xl font-bold">{ad.content.caption}</h3>
        </div>
    </AdCardWrapper>
);

const CarouselAd: React.FC<{ ad: MerchantAd }> = ({ ad }) => {
     const [imageIndex, setImageIndex] = useState(0);
     const images = ad.content.carouselImages || [];

     useEffect(() => {
        const timer = setTimeout(() => {
            setImageIndex(prev => (prev + 1) % images.length);
        }, 3000);
        return () => clearTimeout(timer);
     }, [imageIndex, images.length]);

    return (
        <AdCardWrapper link={ad.content.link}>
            <SponsorTag merchantId={ad.merchantId} />
             <div className="relative w-full h-full">
                <AnimatePresence initial={false}>
                    <motion.img
                        key={imageIndex}
                        src={images[imageIndex]}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full h-full object-cover absolute inset-0"
                        loading="lazy"
                    />
                </AnimatePresence>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent p-6 flex flex-col justify-end">
                <h3 className="text-white text-xl font-bold">{ad.content.caption}</h3>
            </div>
        </AdCardWrapper>
    );
};

const FeaturedStoreAd: React.FC<{ ad: MerchantAd }> = ({ ad }) => {
    const { formatNumberEn } = useLocalization();
    const merchant = useMemo(() => mockAllMerchants.find(m => m.id === ad.merchantId || m.userId === ad.merchantId), [ad.merchantId]);
    if (!merchant) return null;

    return (
        <AdCardWrapper link={ad.content.link}>
            <SponsorTag merchantId={ad.merchantId} />
            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-bg-primary">
                 <img src={merchant.logoUrl} alt={merchant.storeName} className="w-20 h-20 rounded-full object-contain bg-white mb-4 border-4 border-bg-tertiary" loading="lazy" />
                 <h3 className="font-bold text-2xl font-serif">{merchant.storeName}</h3>
                 <p className="text-sm text-text-secondary mt-1">⭐ {merchant.rating} | {formatNumberEn(merchant.followersCount)} followers</p>
                 <VentyButton onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} variant="secondary" className="!w-auto !py-2 !px-6 !text-sm mt-4">
                    Discover Store
                </VentyButton>
            </div>
        </AdCardWrapper>
    );
};

const AdRenderer: React.FC<{ ad: MerchantAd }> = ({ ad }) => {
    switch (ad.adType) {
        case 'product': return <PromotedProductAd ad={ad} />;
        case 'banner': return <BannerAd ad={ad} />;
        case 'video': return <VideoAd ad={ad} />;
        case 'carousel': return <CarouselAd ad={ad} />;
        case 'store_feature': return <FeaturedStoreAd ad={ad} />;
        default: return null;
    }
};

const CarouselArrow: React.FC<{ direction: 'left' | 'right'; onClick: () => void; }> = ({ direction, onClick }) => (
    <button
        onClick={onClick}
        className={`arrow-btn absolute top-1/2 -translate-y-1/2 z-20 md:opacity-0 group-hover:md:opacity-100 ${direction === 'left' ? 'left-3 md:left-4' : 'right-3 md:right-4'}`}
        aria-label={direction === 'left' ? 'Previous slide' : 'Next slide'}
    >
        {direction === 'left' ? <ArrowLeftIcon className="h-5 w-5" /> : <ArrowRightIcon className="h-5 w-5" />}
    </button>
);


const AdCarousel: React.FC<{ ads: MerchantAd[] }> = ({ ads }) => {
    const [page, setPage] = useState(0);
    
    const sortedAds = useMemo(() => [...ads].sort((a, b) => b.engagementScore - a.engagementScore), [ads]);
    
    const adIndex = page % sortedAds.length;

    const paginate = useCallback((newDirection: number) => {
        setPage(prevPage => (prevPage + newDirection + sortedAds.length) % sortedAds.length);
    }, [sortedAds.length]);

    useEffect(() => {
        const interval = setInterval(() => paginate(1), 5000);
        return () => clearInterval(interval);
    }, [paginate]);

    if (sortedAds.length === 0) return null;

    return (
        <div className="relative group w-full aspect-video md:aspect-[2/1] lg:aspect-[3/1] rounded-2xl overflow-hidden">
            <AnimatePresence initial={false}>
                <motion.div
                    key={page}
                    className="w-full h-full absolute"
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -300, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, { offset, velocity }) => {
                        const swipe = Math.abs(offset.x) * velocity.x;
                        if (swipe < -10000) { paginate(1); } 
                        else if (swipe > 10000) { paginate(-1); }
                    }}
                >
                    <AdRenderer ad={sortedAds[adIndex]} />
                </motion.div>
            </AnimatePresence>
            
            <CarouselArrow direction="left" onClick={() => paginate(-1)} />
            <CarouselArrow direction="right" onClick={() => paginate(1)} />

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
                {sortedAds.map((_, i) => (
                    <button key={i} onClick={() => setPage(i)} className={`w-2 h-2 rounded-full transition-all ${i === adIndex ? 'bg-white scale-125' : 'bg-white/50'}`}></button>
                ))}
            </div>
        </div>
    );
};

export default AdCarousel;

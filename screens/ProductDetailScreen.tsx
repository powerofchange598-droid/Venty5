import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { User, Product, ProductReview, MerchantInfo } from '../types';
import { mockProducts, mockProductReviews, mockMerchantUser } from '../data/mockData';
import { filterReviewComment } from '../utils/chatHelper';
import { useLocalization } from '../hooks/useLocalization';
import { useCart } from '../hooks/useCart';
import { useToast } from '../hooks/useToast';
import PageLayout from '../components/PageLayout';
import ShareModal from '../components/ShareModal';
import Card from '../components/Card';
import VentyButton from '../components/VentyButton';
import ProductCard from '../components/ProductCard';
import { StarIcon, XMarkIcon, PencilSquareIcon, ChevronLeftIcon, ChevronRightIcon, HandThumbUpIcon, ChatBubbleOvalLeftEllipsisIcon, CheckBadgeIcon, ShareIcon } from '@heroicons/react/24/solid';
import { HandThumbUpIcon as HandThumbUpOutlineIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { safeFormatDate } from '../utils/dateUtils';


const StarRating: React.FC<{ rating: number; size?: string; className?: string }> = ({ rating, size = 'h-5 w-5', className = '' }) => (
    <div className={`flex items-center ${className}`}>
        {[...Array(5)].map((_, i) => (
            <StarIcon key={i} className={`${size} ${i < rating ? 'text-text-secondary' : 'text-gray-300 dark:text-text-tertiary'}`} />
        ))}
    </div>
);

const ReviewModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (review: { rating: number; title: string; comment: string }) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (rating === 0) { setError('Please select a rating.'); return; }
        if (comment.length < 10) { setError('Comment must be at least 10 characters long.'); return; }
        if (comment.length > 300) { setError('Comment cannot exceed 300 characters.'); return; }
        if (title.length > 60) { setError('Title cannot exceed 60 characters.'); return; }

        onSubmit({ rating, title, comment });
        onClose();
        // Reset state for next time
        setRating(0);
        setTitle('');
        setComment('');
        setError('');
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 modal-backdrop backdrop-blur-md flex justify-center items-center p-4 z-50 animate-fadeIn" onClick={onClose}>
            <Card className="w-full max-w-lg animate-cinematic-enter !bg-bg-primary" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Write a Review</h2>
                    <button onClick={onClose}><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="font-medium">Your Rating*</label>
                        <div className="flex space-x-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                                <button key={i} onClick={() => setRating(i + 1)}><StarIcon className={`h-8 w-8 transition-colors ${i < rating ? 'text-text-secondary' : 'text-gray-300 dark:text-text-tertiary hover:text-gray-400'}`} /></button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className="font-medium">Review Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Best watch ever!" className="w-full mt-1 p-2 bg-bg-secondary rounded"/>
                    </div>
                    <div>
                        <label className="font-medium">Your Comment*</label>
                        <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4} placeholder="Tell us what you thought..." className="w-full mt-1 p-2 bg-bg-secondary rounded"></textarea>
                        <p className="text-xs text-right text-text-secondary">{comment.length} / 300</p>
                    </div>
                    {error && <p className="text-feedback-error text-sm text-center">{error}</p>}
                </div>
                <div className="mt-6"><VentyButton onClick={handleSubmit} label="Submit Review" variant="primary"></VentyButton></div>
            </Card>
        </div>
    );
};

const MerchantInfoRow: React.FC<{ info: MerchantInfo }> = ({ info }) => (
    <Link to={`/shop/${info.slug}`} className="block my-4 group">
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-bg-primary group-hover:bg-bg-tertiary transition-colors">
            <img src={info.logoUrl} alt={info.name} className="w-10 h-10 rounded-full object-contain bg-white" />
            <div className="flex-grow">
                <p className="font-bold flex items-center">{info.name} {info.isVerified && <CheckBadgeIcon className="h-5 w-5 text-brand-primary ml-1"/>}</p>
                <p className="text-sm text-text-secondary">⭐ {info.rating} • {info.city}</p>
            </div>
        </div>
    </Link>
);


const ProductDetailScreen: React.FC<{ user: User }> = ({ user }) => {
    const { t } = useTranslation();
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const { formatCurrency } = useLocalization();
    const { addToCart } = useCart();
    const { showToast } = useToast();
    const [allReviews, setAllReviews] = useState<ProductReview[]>(mockProductReviews);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const product = useMemo(() => mockProducts.find(p => p.id === productId), [productId]);
    const reviews = useMemo(() => allReviews.filter(r => r.productId === productId && r.status === 'visible'), [allReviews, productId]);
    const averageRating = useMemo(() => reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0, [reviews]);

    const handleAddToCart = () => {
        if (!product) return;
        if (user.isGuest) {
            showToast("This feature is disabled in Guest Mode. Please create an account to continue.", 'warning');
            navigate('/onboarding');
            return;
        }
        if (user.accountPlan === 'family' && !user.isFamilyHead && !!user.familyId) {
            navigate('/request-purchase', { state: { product } });
        } else {
            addToCart(product);
        }
    };

    const handleBuyNow = () => {
        if (!product) return;
        if (user.isGuest) {
            showToast("This feature is disabled in Guest Mode. Please create an account to continue.", 'warning');
            navigate('/onboarding');
            return;
        }
        if (user.accountPlan === 'family' && !user.isFamilyHead && !!user.familyId) {
            navigate('/request-purchase', { state: { product } });
        } else {
            navigate('/payment', { state: { for: 'store_purchase', amount: product.price, description: product.title, productId: product.id } });
        }
    };

    const handleWriteReview = (reviewData: { rating: number; title: string; comment: string }) => {
        const { commentClean, status } = filterReviewComment(reviewData.comment);
        const newReview: ProductReview = {
            id: `rev_${Date.now()}`,
            productId: productId!,
            reviewerId: user.id,
            reviewerName: user.name,
            rating: reviewData.rating,
            title: reviewData.title,
            commentClean,
            commentRaw: reviewData.comment,
            helpful: 0,
            createdAt: new Date().toISOString(),
            status
        };
        setAllReviews(prev => [newReview, ...prev]);
        showToast(status === 'flagged' ? 'Your review has been submitted for moderation.' : 'Thank you for your review!', status === 'flagged' ? 'info' : 'success');
    };
    
    const productImages = useMemo(() => [product?.imageUrl, ...(product?.images || [])].filter(Boolean) as string[], [product]);

    const nextImage = () => setCurrentImageIndex(i => (i + 1) % productImages.length);
    const prevImage = () => setCurrentImageIndex(i => (i - 1 + productImages.length) % productImages.length);

    if (!product) {
        return <PageLayout title="Not Found"><div className="text-center p-8">Product not found.</div></PageLayout>;
    }
    
    const pageRightAccessory = (
        <button onClick={() => setIsShareModalOpen(true)} className="p-2 rounded-full hover:bg-bg-tertiary">
            <ShareIcon className="h-6 w-6 text-brand-primary" />
        </button>
    );
    
    return (
        <PageLayout title={product.title} rightAccessory={pageRightAccessory}>
            {isShareModalOpen && (
                 <ShareModal
                    title="Share this Product"
                    text={`Check out this amazing product on Venty: ${product.title}`}
                    url={window.location.href}
                    onClose={() => setIsShareModalOpen(false)}
                />
            )}
            <ReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} onSubmit={handleWriteReview} />

            <div className="p-4 lg:p-6 lg:grid lg:grid-cols-2 lg:gap-8 max-w-6xl mx-auto">
                {/* Image Gallery */}
                <div className="relative">
                    <div className="aspect-square w-full bg-bg-secondary rounded-xl overflow-hidden shadow-lg">
                        <img src={productImages[currentImageIndex]} alt={product.title} className="w-full h-full object-cover" />
                    </div>
                    {productImages.length > 1 && (
                        <>
                            <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 text-white rounded-full backdrop-blur-sm"><ChevronLeftIcon className="h-6 w-6" /></button>
                            <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 text-white rounded-full backdrop-blur-sm"><ChevronRightIcon className="h-6 w-6" /></button>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                                {productImages.map((_, i) => <div key={i} onClick={() => setCurrentImageIndex(i)} className={`w-2 h-2 rounded-full cursor-pointer ${i === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}></div>)}
                            </div>
                        </>
                    )}
                </div>

                {/* Product Details */}
                <div className="mt-6 lg:mt-0">
                    <h1 className="text-3xl font-bold font-serif">{product.title}</h1>
                    {product.merchantInfo && <p className="text-text-secondary mt-1">Sold by <Link to={`/shop/${product.merchantInfo.slug}`} className="font-semibold text-brand-primary hover:underline">{product.merchantInfo.name}</Link></p>}
                    
                    <div className="flex items-center space-x-2 mt-2">
                        <StarRating rating={averageRating} />
                        <span className="text-sm text-text-secondary">{reviews.length} {t('productDetail.reviews')}</span>
                    </div>

                    <div className="my-6">
                        <p className="text-4xl font-bold text-brand-primary">{formatCurrency(product.price)}</p>
                        {product.originalPrice && <p className="text-text-tertiary line-through">{formatCurrency(product.originalPrice)}</p>}
                    </div>

                    <p className="text-text-secondary">{product.description || t('productDetail.noDescription')}</p>

                    <div className="mt-8 flex items-center gap-3">
                        <VentyButton onClick={handleAddToCart} label={user.accountPlan === 'family' && !user.isFamilyHead ? t('purchaseRequests.requestPurchase') : t('product.addToCartCta')} variant="primary"></VentyButton>
                        <VentyButton onClick={handleBuyNow} label="Buy Now" className="!w-auto !px-6" variant="secondary"></VentyButton>
                    </div>
                </div>
            </div>

             {/* Reviews Section */}
            <div className="p-4 lg:px-6 max-w-6xl mx-auto mt-8">
                <div className="border-t border-bg-tertiary pt-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold font-serif">{t('productDetail.ratingsTitle')}</h2>
                        <VentyButton onClick={() => setIsReviewModalOpen(true)} variant="secondary" className="!w-auto !py-2 !px-4 !text-sm flex items-center gap-2">
                            <PencilSquareIcon className="h-5 w-5"/> {t('productDetail.writeReviewCta')}
                        </VentyButton>
                    </div>
                    {reviews.length > 0 ? (
                        <div className="mt-4 space-y-6">
                            {reviews.map(review => (
                                <Card key={review.id} className="!p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold">{review.reviewerName}</p>
                                            <StarRating rating={review.rating} size="h-4 w-4" className="mt-1"/>
                                        </div>
                                        <p className="text-xs text-text-secondary">{safeFormatDate(review.createdAt)}</p>
                                    </div>
                                    <h4 className="font-semibold mt-2">{review.title}</h4>
                                    <p className="text-text-secondary text-sm mt-1">{review.commentClean}</p>
                                    {review.reply && (
                                        <div className="mt-3 pt-3 border-t border-bg-tertiary bg-bg-primary p-3 rounded-lg">
                                            <p className="font-bold text-sm">Reply from {review.reply.merchantName}</p>
                                            <p className="text-sm text-text-secondary mt-1">{review.reply.comment}</p>
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-4 text-text-secondary">{t('productDetail.noReviews')}</p>
                    )}
                </div>
            </div>

        </PageLayout>
    );
};
export default ProductDetailScreen;

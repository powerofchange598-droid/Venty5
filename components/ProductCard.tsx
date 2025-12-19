import React, { useMemo, memo } from 'react';
import { Product, User } from '../types';
import { ShoppingCartIcon, StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';
import { useLocalization } from '../hooks/useLocalization';
import { useCart } from '../hooks/useCart';
import { useFavourites } from '../hooks/useFavourites';
import { useToast } from '../hooks/useToast';

interface ProductCardProps {
    product: Product;
    user: User;
    isAd?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = memo(({ product, user, isAd = false }) => {
    const navigate = useNavigate();
    const { formatCurrency } = useLocalization();
    const { addToCart } = useCart();
    const { isFavourite, toggleFavourite } = useFavourites();
    const { showToast } = useToast();

    const isFavourited = isFavourite(product.id);
    const isFamilyMember = user.accountPlan === 'family' && !user.isFamilyHead && !!user.familyId;

    const discount = product.originalPrice && product.originalPrice > product.price 
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
        : 0;

    const handleBuyNow = () => {
        if (isFamilyMember) {
            navigate('/request-purchase', { state: { product } });
            return;
        }
        navigate('/payment', { state: { for: 'store_purchase', amount: product.price, description: product.title, productId: product.id } });
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigating when clicking the button
        e.stopPropagation();
        if (user.isGuest) {
            showToast("This feature is disabled in Guest Mode. Please create an account to continue.", 'warning');
            navigate('/onboarding');
            return;
        }
        if (isFamilyMember) {
            navigate('/request-purchase', { state: { product } });
        } else {
            addToCart(product);
        }
    };
    
    const handleToggleFavourite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (user.isGuest) {
            showToast("This feature is disabled in Guest Mode. Please create an account to continue.", 'warning');
            navigate('/onboarding');
            return;
        }
        toggleFavourite(product);
    }

    return (
        <Link to={`/product/${product.id}`} className="card block group !p-0">
            <div className="relative">
                <div className="aspect-square w-full overflow-hidden rounded-t-xl">
                    <img 
                        src={product.imageUrl} 
                        alt={product.title} 
                        className="w-full h-full object-cover" 
                        loading="lazy" 
                    />
                </div>

                {isAd && (
                    <span className="absolute top-2 left-2 bg-black/40 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm z-10">
                        Promoted
                    </span>
                )}

                <button
                    onClick={handleToggleFavourite}
                    className="absolute top-2 right-2 z-10 p-1.5 bg-black/20 backdrop-blur-sm rounded-full"
                    aria-label={isFavourited ? 'Remove from favourites' : 'Add to favourites'}
                >
                    {isFavourited ? (
                        <StarSolid className="h-5 w-5 text-yellow-400" />
                    ) : (
                        <StarOutline className="h-5 w-5 text-white" />
                    )}
                </button>
            </div>
            
            <div className="p-3">
                <h3 className="font-semibold text-sm text-text-primary truncate">{product.title}</h3>
                <div className="flex justify-between items-center mt-1">
                    <div>
                        <p className="font-semibold text-text-primary">{formatCurrency(product.price)}</p>
                        {discount > 0 && (
                            <p className="text-xs text-text-tertiary line-through">{formatCurrency(product.originalPrice!)}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleAddToCart}
                            className="w-8 h-8 flex items-center justify-center bg-bg-tertiary rounded-full text-brand-primary"
                            aria-label="Add to cart"
                        >
                            <ShoppingCartIcon className="h-4 w-4" />
                        </button>
                        <button 
                            onClick={handleBuyNow}
                            className="px-3 py-1 rounded-full bg-brand-primary text-white text-xs font-semibold"
                            aria-label="Buy now"
                        >
                            Buy
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
});

export default ProductCard;

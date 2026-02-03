import { Link } from 'react-router-dom';
import { Heart, Star, ShoppingCart } from 'lucide-react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export const ProductCard = ({ product, className }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const imageUrl = product.images?.[0] || '/placeholder.svg';

  return (
    <Link
      to={`/product/${product.id}`}
      className={cn('product-card block group', className)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={cn(
            'absolute top-2 right-2 p-2 rounded-full bg-card shadow-md transition-all',
            isWishlisted ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'
          )}
        >
          <Heart className={cn('h-4 w-4', isWishlisted && 'fill-current')} />
        </button>

        {/* Sale Badge for Featured Products */}
        {product.is_featured && (
          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-md shadow-md">
            🔥 SALE
          </div>
        )}

        {/* Discount Badge */}
        {product.discount_percent > 0 && !product.is_featured && (
          <div className="deal-badge absolute top-2 left-2">
            {product.discount_percent}% OFF
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Brand/Category */}
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          {product.category?.name || 'ShopKart'}
        </p>

        {/* Product Name */}
        <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <div className="rating-badge">
              <span>{product.rating.toFixed(1)}</span>
              <Star className="h-3 w-3 fill-current" />
            </div>
            <span className="text-xs text-muted-foreground">
              ({product.review_count})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-foreground">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.mrp > product.price && (
            <>
              <span className="original-price">
                ₹{product.mrp.toLocaleString('en-IN')}
              </span>
              <span className="discount-text text-xs">
                {product.discount_percent}% off
              </span>
            </>
          )}
        </div>

        {/* COD Badge */}
        <div className="cod-badge text-[10px]">
          💵 COD Available
        </div>

        {/* Quick Add Button - Shows on hover */}
        <Button
          onClick={handleAddToCart}
          className="w-full mt-3 btn-primary-gradient opacity-0 group-hover:opacity-100 transition-opacity"
          size="sm"
        >
          <ShoppingCart className="h-4 w-4 mr-1" />
          Add to Cart
        </Button>
      </div>
    </Link>
  );
};

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
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={cn(
            'absolute top-3 right-3 p-2.5 rounded-full bg-card/90 backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-110',
            isWishlisted ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
          )}
        >
          <Heart className={cn('h-4 w-4 transition-transform duration-300', isWishlisted && 'fill-current scale-110')} />
        </button>

        {/* Sale Badge for Featured Products */}
        {product.is_featured && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg animate-pulse">
            🔥 SALE
          </div>
        )}

        {/* Discount Badge */}
        {product.discount_percent > 0 && !product.is_featured && (
          <div className="deal-badge absolute top-3 left-3 shadow-lg">
            {product.discount_percent}% OFF
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Brand/Category */}
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 font-medium">
          {product.category?.name || 'Trendra'}
        </p>

        {/* Product Name */}
        <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-2.5 min-h-[2.5rem] group-hover:text-primary transition-colors duration-300">
          {product.name}
        </h3>

        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="rating-badge shadow-sm">
              <span>{product.rating.toFixed(1)}</span>
              <Star className="h-3 w-3 fill-current" />
            </div>
            <span className="text-xs text-muted-foreground">
              ({product.review_count?.toLocaleString()})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.mrp > product.price && (
            <>
              <span className="original-price">
                ₹{product.mrp.toLocaleString('en-IN')}
              </span>
              <span className="discount-text text-xs bg-green-50 px-1.5 py-0.5 rounded">
                {product.discount_percent}% off
              </span>
            </>
          )}
        </div>

        {/* COD Badge */}
        <div className="cod-badge text-[10px] mb-3">
          💵 COD Available
        </div>

        {/* Quick Add Button - Shows on hover */}
        <Button
          onClick={handleAddToCart}
          className="w-full btn-primary-gradient opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
          size="sm"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
      </div>
    </Link>
  );
};

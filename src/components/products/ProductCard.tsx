import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, ShoppingCart, BadgeCheck, Zap } from 'lucide-react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';
import { BuyNowDialog } from '@/components/checkout/BuyNowDialog';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export const ProductCard = ({ product, className }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [buyNowOpen, setBuyNowOpen] = useState(false);
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

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBuyNowOpen(true);
  };

  const imageUrl = product.images?.[0] || '/placeholder.svg';

  return (
    <>
    <Link
      to={`/product/${product.id}`}
      className={cn('product-card block group', className)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-white">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={cn(
            'absolute top-2 right-2 p-2 rounded-full bg-card/95 shadow-sm transition-all duration-200',
            isWishlisted ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
          )}
        >
          <Heart className={cn('h-4 w-4', isWishlisted && 'fill-current')} />
        </button>

        {/* Discount Badge */}
        {product.discount_percent > 0 && (
          <div className="absolute top-2 left-2 deal-badge">
            {product.discount_percent}% OFF
          </div>
        )}
      </div>

      {/* Content - Flipkart style: compact, info-dense */}
      <div className="p-3">
        {/* Brand/Category */}
        <p className="text-[11px] text-muted-foreground font-medium mb-1">
          {product.category?.name || 'Trendra'}
        </p>

        {/* Product Name */}
        <h3 className="text-sm text-foreground line-clamp-2 mb-1.5 min-h-[2.5rem] group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <div className="rating-badge">
              <span>{product.rating.toFixed(1)}</span>
              <Star className="h-2.5 w-2.5 fill-current" />
            </div>
            <span className="text-xs text-muted-foreground">
              ({product.review_count?.toLocaleString()})
            </span>
          </div>
        )}

        {/* Price - Flipkart style */}
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-base font-bold text-foreground">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.mrp > product.price && (
            <>
              <span className="original-price text-xs">
                ₹{product.mrp.toLocaleString('en-IN')}
              </span>
              <span className="discount-text text-xs font-medium">
                {product.discount_percent}% off
              </span>
            </>
          )}
        </div>

        {/* Assured badge */}
        <div className="flex items-center gap-2 mb-2">
          <div className="assured-badge">
            <BadgeCheck className="h-3.5 w-3.5" />
            <span>Trendra Assured</span>
          </div>
        </div>

        {/* Free delivery text */}
        <p className="text-[11px] text-muted-foreground">
          Free delivery
        </p>

        {/* Quick Action Buttons - Shows on hover */}
        <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <Button
            onClick={handleAddToCart}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
            Cart
          </Button>
          <Button
            onClick={handleBuyNow}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            size="sm"
          >
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            Buy Now
          </Button>
        </div>
      </div>
    </Link>
    <BuyNowDialog
      open={buyNowOpen}
      onOpenChange={setBuyNowOpen}
      productId={product.id}
      productName={product.name}
      amount={product.price}
      quantity={1}
    />
    </>
  );
};

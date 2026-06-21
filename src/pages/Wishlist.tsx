import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { Heart, ShoppingCart, Trash2, ChevronRight } from 'lucide-react';

const WishlistPage = () => {
  const { items, removeFromWishlist, isLoading } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <Heart className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
          <h1 className="text-2xl font-bold mb-2">Please Login</h1>
          <p className="text-muted-foreground mb-6">
            Login to view and manage your wishlist
          </p>
          <Button onClick={() => navigate('/login?redirect=/wishlist')} className="btn-primary-gradient">
            Login Now
          </Button>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-5 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <Heart className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
          <h1 className="text-2xl font-bold mb-2">Your wishlist is empty</h1>
          <p className="text-muted-foreground mb-6">
            Save your favorite items to buy later
          </p>
          <Button onClick={() => navigate('/products')} className="btn-primary-gradient">
            Explore Products
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Wishlist</span>
        </div>

        <h1 className="text-2xl font-bold mb-6">
          My Wishlist ({items.length} items)
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-card rounded-lg overflow-hidden shadow-sm group"
            >
              <Link
                to={`/product/${item.product_id}`}
                className="block relative aspect-square bg-muted"
              >
                <img
                  src={item.product?.images?.[0] || '/placeholder.svg'}
                  alt={item.product?.name || 'Wishlist product'}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  aria-label="Remove from wishlist"
                  onClick={(e) => {
                    e.preventDefault();
                    removeFromWishlist(item.product_id);
                  }}
                  className="absolute top-2 right-2 p-2 bg-card rounded-full shadow-md text-destructive hover:bg-destructive hover:text-white transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                {item.product?.discount_percent && item.product.discount_percent > 0 && (
                  <div className="deal-badge absolute top-2 left-2">
                    {item.product.discount_percent}% OFF
                  </div>
                )}
              </Link>

              <div className="p-3">
                <Link
                  to={`/product/${item.product_id}`}
                  className="font-medium text-sm text-foreground line-clamp-2 hover:text-primary"
                >
                  {item.product?.name}
                </Link>

                <div className="flex items-center gap-2 mt-2">
                  <span className="font-bold text-foreground">
                    ₹{(item.product?.price ?? 0).toLocaleString('en-IN')}
                  </span>
                  {item.product && item.product.mrp > item.product.price && (
                    <span className="original-price">
                      ₹{item.product.mrp.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <Button
                  onClick={() => {
                    if (item.product) {
                      addToCart(item.product.id);
                    }
                  }}
                  className="w-full mt-3 btn-primary-gradient"
                  size="sm"
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Add to Cart
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default WishlistPage;

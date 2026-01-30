import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { Trash2, Plus, Minus, ShoppingBag, ChevronRight, Truck, Shield, Tag } from 'lucide-react';

const CartPage = () => {
  const { items, itemCount, totalAmount, removeFromCart, updateQuantity, isLoading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const deliveryFee = totalAmount >= 499 ? 0 : 40;
  const finalAmount = totalAmount + deliveryFee;

  const handleCheckout = () => {
    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }
    navigate('/checkout');
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="max-w-md mx-auto">
            <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
            <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-6">
              Looks like you haven't added anything to your cart yet
            </p>
            <Button onClick={() => navigate('/products')} className="btn-primary-gradient">
              Start Shopping
            </Button>
          </div>
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
          <span className="text-foreground">Cart</span>
        </div>

        <h1 className="text-2xl font-bold mb-6">Shopping Cart ({itemCount} items)</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-card rounded-lg p-4 shadow-sm flex gap-4"
              >
                {/* Image */}
                <Link
                  to={`/product/${item.product_id}`}
                  className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-muted"
                >
                  <img
                    src={item.product?.images?.[0] || '/placeholder.svg'}
                    alt={item.product?.name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.product_id}`}
                    className="font-medium text-foreground line-clamp-2 hover:text-primary"
                  >
                    {item.product?.name}
                  </Link>
                  
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    {item.size && <span>Size: {item.size}</span>}
                    {item.color && <span>Color: {item.color}</span>}
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-foreground">
                      ₹{(item.product?.price ?? 0).toLocaleString('en-IN')}
                    </span>
                    {item.product && item.product.mrp > item.product.price && (
                      <>
                        <span className="original-price">
                          ₹{item.product.mrp.toLocaleString('en-IN')}
                        </span>
                        <span className="discount-text text-xs">
                          {item.product.discount_percent}% off
                        </span>
                      </>
                    )}
                  </div>

                  {/* Quantity & Remove */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border rounded-md">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-2 hover:bg-muted"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-2 hover:bg-muted"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-destructive hover:text-destructive/80 p-2"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg p-4 shadow-sm sticky top-24">
              <h2 className="font-bold text-lg mb-4">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
                  <span className="font-medium">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className={deliveryFee === 0 ? 'discount-text' : 'font-medium'}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>
                {deliveryFee > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Add ₹{499 - totalAmount} more for free delivery
                  </p>
                )}

                <hr />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{finalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Savings */}
              <div className="mt-4 p-3 bg-success/10 rounded-lg flex items-center gap-2 text-sm">
                <Tag className="h-4 w-4 text-success" />
                <span className="text-success font-medium">
                  You're saving ₹{items.reduce((sum, item) => {
                    const mrp = (item.product?.mrp ?? 0) * item.quantity;
                    const price = (item.product?.price ?? 0) * item.quantity;
                    return sum + (mrp - price);
                  }, 0).toLocaleString('en-IN')}
                </span>
              </div>

              <Button
                onClick={handleCheckout}
                className="w-full mt-4 btn-deal"
                size="lg"
              >
                Proceed to Checkout
              </Button>

              <div className="mt-4 cod-badge justify-center w-full">
                💵 Cash on Delivery Available
              </div>

              {/* Trust */}
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Secure
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="h-3 w-3" /> Fast Delivery
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CartPage;

import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { Trash2, Plus, Minus, ShoppingBag, ChevronRight, Truck, Shield, Tag, Package, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CartPage = () => {
  const { items, itemCount, totalAmount, removeFromCart, updateQuantity, isLoading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const deliveryFee = totalAmount >= 499 ? 0 : 40;
  const finalAmount = totalAmount + deliveryFee;
  const totalSavings = items.reduce((sum, item) => {
    const mrp = (item.product?.mrp ?? 0) * item.quantity;
    const price = (item.product?.price ?? 0) * item.quantity;
    return sum + (mrp - price);
  }, 0);

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
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48" />
            {[1, 2].map(i => (
              <div key={i} className="bg-card rounded-xl p-5 flex gap-4">
                <div className="w-24 h-24 bg-muted rounded-lg shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-8 bg-muted rounded w-1/3" />
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
        <div className="container mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-sm mx-auto"
          >
            <div className="w-28 h-28 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
              <ShoppingBag className="h-14 w-14 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">
              Looks like you haven't added anything to your cart yet
            </p>
            <Button onClick={() => navigate('/products')} size="lg" className="w-full">
              Start Shopping
            </Button>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 pb-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">Cart</span>
        </nav>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-0 mb-8 max-w-md mx-auto">
          {[
            { label: 'Cart', icon: ShoppingBag, active: true },
            { label: 'Checkout', icon: CreditCard, active: false },
            { label: 'Confirmation', icon: Package, active: false },
          ].map((step, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step.active 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <step.icon className="h-4 w-4" />
                </div>
                <span className={`text-xs ${step.active ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
              </div>
              {i < 2 && (
                <div className={`w-16 h-0.5 mx-2 mt-[-16px] ${
                  step.active ? 'bg-primary/30' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        <h1 className="text-2xl font-bold mb-6">Shopping Cart <span className="text-muted-foreground font-normal text-lg">({itemCount} {itemCount === 1 ? 'item' : 'items'})</span></h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3">
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-xl p-4 border border-border/50 flex gap-4 hover:shadow-md transition-shadow"
                >
                  <Link
                    to={`/product/${item.product_id}`}
                    className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-muted"
                  >
                    <img
                      src={item.product?.images?.[0] || '/placeholder.svg'}
                      alt={item.product?.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.product_id}`}
                      className="font-medium text-foreground line-clamp-2 hover:text-primary transition-colors text-sm"
                    >
                      {item.product?.name}
                    </Link>
                    
                    {(item.size || item.color) && (
                      <div className="flex items-center gap-2 mt-1">
                        {item.size && (
                          <span className="text-xs px-2 py-0.5 bg-muted rounded-md font-medium">Size: {item.size}</span>
                        )}
                        {item.color && (
                          <span className="text-xs px-2 py-0.5 bg-muted rounded-md font-medium">Color: {item.color}</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-bold text-foreground">
                        ₹{(item.product?.price ?? 0).toLocaleString('en-IN')}
                      </span>
                      {item.product && item.product.mrp > item.product.price && (
                        <>
                          <span className="text-xs text-muted-foreground line-through">
                            ₹{item.product.mrp.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-950/30 px-1.5 py-0.5 rounded">
                            {item.product.discount_percent}% off
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 hover:bg-muted transition-colors"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-4 font-semibold text-sm min-w-[40px] text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 hover:bg-muted transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-muted-foreground hover:text-destructive p-2 transition-colors rounded-lg hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border/50 p-5 sticky top-24 space-y-4">
              <h2 className="font-bold text-lg">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
                  <span className="font-medium">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className={deliveryFee === 0 ? 'text-green-600 font-semibold' : 'font-medium'}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>
                {deliveryFee > 0 && (
                  <div className="bg-primary/5 rounded-lg p-2.5 text-xs text-primary">
                    Add ₹{499 - totalAmount} more for <strong>free delivery</strong>
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="flex justify-between text-base font-bold">
                    <span>Total</span>
                    <span>₹{finalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {totalSavings > 0 && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="text-green-700 dark:text-green-400 font-medium text-sm">
                    You save ₹{totalSavings.toLocaleString('en-IN')} on this order
                  </span>
                </div>
              )}

              <Button
                onClick={handleCheckout}
                className="w-full"
                size="lg"
              >
                Proceed to Checkout
              </Button>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5 text-center">
                <span className="text-amber-700 dark:text-amber-400 text-sm font-medium">💵 Cash on Delivery Available</span>
              </div>

              <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> Secure Checkout
                </span>
                <span className="flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" /> Fast Delivery
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

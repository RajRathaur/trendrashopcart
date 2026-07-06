import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductReviews } from '@/components/products/ProductReviews';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { Heart, Star, ShoppingCart, Truck, Shield, RotateCcw, ChevronRight, Plus, Minus, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Seo } from '@/components/Seo';
import { BuyNowDialog } from '@/components/checkout/BuyNowDialog';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user, profile } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<'available' | 'unavailable' | null>(null);
  const [pincodeInfo, setPincodeInfo] = useState<{ city: string; state: string; delivery_days: number; is_cod_available: boolean; delivery_charge: number } | null>(null);
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [buyNowLoading, setBuyNowLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            category:categories(*)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setProduct(data as unknown as Product);
        
        // Set defaults
        if (data?.sizes?.length) setSelectedSize(data.sizes[0]);
        if (data?.colors?.length) setSelectedColor(data.colors[0]);
      } catch (error) {
        console.error('Error fetching product:', error);
        // Demo product
        setProduct({
          id: '1',
          seller_id: '1',
          name: 'Men\'s Premium Cotton T-Shirt - Comfortable & Stylish',
          slug: 'mens-premium-cotton-tshirt',
          description: 'Experience ultimate comfort with our premium cotton t-shirt. Made from 100% organic cotton, this t-shirt offers a soft feel against your skin. Perfect for casual outings, office wear, or lounging at home. The classic fit ensures a comfortable silhouette that flatters all body types.',
          price: 499,
          mrp: 999,
          discount_percent: 50,
          stock: 100,
          images: [
            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
            'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600',
            'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600',
          ],
          sizes: ['S', 'M', 'L', 'XL', 'XXL'],
          colors: ['White', 'Black', 'Navy Blue', 'Grey'],
          specifications: {
            'Material': '100% Cotton',
            'Fit': 'Regular Fit',
            'Neck Type': 'Round Neck',
            'Sleeve': 'Half Sleeve',
            'Pattern': 'Solid',
            'Wash Care': 'Machine Wash',
          },
          rating: 4.2,
          review_count: 1523,
          is_active: true,
          is_featured: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setSelectedSize('M');
        setSelectedColor('White');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const checkPincode = async (code?: string) => {
    const pin = (code ?? pincode).trim();
    if (pin.length !== 6) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }
    setCheckingPincode(true);
    const { data, error } = await supabase
      .from('delivery_pincodes')
      .select('city,state,delivery_days,is_cod_available,is_active')
      .eq('pincode', pin)
      .maybeSingle();
    setCheckingPincode(false);
    if (error) {
      toast.error('Could not check delivery. Try again.');
      return;
    }
    if (data && data.is_active) {
      setPincodeStatus('available');
      setPincodeInfo({
        city: data.city,
        state: data.state,
        delivery_days: data.delivery_days,
        is_cod_available: data.is_cod_available,
      });
    } else {
      setPincodeStatus('unavailable');
      setPincodeInfo(null);
    }
  };

  // Realtime: re-check active pincode whenever admin updates delivery_pincodes
  useEffect(() => {
    if (pincode.length !== 6 || !pincodeStatus) return;
    const channel = supabase
      .channel(`delivery-pincode-${pincode}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'delivery_pincodes', filter: `pincode=eq.${pincode}` },
        () => checkPincode(pincode),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincode, pincodeStatus]);


  const handleAddToCart = () => {
    if (!product) return;
    if (product.sizes?.length && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (product.colors?.length && !selectedColor) {
      toast.error('Please select a color');
      return;
    }
    addToCart(product.id, quantity, selectedSize || undefined, selectedColor || undefined);
  };

  const [buyNowOpen, setBuyNowOpen] = useState(false);

  const handleBuyNow = async () => {
    if (!product) return;
    if (product.sizes?.length && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    if (product.colors?.length && !selectedColor) {
      toast.error('Please select a color');
      return;
    }
    setBuyNowOpen(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-muted animate-pulse rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-6 bg-muted animate-pulse rounded w-1/2" />
              <div className="h-10 bg-muted animate-pulse rounded w-1/3" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link to="/products" className="text-primary hover:underline">
            Browse Products
          </Link>
        </div>
      </Layout>
    );
  }

  const images = product.images?.length ? product.images : ['/placeholder.svg'];
  const isWishlisted = isInWishlist(product.id);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: images,
    description: product.description || product.name,
    sku: product.id,
    brand: { "@type": "Brand", name: product.seller?.business_name || "Trendra" },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "INR",
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `https://trendrashopcart.lovable.app/product/${product.id}`,
    },
    ...(product.rating > 0 ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: Math.max(1, product.review_count || 1),
      },
    } : {}),
  };

  return (
    <Layout>
      <Seo
        title={`${product.name} — Buy Online at Trendra Shopkart`}
        description={(product.description || `Buy ${product.name} online at Trendra Shopkart. Best price, Cash on Delivery, fast shipping across India.`).slice(0, 160)}
        path={`/product/${product.id}`}
        image={images[0]}
        jsonLd={productSchema}
      />
      <div className="container mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 overflow-x-auto no-scrollbar">
          <Link to="/" className="hover:text-primary whitespace-nowrap">Home</Link>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <Link to="/products" className="hover:text-primary whitespace-nowrap">Products</Link>
          {product.category && (
            <>
              <ChevronRight className="h-4 w-4 shrink-0" />
              <Link to={`/products?category=${product.category.slug}`} className="hover:text-primary whitespace-nowrap">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-4 w-4 shrink-0" />
          <span className="text-foreground truncate">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-card rounded-lg overflow-hidden">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                aria-pressed={isWishlisted}
                onClick={() => toggleWishlist(product.id)}
                className={cn(
                  'absolute top-4 right-4 p-3 rounded-full bg-card shadow-lg transition-all',
                  isWishlisted ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'
                )}
              >
                <Heart className={cn('h-6 w-6', isWishlisted && 'fill-current')} />
              </button>
              {product.discount_percent > 0 && (
                <div className="deal-badge absolute top-4 left-4 text-sm">
                  {product.discount_percent}% OFF
                </div>
              )}
            </div>
            
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Show image ${i + 1} of ${product.name}`}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      'w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all',
                      selectedImage === i ? 'border-primary' : 'border-transparent hover:border-muted-foreground'
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-primary font-medium mb-1">
                {product.seller?.business_name || 'Trendra'}
              </p>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {product.name}
              </h1>
              
              {/* Rating */}
              {product.rating > 0 && (
                <div className="flex items-center gap-2">
                  <div className="rating-badge">
                    <span>{product.rating.toFixed(1)}</span>
                    <Star className="h-3 w-3 fill-current" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.review_count.toLocaleString()} Reviews
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="bg-secondary/50 p-4 rounded-lg">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-foreground">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {product.mrp > product.price && (
                  <>
                    <span className="original-price text-lg">
                      ₹{product.mrp.toLocaleString('en-IN')}
                    </span>
                    <span className="discount-text">
                      {product.discount_percent}% off
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Inclusive of all taxes</p>
            </div>

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Select Size</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        'px-4 py-2 rounded-md border-2 font-medium transition-all',
                        selectedSize === size
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input hover:border-primary'
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Select Color</h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        'px-4 py-2 rounded-md border-2 font-medium transition-all',
                        selectedColor === color
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input hover:border-primary'
                      )}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="font-semibold mb-2">Quantity</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 rounded-md border hover:bg-muted"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-lg font-medium w-12 text-center" aria-live="polite">{quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 rounded-md border hover:bg-muted"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleAddToCart}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
              <Button
                onClick={handleBuyNow}
                className="flex-1 btn-deal"
                size="lg"
                disabled={buyNowLoading}
              >
                {buyNowLoading ? 'Processing...' : 'Buy Now'}
              </Button>
            </div>

            {/* Delivery Check */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Check Delivery
              </h3>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter Pincode"
                  value={pincode}
                  onChange={(e) => {
                    setPincode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setPincodeStatus(null);
                  }}
                  className="flex-1"
                  maxLength={6}
                />
                <Button onClick={() => checkPincode()} variant="secondary" disabled={checkingPincode}>
                  {checkingPincode ? 'Checking…' : 'Check'}
                </Button>
              </div>
              {pincodeStatus === 'available' && pincodeInfo && (
                <div className="mt-2 space-y-1 text-sm">
                  <p className="pincode-available flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    Delivery to <strong>{pincodeInfo.city}, {pincodeInfo.state}</strong> in {pincodeInfo.delivery_days} days
                  </p>
                  <p className="text-muted-foreground">
                    {pincodeInfo.is_cod_available ? '💵 Cash on Delivery available' : 'Prepaid orders only (COD not available)'}
                  </p>
                </div>
              )}
              {pincodeStatus === 'unavailable' && (
                <p className="mt-2 pincode-unavailable flex items-center gap-1 text-sm">
                  <X className="h-4 w-4" /> Sorry, we don't deliver to this pincode yet.
                </p>
              )}
            </div>

            {/* COD Badge */}
            <div className="cod-badge text-sm">
              💵 Cash on Delivery Available
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { icon: Truck, text: 'Free Shipping' },
                { icon: RotateCcw, text: 'Easy Returns' },
                { icon: Shield, text: 'Secure Payment' },
              ].map((item, i) => (
                <div key={i} className="p-3 bg-muted rounded-lg">
                  <item.icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <span className="text-xs">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Specifications</h3>
                <div className="bg-muted rounded-lg divide-y">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex py-2 px-3 text-sm">
                      <span className="text-muted-foreground w-1/3">{key}</span>
                      <span className="text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12 border-t pt-8">
          <ProductReviews
            productId={product.id}
            productRating={product.rating}
            reviewCount={product.review_count}
          />
        </div>
      </div>
      <BuyNowDialog
        open={buyNowOpen}
        onOpenChange={setBuyNowOpen}
        productId={product.id}
        productName={product.name}
        amount={product.price * quantity}
        quantity={quantity}
        size={selectedSize}
        color={selectedColor}
      />
    </Layout>
  );
};

export default ProductDetail;

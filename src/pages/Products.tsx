import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { supabase } from '@/integrations/supabase/client';
import { Product, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Filter, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { Seo } from '@/components/Seo';

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get('category')
  );
  const [sortBy, setSortBy] = useState('relevance');

  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true);
      if (data) setCategories(data as Category[]);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('products')
          .select(`
            *,
            category:categories(*),
            seller:sellers(*)
          `)
          .eq('is_active', true)
          .gte('price', priceRange[0])
          .lte('price', priceRange[1]);

        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`);
        }

        if (selectedCategory) {
          query = query.eq('category.slug', selectedCategory);
        }

        switch (sortBy) {
          case 'price_low':
            query = query.order('price', { ascending: true });
            break;
          case 'price_high':
            query = query.order('price', { ascending: false });
            break;
          case 'rating':
            query = query.order('rating', { ascending: false });
            break;
          case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
          default:
            query = query.order('is_featured', { ascending: false });
        }

        const { data, error } = await query.limit(50);

        if (error) throw error;
        setProducts((data as unknown as Product[]) || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        // Set demo products on error
        setProducts(getDemoProducts());
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery, selectedCategory, priceRange, sortBy]);

  const getDemoProducts = (): Product[] => [
    {
      id: '1',
      seller_id: '1',
      name: 'Men\'s Premium Cotton T-Shirt',
      slug: 'mens-premium-cotton-tshirt',
      price: 499,
      mrp: 999,
      discount_percent: 50,
      stock: 100,
      images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['White', 'Black'],
      specifications: {},
      rating: 4.2,
      review_count: 1523,
      is_active: true,
      is_featured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      seller_id: '1',
      name: 'Wireless Bluetooth Earbuds',
      slug: 'wireless-bluetooth-earbuds',
      price: 1299,
      mrp: 2999,
      discount_percent: 57,
      stock: 50,
      images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400'],
      sizes: [],
      colors: ['Black', 'White'],
      specifications: {},
      rating: 4.5,
      review_count: 3421,
      is_active: true,
      is_featured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-3">Categories</h3>
        <div className="space-y-2">
          <div
            className={`cursor-pointer py-1 ${!selectedCategory ? 'text-primary font-medium' : 'text-foreground'}`}
            onClick={() => setSelectedCategory(null)}
          >
            All Categories
          </div>
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`cursor-pointer py-1 flex items-center justify-between ${
                selectedCategory === cat.slug ? 'text-primary font-medium' : 'text-foreground'
              }`}
              onClick={() => setSelectedCategory(cat.slug)}
            >
              {cat.name}
              <ChevronRight className="h-4 w-4" />
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-3">Price Range</h3>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            min={0}
            max={10000}
            step={100}
          />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>₹{priceRange[0]}</span>
            <span>₹{priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="font-semibold mb-3">Customer Rating</h3>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <label key={rating} className="flex items-center gap-2 cursor-pointer">
              <Checkbox />
              <span className="text-sm">{rating}★ & above</span>
            </label>
          ))}
        </div>
      </div>

      {/* Discount */}
      <div>
        <h3 className="font-semibold mb-3">Discount</h3>
        <div className="space-y-2">
          {['50% or more', '40% or more', '30% or more', '20% or more'].map((discount) => (
            <label key={discount} className="flex items-center gap-2 cursor-pointer">
              <Checkbox />
              <span className="text-sm">{discount}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Products</span>
          {selectedCategory && (
            <>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground capitalize">{selectedCategory.replace('-', ' ')}</span>
            </>
          )}
        </div>

        <div className="flex gap-6">
          {/* Desktop Filters */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-card rounded-lg p-4 shadow-sm sticky top-24">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </h2>
              <FilterContent />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold">
                  {searchQuery ? `Results for "${searchQuery}"` : 'All Products'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {products.length} products found
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Mobile Filter Button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <SlidersHorizontal className="h-4 w-4 mr-1" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                      <FilterContent />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-card border rounded-md px-3 py-2 text-sm"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            <ProductGrid products={products} loading={loading} />
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default ProductsPage;

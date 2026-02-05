import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { BannerSlider } from '@/components/home/BannerSlider';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { DealsSection } from '@/components/home/DealsSection';
import { supabase } from '@/integrations/supabase/client';
import { Product, Banner } from '@/types';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/scroll-reveal';

const Index = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch banners
        const { data: bannersData } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (bannersData) {
          setBanners(bannersData as Banner[]);
        }

        // Fetch products
        const { data: productsData } = await supabase
          .from('products')
          .select(`
            *,
            category:categories(*),
            seller:sellers(*)
          `)
          .eq('is_active', true)
          .limit(24);

        if (productsData) {
          setProducts(productsData as unknown as Product[]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Demo products if database is empty
  const demoProducts: Product[] = products.length > 0 ? products : [
    {
      id: '1',
      seller_id: '1',
      name: 'Men\'s Premium Cotton T-Shirt',
      slug: 'mens-premium-cotton-tshirt',
      description: 'High quality cotton t-shirt',
      price: 499,
      mrp: 999,
      discount_percent: 50,
      stock: 100,
      images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['White', 'Black', 'Blue'],
      specifications: {},
      rating: 4.2,
      review_count: 1523,
      is_active: true,
      is_featured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category: { id: '1', name: 'Fashion', slug: 'fashion', is_active: true, created_at: '' },
    },
    {
      id: '2',
      seller_id: '1',
      name: 'Wireless Bluetooth Earbuds Pro',
      slug: 'wireless-bluetooth-earbuds',
      description: 'Premium sound quality',
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
      category: { id: '2', name: 'Electronics', slug: 'electronics', is_active: true, created_at: '' },
    },
    {
      id: '3',
      seller_id: '1',
      name: 'Women\'s Ethnic Kurti Set',
      slug: 'womens-ethnic-kurti-set',
      description: 'Beautiful ethnic wear',
      price: 799,
      mrp: 1599,
      discount_percent: 50,
      stock: 75,
      images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400'],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Red', 'Blue', 'Green'],
      specifications: {},
      rating: 4.3,
      review_count: 892,
      is_active: true,
      is_featured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category: { id: '1', name: 'Fashion', slug: 'fashion', is_active: true, created_at: '' },
    },
    {
      id: '4',
      seller_id: '1',
      name: 'Smart Watch Fitness Tracker',
      slug: 'smart-watch-fitness-tracker',
      description: 'Track your health',
      price: 1999,
      mrp: 4999,
      discount_percent: 60,
      stock: 30,
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'],
      sizes: [],
      colors: ['Black', 'Rose Gold'],
      specifications: {},
      rating: 4.1,
      review_count: 2156,
      is_active: true,
      is_featured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category: { id: '2', name: 'Electronics', slug: 'electronics', is_active: true, created_at: '' },
    },
    {
      id: '5',
      seller_id: '1',
      name: 'Non-Stick Cookware Set (5 Pcs)',
      slug: 'non-stick-cookware-set',
      description: 'Premium kitchen essentials',
      price: 1499,
      mrp: 3499,
      discount_percent: 57,
      stock: 40,
      images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400'],
      sizes: [],
      colors: ['Black', 'Red'],
      specifications: {},
      rating: 4.4,
      review_count: 756,
      is_active: true,
      is_featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category: { id: '3', name: 'Home & Kitchen', slug: 'home-kitchen', is_active: true, created_at: '' },
    },
    {
      id: '6',
      seller_id: '1',
      name: 'Organic Face Care Kit',
      slug: 'organic-face-care-kit',
      description: 'Natural skincare',
      price: 599,
      mrp: 1299,
      discount_percent: 54,
      stock: 60,
      images: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400'],
      sizes: [],
      colors: [],
      specifications: {},
      rating: 4.6,
      review_count: 1834,
      is_active: true,
      is_featured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category: { id: '4', name: 'Beauty', slug: 'beauty', is_active: true, created_at: '' },
    },
  ];

  const demoBanners = banners.length > 0 ? banners : [];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4">
        {/* Banner Slider */}
        <BannerSlider banners={demoBanners} />

        {/* Deals of the Day */}
        <DealsSection
          products={demoProducts.filter(p => p.discount_percent >= 50)}
          title="Deals of the Day"
          type="deals"
          loading={loading}
        />

        {/* Trending Products */}
        <DealsSection
          products={demoProducts.filter(p => p.is_featured)}
          title="Trending Now"
          type="trending"
          loading={loading}
        />

        {/* Recommended for You */}
        <DealsSection
          products={demoProducts}
          title="Recommended for You"
          type="recommended"
          loading={loading}
        />

        {/* Trust Badges */}
        <section className="py-10">
          <ScrollReveal variant="fadeUp">
            <div className="text-center mb-8">
              <h2 className="section-title justify-center">Why Shop with Trendra?</h2>
              <p className="text-muted-foreground mt-2">Trusted by millions of customers across India</p>
            </div>
          </ScrollReveal>
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-5" staggerDelay={0.15}>
            {[
              { icon: '🚚', title: 'Free Shipping', desc: 'On orders above ₹499', gradient: 'from-blue-500 to-cyan-500' },
              { icon: '💵', title: 'Cash on Delivery', desc: 'Pay when you receive', gradient: 'from-green-500 to-emerald-500' },
              { icon: '↩️', title: 'Easy Returns', desc: '7 days return policy', gradient: 'from-orange-500 to-amber-500' },
              { icon: '🔒', title: '100% Secure', desc: 'Safe & secure shopping', gradient: 'from-purple-500 to-pink-500' },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <div className="trust-badge group cursor-pointer">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-3xl">{item.icon}</span>
                  </div>
                  <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors duration-300">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      </div>
    </Layout>
  );
};

export default Index;

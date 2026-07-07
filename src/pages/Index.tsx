import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { DeliveryRoad } from '@/components/home/DeliveryRoad';
import { BannerSlider } from '@/components/home/BannerSlider';
import { DealsSection } from '@/components/home/DealsSection';
import { HeroSection } from '@/components/home/HeroSection';
import { CinematicHero } from '@/components/home/CinematicHero';
import { FlashSaleTimer } from '@/components/home/FlashSaleTimer';
import { FloatingPromo } from '@/components/home/FloatingPromo';
import { FloatingStickers } from '@/components/home/FloatingStickers';

import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { GamePromoBanner } from '@/components/home/GamePromoBanner';
import { supabase } from '@/integrations/supabase/client';
import { Product, Banner } from '@/types';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/scroll-reveal';
import { Seo } from '@/components/Seo';
import { EditableText } from '@/components/EditableText';

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
            category:categories(*)
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

  const demoProducts: Product[] = products;
  const demoBanners = banners;

  return (
    <Layout>
      <Seo
        title="Trendra Shopkart — Shop Fashion, Electronics & More in India"
        description="Discover trending products across fashion, electronics, beauty and home — at unbeatable prices with Cash on Delivery across India."
        path="/"
      />
      {/* Floating Promo */}
      <FloatingPromo />
      <FloatingStickers />


      {/* Cinematic edge-to-edge hero */}
      <CinematicHero />

      {/* Delivery road transition */}
      <DeliveryRoad />

      {/* Banner Slider */}
      {demoBanners.length > 0 && (
        <div className="container mx-auto px-3">
          <BannerSlider banners={demoBanners} />
        </div>
      )}

      {/* Flash Sale Timer */}
      <div className="container mx-auto px-3 py-2">
        <FlashSaleTimer />
      </div>

      {/* Section separator */}
      <div className="section-separator" />

      {/* Deals of the Day (moved up above Fruit Slicer) */}
      <div className="container mx-auto px-3">
        <DealsSection
          products={demoProducts.filter(p => p.discount_percent >= 50)}
          title="Deals of the Day"
          type="deals"
          loading={loading}
        />
      </div>

      <div className="section-separator" />

      {/* Trending Products */}
      <div className="container mx-auto px-3">
        <DealsSection
          products={demoProducts.filter(p => p.is_featured)}
          title="Trending Now"
          type="trending"
          loading={loading}
        />
      </div>

      <div className="section-separator" />

      {/* Fruit Slicer Game Promo (moved below products) */}
      <div className="container mx-auto px-3">
        <GamePromoBanner />
      </div>

      <div className="section-separator" />

      {/* Curated Categories */}
      <div className="container mx-auto px-4 md:px-6">
        <CategoryGrid />
      </div>

      <div className="section-separator" />
      <div className="container mx-auto px-3">
        <DealsSection
          products={demoProducts}
          title="Recommended for You"
          type="recommended"
          loading={loading}
        />
      </div>

      <div className="section-separator" />

      {/* Testimonials */}
      <div className="container mx-auto px-3">
        <TestimonialsSection />
      </div>

      <div className="section-separator" />

      {/* Trust Badges - Flipkart style */}
      <div className="container mx-auto px-3">
        <section className="py-6">
          <ScrollReveal variant="fadeUp">
            <div className="bg-card shadow-sm p-6">
              <h2 className="text-lg font-semibold text-foreground mb-5 text-center">
                <EditableText contentKey="home.trust.title" defaultValue="Why Shop with Trendra?" />
              </h2>
              <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-6" staggerDelay={0.1}>
                {[
                  { keyBase: 'home.trust.1', icon: '🚚', title: 'Free Shipping', desc: 'On orders above ₹499' },
                  { keyBase: 'home.trust.2', icon: '💵', title: 'Cash on Delivery', desc: 'Pay when you receive' },
                  { keyBase: 'home.trust.3', icon: '↩️', title: '7 Days Return', desc: 'Easy return policy' },
                  { keyBase: 'home.trust.4', icon: '🔒', title: 'Trendra Assured', desc: 'Quality guaranteed' },
                ].map((item, i) => (
                  <StaggerItem key={i}>
                    <div className="flex items-center gap-3 p-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          <EditableText contentKey={`${item.keyBase}.title`} defaultValue={item.title} />
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          <EditableText contentKey={`${item.keyBase}.desc`} defaultValue={item.desc} />
                        </p>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </ScrollReveal>
        </section>
      </div>
    </Layout>
  );
};

export default Index;

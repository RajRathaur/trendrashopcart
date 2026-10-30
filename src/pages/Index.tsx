import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { BannerSlider } from '@/components/home/BannerSlider';
import { DealsSection } from '@/components/home/DealsSection';
import { CinematicHero } from '@/components/home/CinematicHero';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { GamePromoBanner } from '@/components/home/GamePromoBanner';
import { AiSuggestBox } from '@/components/home/AiSuggestBox';
import { FestivalSaleBanner } from '@/components/home/FestivalSaleBanner';
import { supabase } from '@/integrations/supabase/client';
import { Product, Banner } from '@/types';
import { Seo } from '@/components/Seo';

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
        title="Trendra — Online Shopping for Fashion, Custom T-Shirts & More in India"
        description="Discover trending products across fashion, electronics, beauty and home — at unbeatable prices with Cash on Delivery across India."
        path="/"
      />

      {/* Cinematic edge-to-edge hero */}
      <CinematicHero />

      {/* Trust strip */}
      <div className="commerce-trust-strip">
        <div className="container mx-auto px-3 grid grid-cols-2 md:grid-cols-4 divide-x divide-border/60">
          {[
            ['🚚', 'Free Delivery', 'On eligible orders'],
            ['↩️', 'Easy Returns', 'Simple return policy'],
            ['🔒', 'Secure Shopping', 'Protected checkout'],
            ['🎧', 'Customer Support', 'Dedicated help'],
          ].map(([icon, title, detail]) => (
            <div key={title} className="commerce-trust-item">
              <span aria-hidden="true">{icon}</span>
              <span><strong>{title}</strong><small>{detail}</small></span>
            </div>
          ))}
        </div>
      </div>

      {/* Festival sale (admin controlled, hides itself when off/ended) */}
      <div className="container mx-auto px-3 pt-4 empty:hidden">
        <FestivalSaleBanner />
      </div>

      {/* AI Suggestion Box */}
      <div className="container mx-auto px-3 py-4 sm:py-6">
        <AiSuggestBox />
      </div>

      {/* Banner Slider */}
      {demoBanners.length > 0 && (
        <div className="container mx-auto px-3 py-2">
          <BannerSlider banners={demoBanners} />
        </div>
      )}

      <div className="section-separator" />

      {/* Deals of the Day */}
      <div className="container mx-auto px-3 py-2">
        <DealsSection
          products={demoProducts.filter(p => p.discount_percent >= 50)}
          title="Deals of the Day"
          type="deals"
          loading={loading}
        />
      </div>

      <div className="section-separator" />

      {/* Trending Products */}
      <div className="container mx-auto px-3 py-2">
        <DealsSection
          products={demoProducts.filter(p => p.is_featured)}
          title="Trending Now"
          type="trending"
          loading={loading}
        />
      </div>

      <div className="section-separator" />

      {/* Curated Categories */}
      <div className="container mx-auto px-4 md:px-6 py-2">
        <CategoryGrid />
      </div>

      <div className="section-separator" />

      {/* Recommended */}
      <div className="container mx-auto px-3 py-2">
        <DealsSection
          products={demoProducts}
          title="Recommended for You"
          type="recommended"
          loading={loading}
        />
      </div>

      <div className="section-separator" />

      {/* Games Promo */}
      <div className="container mx-auto px-3 py-2">
        <GamePromoBanner />
      </div>

      <div className="section-separator" />

      {/* Testimonials */}
      <div className="container mx-auto px-3 py-2">
        <TestimonialsSection />
      </div>

    </Layout>
  );
};

export default Index;

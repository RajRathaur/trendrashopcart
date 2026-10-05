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
import { AiSuggestBox } from '@/components/home/AiSuggestBox';
import { supabase } from '@/integrations/supabase/client';
import { Product, Banner } from '@/types';
import { Seo } from '@/components/Seo';
import { AdsterraAd } from '@/components/ads/AdsterraAd';

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

      {/* Ad banner — desktop leaderboard / mobile banner */}
      <div className="container mx-auto px-3 py-2 flex justify-center">
        <div className="hidden md:block">
          <AdsterraAd adKey="87a01297c493a91f49e43feb0e934043" width={728} height={90} />
        </div>
        <div className="md:hidden">
          <AdsterraAd adKey="835b73275328dbc781e07c6046dae00c" width={320} height={50} />
        </div>
      </div>

      {/* AI Suggestion Box */}
      <div className="container mx-auto px-3 py-2 sm:py-3">
        <AiSuggestBox />
      </div>

      {/* Banner Slider */}
      {demoBanners.length > 0 && (
        <div className="container mx-auto px-3">
          <BannerSlider banners={demoBanners} />
        </div>
      )}

      {/* Flash Sale Timer */}
      <div className="container mx-auto px-3 py-1 sm:py-2">
        <FlashSaleTimer />
      </div>

      {/* Section separator */}
      <div className="section-separator" />

      {/* Deals of the Day (moved up above Fruit Slicer) */}
      <div className="container mx-auto px-3 pt-1 sm:pt-0">
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

      {/* Ad — medium rectangle */}
      <div className="container mx-auto px-3 py-2 flex justify-center">
        <AdsterraAd adKey="a1fd2cfbcf00131e916860291922332d" width={300} height={250} />
      </div>

      <div className="section-separator" />

    </Layout>
  );
};

export default Index;

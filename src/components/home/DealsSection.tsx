import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { ProductCard } from '@/components/products/ProductCard';
import { ChevronRight, Zap, Clock, TrendingUp, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/scroll-reveal';

interface DealsSectionProps {
  products: Product[];
  title: string;
  type: 'deals' | 'trending' | 'recommended' | 'new';
  loading?: boolean;
}

const sectionConfig = {
  deals: { icon: Zap, color: 'text-red-500', bgColor: 'bg-red-50', badge: 'Top Deals' },
  trending: { icon: TrendingUp, color: 'text-primary', bgColor: 'bg-blue-50', badge: 'Trending Now' },
  recommended: { icon: Star, color: 'text-yellow-500', bgColor: 'bg-yellow-50', badge: 'For You' },
  new: { icon: Clock, color: 'text-green-600', bgColor: 'bg-green-50', badge: 'New Arrivals' },
};

export const DealsSection = ({ products, title, type, loading }: DealsSectionProps) => {
  const config = sectionConfig[type];
  const Icon = config.icon;

  if (loading) {
    return (
      <section className="py-3">
        <div className="bg-card shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="h-7 bg-muted rounded w-48 animate-pulse" />
            <div className="h-8 bg-muted rounded w-24 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <ScrollReveal variant="fadeUp">
      <section className="py-3">
        <div className="bg-card shadow-sm">
          {/* Header - Flipkart style: simple bg with title + view all */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="flex items-center gap-3">
              <Icon className={`h-5 w-5 ${config.color}`} />
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-foreground">{title}</h2>
                <span className="text-xs text-muted-foreground">{config.badge}</span>
              </div>
            </div>
            <Link to={`/products?type=${type}`}>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-sm h-8 px-6 text-sm font-medium">
                View All
              </Button>
            </Link>
          </div>

          {/* Products - Flipkart grid with dividers */}
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 divide-x divide-border/30" staggerDelay={0.05}>
            {products.slice(0, 6).map((product) => (
              <StaggerItem key={product.id}>
                <ProductCard product={product} className="shadow-none border-0 hover:shadow-none" />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </ScrollReveal>
  );
};

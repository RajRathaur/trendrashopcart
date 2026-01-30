import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { ProductCard } from '@/components/products/ProductCard';
import { ChevronRight, Zap, Clock, TrendingUp, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DealsSectionProps {
  products: Product[];
  title: string;
  type: 'deals' | 'trending' | 'recommended' | 'new';
  loading?: boolean;
}

const sectionConfig = {
  deals: {
    icon: Zap,
    gradient: 'from-orange-500 to-red-500',
    badge: 'Deal of the Day',
  },
  trending: {
    icon: TrendingUp,
    gradient: 'from-blue-500 to-purple-500',
    badge: 'Trending Now',
  },
  recommended: {
    icon: Star,
    gradient: 'from-green-500 to-teal-500',
    badge: 'For You',
  },
  new: {
    icon: Clock,
    gradient: 'from-pink-500 to-rose-500',
    badge: 'New Arrivals',
  },
};

export const DealsSection = ({ products, title, type, loading }: DealsSectionProps) => {
  const config = sectionConfig[type];
  const Icon = config.icon;

  if (loading) {
    return (
      <section className="py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 bg-muted rounded w-48 animate-pulse" />
          <div className="h-8 bg-muted rounded w-24 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="product-card animate-pulse">
              <div className="aspect-square bg-muted" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-5 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-6">
      <div className="bg-card rounded-xl p-4 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${config.gradient}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="section-title">{title}</h2>
              <span className="text-xs text-muted-foreground">{config.badge}</span>
            </div>
          </div>
          <Link to={`/products?type=${type}`}>
            <Button variant="ghost" size="sm" className="text-primary">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Products */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {products.slice(0, 6).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

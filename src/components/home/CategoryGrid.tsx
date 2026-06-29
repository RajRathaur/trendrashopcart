import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import electronicsImg from '@/assets/category-electronics.jpg';
import fashionImg from '@/assets/category-fashion.jpg';
import homeImg from '@/assets/category-home.jpg';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

const fallbackImages = [fashionImg, electronicsImg, homeImg];

export const CategoryGrid = () => {
  const [categories, setCategories] = useState<CategoryRow[]>([]);

  useEffect(() => {
    supabase
      .from('categories')
      .select('id,name,slug,description,image_url')
      .eq('is_active', true)
      .order('name')
      .limit(9)
      .then(({ data }) => setCategories(data || []));
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="w-full py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex justify-between items-end mb-6"
      >
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Curated Categories</h2>
          <p className="text-foreground/50 text-sm">Shop by category.</p>
        </div>
        <Link
          to="/products"
          className="hidden sm:inline-flex font-semibold items-center gap-2 hover:gap-3 transition-all duration-300 text-sm"
          style={{ color: 'hsl(var(--primary))' }}
        >
          Explore All
          <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>

      {/* Mobile: horizontal scroll. Desktop: one row of up to 9. */}
      <div className="flex md:grid md:grid-cols-9 gap-3 overflow-x-auto md:overflow-visible no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory">
        {categories.slice(0, 9).map((cat, i) => {
          const tone = i % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--accent))';
          const image = cat.image_url || fallbackImages[i % fallbackImages.length];
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              className="flex-shrink-0 snap-start w-[88px] md:w-auto"
            >
              <Link
                to={`/products?category=${cat.slug}`}
                className="group flex flex-col items-center gap-2"
              >
                <div
                  className="relative w-[72px] h-[72px] md:w-full md:aspect-square overflow-hidden glass-card transition-all duration-300 group-hover:scale-105"
                  style={{ borderColor: 'hsl(0 0% 100% / 0.06)' }}
                >
                  <img
                    src={image}
                    alt={cat.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ boxShadow: `inset 0 0 0 1px ${tone}80` }}
                  />
                </div>
                <p className="text-[11px] md:text-xs font-semibold text-center text-foreground/85 leading-tight line-clamp-2 w-[80px] md:w-full">
                  {cat.name}
                </p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};


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
    <section className="w-full py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="flex justify-between items-end mb-10 md:mb-12"
      >
        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Curated Categories</h2>
          <p className="text-foreground/50">Shop by category — managed by Trendra admins.</p>
        </div>
        <Link
          to="/products"
          className="hidden sm:inline-flex font-semibold items-center gap-2 hover:gap-3 transition-all duration-300"
          style={{ color: 'hsl(var(--primary))' }}
        >
          Explore All
          <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        {categories.map((cat, i) => {
          const tone = i % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--accent))';
          const image = cat.image_url || fallbackImages[i % fallbackImages.length];
          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 32, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6 }}
            >
              <Link
                to={`/products?category=${cat.slug}`}
                className="group relative block aspect-[4/5] overflow-hidden cursor-pointer glass-card transition-all duration-500"
                style={{ borderColor: 'hsl(0 0% 100% / 0.06)' }}
              >
                <img
                  src={image}
                  alt={cat.name}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      i % 2 === 0
                        ? 'radial-gradient(circle at top right, hsl(var(--primary) / 0.18), transparent 55%)'
                        : 'radial-gradient(circle at bottom left, hsl(var(--accent) / 0.18), transparent 55%)',
                  }}
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 0 1px ${tone}50, 0 30px 80px -30px ${tone}90`,
                  }}
                />
                <div className="absolute bottom-3 left-3 right-3 md:bottom-6 md:left-6 md:right-6 space-y-1">
                  <p className="text-[9px] md:text-xs font-bold tracking-widest uppercase" style={{ color: tone }}>
                    Shop Now
                  </p>
                  <h3 className="text-sm md:text-2xl font-bold text-white leading-tight">{cat.name}</h3>
                  {cat.description && (
                    <p className="text-xs text-white/70 opacity-0 group-hover:opacity-100 transition-all duration-500 hidden md:block">
                      {cat.description}
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

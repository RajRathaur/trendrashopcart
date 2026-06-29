import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import electronicsImg from '@/assets/category-electronics.jpg';
import fashionImg from '@/assets/category-fashion.jpg';
import homeImg from '@/assets/category-home.jpg';

type CardTone = 'purple' | 'gold';

const categories: Array<{
  slug: string;
  eyebrow: string;
  title: string;
  desc: string;
  tone: CardTone;
  image: string;
}> = [
  {
    slug: 'electronics',
    eyebrow: 'Tech & Audio',
    title: 'Sonic Series',
    desc: 'Next-gen immersive audio equipment.',
    tone: 'purple',
    image: electronicsImg,
  },
  {
    slug: 'fashion',
    eyebrow: 'Premium Fashion',
    title: 'Heritage Modern',
    desc: 'Timeless silhouettes for the new era.',
    tone: 'gold',
    image: fashionImg,
  },
  {
    slug: 'home-kitchen',
    eyebrow: 'Smart Home',
    title: 'Luxe Living',
    desc: 'Automation meets high-end design.',
    tone: 'purple',
    image: homeImg,
  },
];

export const CategoryGrid = () => {
  return (
    <section className="w-full py-16">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="flex justify-between items-end mb-10 md:mb-12"
      >
        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Curated Categories</h2>
          <p className="text-foreground/50">Handpicked selection for the modern Indian home.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat, i) => {
          const tone = cat.tone === 'purple' ? 'hsl(var(--primary))' : 'hsl(var(--accent))';
          return (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 32, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              whileHover={{ y: -6 }}
            >
              <Link
                to={`/products?category=${cat.slug}`}
                className="group relative block aspect-[4/5] overflow-hidden cursor-pointer glass-card transition-all duration-500"
                style={{ borderColor: 'hsl(0 0% 100% / 0.06)' }}
              >
                {/* Background image */}
                <img
                  src={cat.image}
                  alt={cat.title}
                  width={1024}
                  height={1280}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />
                {/* Gradient veil */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60 pointer-events-none" />
                {/* Tone wash */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      cat.tone === 'purple'
                        ? 'radial-gradient(circle at top right, hsl(var(--primary) / 0.18), transparent 55%)'
                        : 'radial-gradient(circle at bottom left, hsl(var(--accent) / 0.18), transparent 55%)',
                  }}
                />
                {/* Hover glow ring */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 0 1px ${tone}50, 0 30px 80px -30px ${tone}90`,
                  }}
                />

                <div className="absolute bottom-8 left-8 right-8 space-y-2">
                  <p
                    className="text-xs font-bold tracking-widest uppercase"
                    style={{ color: tone }}
                  >
                    {cat.eyebrow}
                  </p>
                  <h3 className="text-2xl md:text-3xl font-bold text-white">{cat.title}</h3>
                  <p className="text-sm text-white/70 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                    {cat.desc}
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

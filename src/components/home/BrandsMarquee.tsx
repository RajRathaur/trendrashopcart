import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

const brands = [
  { name: 'Nike', logo: '🏃' },
  { name: 'Apple', logo: '🍎' },
  { name: 'Samsung', logo: '📱' },
  { name: 'Sony', logo: '🎮' },
  { name: 'Adidas', logo: '⚽' },
  { name: 'Puma', logo: '🐆' },
];

export const BrandsMarquee = () => {
  return (
    <section className="py-8 overflow-hidden">
      <ScrollReveal variant="fadeIn">
        <div className="text-center mb-6">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Trusted by Top Brands
          </p>
        </div>
      </ScrollReveal>

      <div className="relative">
        {/* Gradient overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />

        {/* Marquee container */}
        <motion.div
          className="flex gap-12"
          animate={{
            x: [0, -1000],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 20,
              ease: "linear",
            },
          }}
        >
          {[...brands, ...brands, ...brands].map((brand, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-card px-6 py-3 rounded-xl border border-border/50 shrink-0"
            >
              <span className="text-3xl">{brand.logo}</span>
              <span className="text-lg font-semibold text-foreground whitespace-nowrap">{brand.name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

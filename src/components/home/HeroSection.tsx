import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden mb-4 border border-accent/30">
      {/* Background - Premium navy gradient */}
      <div className="absolute inset-0" style={{ background: 'var(--gradient-hero)' }} />
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, hsl(42 70% 60% / 0.4), transparent 50%), radial-gradient(circle at 80% 70%, hsl(42 70% 60% / 0.3), transparent 50%)' }} />

      
      {/* Subtle animated shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/5 rounded-full blur-3xl"
          animate={{ scale: [1.15, 1, 1.15], opacity: [0.4, 0.2, 0.4] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 px-4 py-5 md:py-12 text-center">
        {/* Flash badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-5 py-1.5 mb-3 md:mb-6 font-semibold text-xs tracking-[0.2em] uppercase border"
          style={{ background: 'var(--gradient-gold)', color: 'hsl(220 60% 10%)', borderColor: 'hsl(42 70% 70%)' }}
        >
          <Zap className="h-3.5 w-3.5" />
          Exclusive Collection
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-2xl md:text-6xl font-serif font-medium text-white mb-2 md:mb-4 tracking-tight"
        >
          <span className="block">Curated Luxury</span>
          <motion.span
            className="block italic"
            style={{ background: 'var(--gradient-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            animate={{ opacity: [1, 0.85, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            Crafted for You
          </motion.span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xs md:text-base text-white/70 mb-4 md:mb-8 max-w-xl mx-auto font-light tracking-wide"
        >
          Discover handpicked fashion, electronics & home essentials — premium quality, complimentary delivery.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link to="/products">
            <Button size="lg" className="font-semibold px-10 group border-0 tracking-wider uppercase text-xs" style={{ background: 'var(--gradient-gold)', color: 'hsl(220 60% 10%)' }}>
              Shop Collection
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link to="/products?type=deals">
            <Button size="lg" variant="outline" className="border border-accent/60 text-white hover:bg-accent/10 font-semibold px-8 tracking-wider uppercase text-xs bg-transparent">
              Explore Deals
            </Button>
          </Link>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center gap-6 md:gap-10 mt-5 md:mt-10"
        >
          {[
            { value: '10K+', label: 'Products' },
            { value: '50K+', label: 'Happy Customers' },
            { value: '4.8★', label: 'App Rating' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-xl md:text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-white/60">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

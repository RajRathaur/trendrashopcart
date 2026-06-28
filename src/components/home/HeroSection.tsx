import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
};

const stats = [
  { value: '1.2M+', label: 'Active Users' },
  { value: '4.9/5', label: 'App Rating' },
  { value: '24/7', label: 'Concierge Support' },
  { value: '150+', label: 'Luxury Brands' },
];

export const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Ambient fluid background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{ background: 'hsl(var(--primary) / 0.18)' }}
          animate={{ x: [0, 60, -20, 0], y: [0, 40, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[40%] -right-[10%] w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{ background: 'hsl(var(--accent) / 0.12)' }}
          animate={{ x: [0, -40, 30, 0], y: [0, -30, 20, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[10%] right-[30%] w-[300px] h-[300px] rounded-full blur-[110px]"
          style={{ background: 'hsl(var(--primary) / 0.1)' }}
          animate={{ x: [0, 30, -40, 0], y: [0, 50, -10, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-20 md:py-28 text-center flex flex-col items-center"
      >
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center px-4 py-1.5 rounded-full bg-card border border-white/10 text-[11px] font-semibold tracking-[0.2em] uppercase"
          style={{ color: 'hsl(var(--primary))' }}
        >
          Trendra Shopkart
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="mt-8 text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight leading-[1.05] text-balance text-foreground"
        >
          Future of{' '}
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)' }}
          >
            Indian Commerce.
          </span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="mt-7 text-base md:text-xl text-foreground/60 max-w-2xl font-light leading-relaxed"
        >
          Experience a curated marketplace where premium global aesthetics meet the heart of India.
          Shop, earn rewards, and redefine your lifestyle.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/products">
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="px-8 py-4 font-semibold rounded-2xl text-primary-foreground glow-purple transition-shadow duration-300 hover:shadow-[0_0_60px_-10px_hsl(var(--primary)/0.7)]"
              style={{ background: 'hsl(var(--primary))' }}
            >
              Shop Collection
            </motion.button>
          </Link>
          <Link to="/coin-game">
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="px-8 py-4 font-semibold rounded-2xl bg-card border border-white/10 text-foreground backdrop-blur-xl transition-colors duration-300 hover:border-[hsl(var(--accent)/0.5)] hover:text-[hsl(var(--accent))]"
            >
              Play &amp; Earn
            </motion.button>
          </Link>
        </motion.div>

        {/* Trust stats */}
        <motion.div
          variants={itemVariants}
          className="mt-20 pt-12 w-full grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/5"
        >
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-1 items-center md:items-start">
              <span className="text-3xl md:text-4xl font-bold text-foreground">{s.value}</span>
              <span className="text-[10px] tracking-[0.2em] text-foreground/40 uppercase font-medium">
                {s.label}
              </span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

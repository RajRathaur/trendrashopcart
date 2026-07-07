import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Theme = 'day' | 'night';

const STORAGE_KEY = 'trendra_theme';

export const applyStoredTheme = () => {
  if (typeof document === 'undefined') return;
  const saved = (localStorage.getItem(STORAGE_KEY) as Theme | null) || 'night';
  document.documentElement.classList.toggle('light', saved === 'day');
};

export const ThemeToggle = ({ className = '' }: { className?: string }) => {
  const [theme, setTheme] = useState<Theme>(
    () => (typeof window !== 'undefined' && (localStorage.getItem(STORAGE_KEY) as Theme)) || 'night'
  );

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'day');
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'day' ? 'night' : 'day'));

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'day' ? 'Switch to night mode' : 'Switch to day mode'}
      title={theme === 'day' ? 'Night mode' : 'Day mode'}
      className={`relative h-9 w-9 rounded-full flex items-center justify-center text-primary-foreground hover:bg-white/10 transition-colors ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="inline-flex"
        >
          {theme === 'day' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
};

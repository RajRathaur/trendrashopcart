import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const FloatingPromo = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Show after 2 seconds
    const showTimer = setTimeout(() => {
      if (!dismissed) setIsVisible(true);
    }, 2000);

    return () => clearTimeout(showTimer);
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-24 right-4 md:bottom-8 z-40"
        >
          <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-2xl p-1 shadow-2xl">
            <div className="bg-card rounded-xl p-4 relative overflow-hidden">
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
              
              {/* Close button */}
              <button
                onClick={() => setDismissed(true)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>

              <div className="flex items-start gap-3 pr-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shrink-0">
                  <Gift className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs font-medium text-muted-foreground">Limited Time</span>
                  </div>
                  <h4 className="font-bold text-foreground">First Order Discount!</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Get <span className="text-primary font-bold">20% OFF</span> on your first order
                  </p>
                  <Link 
                    to="/products" 
                    className="inline-flex items-center gap-1 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

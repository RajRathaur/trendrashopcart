import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const GamePromoBanner = () => {
  const highScore = parseInt(localStorage.getItem('fruitGameHighScore') || '0');

  return (
    <section className="py-3">
      <Link to="/fruit-game" className="block">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-r from-green-600 via-emerald-500 to-lime-400 p-5 md:p-6"
        >
          <div className="absolute top-2 right-8 text-2xl animate-bounce" style={{ animationDelay: '0s' }}>🍉</div>
          <div className="absolute top-6 right-20 text-xl animate-bounce" style={{ animationDelay: '0.3s' }}>🍎</div>
          <div className="absolute bottom-3 right-12 text-lg animate-bounce" style={{ animationDelay: '0.6s' }}>🍊</div>
          <div className="absolute top-3 right-36 text-sm animate-pulse">✨</div>
          <div className="absolute bottom-4 right-32 text-sm animate-pulse" style={{ animationDelay: '1s' }}>🍇</div>

          <div className="relative z-10 flex items-center gap-4">
            <div className="flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl">
              🍉
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-lg md:text-xl">🎮 Fruit Slicer</h3>
              <p className="text-white/80 text-xs md:text-sm mt-0.5">
                Slice fruits, earn coupons & win rewards!
              </p>
              {highScore > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Trophy className="w-3 h-3 text-yellow-300" />
                  <span className="text-yellow-200 text-xs font-semibold">High Score: {highScore}</span>
                </div>
              )}
            </div>

            <Button size="sm" className="flex-shrink-0 bg-white text-green-700 hover:bg-white/90 font-bold gap-1 shadow-lg">
              Play <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </motion.div>
      </Link>
    </section>
  );
};

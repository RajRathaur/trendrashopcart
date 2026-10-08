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
      <div className="grid grid-cols-2 gap-3 mt-3">
        <Link to="/spin-wheel" className="rounded-xl p-4 bg-gradient-to-br from-amber-400 to-pink-500 text-white shadow active:scale-95 transition">
          <div className="text-3xl">🎡</div>
          <div className="font-bold mt-1">Spin the Wheel</div>
          <div className="text-xs text-white/85">Roz free spin, coins jeeto</div>
        </Link>
        <Link to="/hill-climb" className="rounded-xl p-4 bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow active:scale-95 transition">
          <div className="text-3xl">🏎️</div>
          <div className="font-bold mt-1">Hill Climb</div>
          <div className="text-xs text-white/85">Pahad par race, coins kamao</div>
        </Link>
      </div>
      <Link to="/dead-roads" className="mt-3 flex items-center gap-3 rounded-xl p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-cyan-900 text-white shadow active:scale-95 transition border border-cyan-500/30">
        <div className="text-3xl">🛣️</div>
        <div className="flex-1 min-w-0">
          <div className="font-bold">Dead Roads</div>
          <div className="text-xs text-cyan-200/80">Raat ki sadak par race — sawaal solve karke aage badho</div>
        </div>
        <ArrowRight className="w-4 h-4 text-cyan-300 shrink-0" />
      </Link>
    </section>
  );
};

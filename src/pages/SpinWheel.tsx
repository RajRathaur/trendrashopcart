import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coins, ArrowLeft } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCoinWallet } from '@/hooks/useCoinWallet';
import { toast } from '@/hooks/use-toast';

const SEGMENTS = [
  { coins: 5, color: 'hsl(14 90% 60%)' },
  { coins: 2, color: 'hsl(45 95% 55%)' },
  { coins: 1, color: 'hsl(140 60% 50%)' },
  { coins: 10, color: 'hsl(200 85% 55%)' },
  { coins: 3, color: 'hsl(280 70% 60%)' },
  { coins: 0, color: 'hsl(0 0% 70%)' },
  { coins: 8, color: 'hsl(330 80% 60%)' },
  { coins: 4, color: 'hsl(170 70% 45%)' },
];
const SEG = 360 / SEGMENTS.length;
const KEY = 'trendra:spin-last';

const todayStr = () => new Date().toISOString().slice(0, 10);

const SpinWheel = () => {
  const { user } = useAuth();
  const { balance, addCoins } = useCoinWallet();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [lastSpin, setLastSpin] = useState(() => localStorage.getItem(KEY));
  const usedToday = lastSpin === todayStr();

  const spin = () => {
    if (!user) {
      toast({ title: 'Login karein', description: 'Coins jeetne ke liye pehle login karein.' });
      return;
    }
    if (spinning || usedToday) return;
    const idx = Math.floor(Math.random() * SEGMENTS.length);
    // pointer at top: segment idx centre must end at 0deg
    const target = 360 * 6 + (360 - (idx * SEG + SEG / 2));
    const next = rotation - (rotation % 360) + target;
    setSpinning(true);
    setResult(null);
    setRotation(next);
    setTimeout(async () => {
      const won = SEGMENTS[idx].coins;
      setResult(won);
      setSpinning(false);
      localStorage.setItem(KEY, todayStr());
      setLastSpin(todayStr());
      if (won > 0) {
        const ok = await addCoins(won);
        if (ok !== null) toast({ title: `🎉 ${won} coins jeete!`, description: 'Wallet me jud gaye.' });
      }
    }, 4200);
  };

  const gradient = `conic-gradient(${SEGMENTS.map((s, i) => `${s.color} ${i * SEG}deg ${(i + 1) * SEG}deg`).join(',')})`;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
        <h1 className="text-2xl font-bold text-foreground">🎡 Spin the Wheel</h1>
        <p className="text-sm text-muted-foreground mt-1">Roz ek free spin — 10 coins tak jeeto!</p>
        {user && (
          <div className="inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold">
            <Coins className="w-4 h-4" /> {balance} coins
          </div>
        )}

        <div className="relative mx-auto mt-6 w-72 h-72 sm:w-80 sm:h-80">
          <div className="absolute left-1/2 -top-2 -translate-x-1/2 z-10 w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-primary drop-shadow" />
          <motion.div
            className="w-full h-full rounded-full border-8 border-card shadow-xl relative"
            style={{ background: gradient }}
            animate={{ rotate: rotation }}
            transition={{ duration: 4, ease: [0.15, 0.8, 0.2, 1] }}
          >
            {SEGMENTS.map((s, i) => (
              <div key={i} className="absolute inset-0" style={{ transform: `rotate(${i * SEG + SEG / 2}deg)` }}>
                <span className="absolute left-1/2 top-4 -translate-x-1/2 text-lg font-extrabold text-primary-foreground drop-shadow">
                  {s.coins === 0 ? '😅' : s.coins}
                </span>
              </div>
            ))}
          </motion.div>
          <button
            onClick={spin}
            disabled={spinning || usedToday}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-card text-foreground font-bold shadow-lg border-4 border-primary disabled:opacity-70"
          >
            {spinning ? '...' : 'SPIN'}
          </button>
        </div>

        {result !== null && (
          <motion.p initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-6 text-xl font-bold text-foreground">
            {result > 0 ? `🎉 Aapne ${result} coins jeete!` : '😅 Is baar kuch nahi — kal phir try karein!'}
          </motion.p>
        )}
        {usedToday && result === null && (
          <p className="mt-6 text-sm text-muted-foreground">Aaj ka spin ho gaya. Kal phir aaiye! 🌙</p>
        )}

        <div className="mt-8 flex gap-2 justify-center">
          <Button asChild variant="outline"><Link to="/hill-climb">🏎️ Hill Climb khelo</Link></Button>
          <Button asChild variant="outline"><Link to="/redeem">Coins redeem</Link></Button>
        </div>
      </div>
    </Layout>
  );
};

export default SpinWheel;

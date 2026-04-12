import { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Heart, Play, RotateCcw, Gift, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGameRewards } from '@/hooks/useGameRewards';
import { Link } from 'react-router-dom';

interface Fruit {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: string;
  points: number;
  sliced: boolean;
  radius: number;
}

interface SliceTrail {
  x: number;
  y: number;
  time: number;
}

const FRUITS = [
  { emoji: '🍎', points: 10 },
  { emoji: '🍊', points: 10 },
  { emoji: '🍋', points: 15 },
  { emoji: '🍇', points: 15 },
  { emoji: '🍉', points: 20 },
  { emoji: '🍓', points: 20 },
  { emoji: '🥝', points: 25 },
  { emoji: '🍑', points: 25 },
  { emoji: '🍍', points: 30 },
  { emoji: '🥭', points: 30 },
];

const FruitGame = () => {
  const { user } = useAuth();
  const { claimReward, getEarnedDiscount, rewards, REWARD_THRESHOLDS } = useGameRewards();
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() =>
    parseInt(localStorage.getItem('fruitGameHighScore') || '0')
  );
  const [lives, setLives] = useState(3);
  const [fruits, setFruits] = useState<Fruit[]>([]);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [level, setLevel] = useState(1);
  const [sliceTrail, setSliceTrail] = useState<SliceTrail[]>([]);
  const [isSlicing, setIsSlicing] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [sliceEffects, setSliceEffects] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);

  const gameRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const frameRef = useRef<number>();
  const lastSpawnRef = useRef(0);
  const comboTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    setFruits([]);
    setLevel(1);
    setCombo(0);
    setSliceTrail([]);
    setSliceEffects([]);
    setRewardClaimed(false);
  };

  const getGameArea = () => {
    if (!gameRef.current) return { w: 400, h: 500 };
    const rect = gameRef.current.getBoundingClientRect();
    return { w: rect.width, h: rect.height };
  };

  const spawnFruit = useCallback(() => {
    const { w, h } = getGameArea();
    const fruitData = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    const isBomb = Math.random() < 0.15 + level * 0.02;
    const side = Math.random();
    let x: number, vx: number;

    if (side < 0.3) {
      x = Math.random() * 0.2 * w;
      vx = (1 + Math.random() * 2);
    } else if (side > 0.7) {
      x = w * 0.8 + Math.random() * 0.2 * w;
      vx = -(1 + Math.random() * 2);
    } else {
      x = 0.2 * w + Math.random() * 0.6 * w;
      vx = (Math.random() - 0.5) * 3;
    }

    const fruit: Fruit = {
      id: idRef.current++,
      x,
      y: h + 20,
      vx,
      vy: -(10 + Math.random() * 4 + level * 0.5),
      type: isBomb ? '💣' : fruitData.emoji,
      points: isBomb ? -1 : fruitData.points,
      sliced: false,
      radius: 24,
    };
    setFruits(prev => [...prev, fruit]);
  }, [level]);

  // Check if swipe trail intersects a fruit
  const checkSlice = useCallback((trail: SliceTrail[]) => {
    if (trail.length < 2) return;
    const last = trail[trail.length - 1];
    const prev = trail[trail.length - 2];
    const dx = last.x - prev.x;
    const dy = last.y - prev.y;
    const speed = Math.sqrt(dx * dx + dy * dy);
    if (speed < 5) return; // Too slow

    setFruits(currentFruits => {
      let newFruits = [...currentFruits];
      let slicedAny = false;

      newFruits = newFruits.map(f => {
        if (f.sliced) return f;
        const dist = Math.sqrt((last.x - f.x) ** 2 + (last.y - f.y) ** 2);
        if (dist < f.radius + 20) {
          slicedAny = true;
          if (f.points === -1) {
            // Bomb
            setLives(l => l - 1);
            setCombo(0);
            setSliceEffects(eff => [...eff, { id: f.id, x: f.x, y: f.y, emoji: '💥' }]);
          } else {
            if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
            setCombo(c => {
              const newCombo = c + 1;
              const multiplier = Math.min(newCombo, 5);
              setScore(s => s + f.points * multiplier);
              if (newCombo > 1) {
                setShowCombo(true);
                comboTimerRef.current = setTimeout(() => setShowCombo(false), 800);
              }
              comboTimerRef.current = setTimeout(() => setCombo(0), 1500);
              return newCombo;
            });
            setSliceEffects(eff => [...eff, { id: f.id, x: f.x, y: f.y, emoji: f.type }]);
          }
          return { ...f, sliced: true };
        }
        return f;
      });

      return newFruits;
    });
  }, []);

  // Pointer handlers for swiping
  const handlePointerDown = (e: React.PointerEvent) => {
    if (gameState !== 'playing') return;
    const rect = gameRef.current?.getBoundingClientRect();
    if (!rect) return;
    setIsSlicing(true);
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top, time: Date.now() };
    setSliceTrail([point]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isSlicing || gameState !== 'playing') return;
    const rect = gameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const point = { x: e.clientX - rect.left, y: e.clientY - rect.top, time: Date.now() };
    setSliceTrail(prev => {
      const newTrail = [...prev, point].slice(-15);
      checkSlice(newTrail);
      return newTrail;
    });
  };

  const handlePointerUp = () => {
    setIsSlicing(false);
    setTimeout(() => setSliceTrail([]), 200);
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;
    const gravity = 0.25;

    const gameLoop = () => {
      const now = Date.now();
      const { h } = getGameArea();

      if (now - lastSpawnRef.current > Math.max(500, 1200 - level * 60)) {
        spawnFruit();
        if (Math.random() < 0.4) spawnFruit(); // Sometimes spawn 2
        lastSpawnRef.current = now;
      }

      setFruits(prev => {
        const updated = prev.map(f => ({
          ...f,
          x: f.x + f.vx,
          y: f.y + f.vy,
          vy: f.vy + gravity,
        }));

        const missed = updated.filter(f => !f.sliced && f.y > h + 40 && f.vy > 0 && f.points > 0);
        if (missed.length > 0) {
          setLives(l => l - missed.length);
          setCombo(0);
        }

        return updated.filter(f => {
          if (f.sliced) return false;
          if (f.y > h + 60 && f.vy > 0) return false;
          return true;
        });
      });

      // Clean old slice effects
      setSliceEffects(prev => prev.filter(() => true));

      frameRef.current = requestAnimationFrame(gameLoop);
    };

    lastSpawnRef.current = Date.now();
    frameRef.current = requestAnimationFrame(gameLoop);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [gameState, spawnFruit, level]);

  // Level up
  useEffect(() => {
    if (gameState === 'playing') setLevel(Math.floor(score / 200) + 1);
  }, [score, gameState]);

  // Game over
  useEffect(() => {
    if (lives <= 0 && gameState === 'playing') {
      setGameState('gameover');
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('fruitGameHighScore', score.toString());
      }
    }
  }, [lives, gameState, score, highScore]);

  const handleClaimReward = async () => {
    const result = await claimReward(score);
    if (result) setRewardClaimed(true);
  };

  const earnedDiscount = getEarnedDiscount(score);
  const nextThreshold = REWARD_THRESHOLDS.find(t => score < t.score);

  // SVG slice trail
  const trailPath = sliceTrail.length >= 2
    ? `M ${sliceTrail.map(p => `${p.x},${p.y}`).join(' L ')}`
    : '';

  return (
    <Layout>
      <div className="container mx-auto px-3 py-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍉</span>
              <h1 className="text-xl font-bold text-foreground">Fruit Slicer</h1>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold">{highScore}</span>
            </div>
          </div>

          {/* Game Area */}
          <div
            ref={gameRef}
            className="relative w-full rounded-xl overflow-hidden border-2 border-primary/30 select-none touch-none"
            style={{
              height: '450px',
              background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 40%, #334155 70%, #475569 100%)',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {/* Subtle background pattern */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
                style={{ left: `${(i * 8.3) % 100}%`, top: `${(i * 7.7 + 10) % 90}%`, animationDelay: `${i * 0.3}s` }}
              />
            ))}

            {/* Slice trail SVG */}
            {trailPath && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
                <path
                  d={trailPath}
                  fill="none"
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="drop-shadow(0 0 6px rgba(255,255,255,0.6))"
                />
                <path
                  d={trailPath}
                  fill="none"
                  stroke="rgba(168,85,247,0.6)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}

            {/* MENU */}
            {gameState === 'menu' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 z-10">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl">🍉</motion.div>
                <h2 className="text-2xl font-bold text-white">Fruit Slicer</h2>
                <p className="text-white/70 text-sm text-center px-8">
                  Swipe to slice fruits!<br />Avoid the bombs 💣
                </p>
                <div className="text-white/50 text-xs space-y-1 text-center">
                  <p>🍎🍊 = 10pts | 🍋🍇 = 15pts | 🍉🍓 = 20pts</p>
                  <p>🥝🍑 = 25pts | 🍍🥭 = 30pts</p>
                  <p>Chain slices for combo multipliers (up to 5x)!</p>
                </div>

                {/* Reward thresholds */}
                <div className="bg-white/10 rounded-lg p-3 mx-6 text-center">
                  <p className="text-yellow-300 text-xs font-semibold mb-1">🎁 Earn Discount Coupons!</p>
                  <div className="flex gap-3 justify-center text-xs text-white/70">
                    {REWARD_THRESHOLDS.map(t => (
                      <span key={t.score}>{t.score}pts = {t.discount}% off</span>
                    ))}
                  </div>
                  {!user && (
                    <p className="text-orange-300 text-xs mt-1">Login required to claim rewards</p>
                  )}
                </div>

                <Button onClick={startGame} className="gap-2 px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold">
                  <Play className="w-4 h-4" /> Play Game
                </Button>
              </div>
            )}

            {/* PLAYING */}
            {gameState === 'playing' && (
              <>
                <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10 pointer-events-none">
                  <div className="flex gap-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Heart key={i} className={`w-5 h-5 ${i < lives ? 'text-red-500 fill-red-500' : 'text-white/20'}`} />
                    ))}
                  </div>
                  <div className="bg-black/50 rounded-full px-3 py-1 text-white font-bold text-sm">
                    {score}
                  </div>
                  <div className="bg-black/50 rounded-full px-2 py-1 text-white/80 text-xs">
                    Lv.{level}
                  </div>
                </div>

                {/* Next reward hint */}
                {nextThreshold && (
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                    <span className="text-white/40 text-xs">🎁 {nextThreshold.score - score}pts to {nextThreshold.discount}% off</span>
                  </div>
                )}

                <AnimatePresence>
                  {showCombo && combo > 1 && (
                    <motion.div
                      initial={{ scale: 0, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="absolute top-14 left-1/2 -translate-x-1/2 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold px-3 py-1 rounded-full text-sm pointer-events-none"
                    >
                      {combo}x Combo! 🔥
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Fruits */}
                {fruits.map(fruit => (
                  <div
                    key={fruit.id}
                    className="absolute pointer-events-none z-20"
                    style={{
                      left: `${fruit.x}px`,
                      top: `${fruit.y}px`,
                      fontSize: '36px',
                      transform: 'translate(-50%, -50%)',
                      transition: 'none',
                    }}
                  >
                    {fruit.type}
                  </div>
                ))}

                {/* Slice effects */}
                <AnimatePresence>
                  {sliceEffects.map(eff => (
                    <motion.div
                      key={eff.id}
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 2, opacity: 0, y: -30 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      onAnimationComplete={() => setSliceEffects(prev => prev.filter(e => e.id !== eff.id))}
                      className="absolute pointer-events-none z-25 text-3xl"
                      style={{ left: eff.x, top: eff.y, transform: 'translate(-50%, -50%)' }}
                    >
                      {eff.emoji === '💥' ? '💥' : '✨'}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </>
            )}

            {/* GAME OVER */}
            {gameState === 'gameover' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-black/60 backdrop-blur-sm">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-5xl">
                  {score >= highScore && score > 0 ? '🏆' : '🍉'}
                </motion.div>
                <h2 className="text-2xl font-bold text-white">Game Over!</h2>
                <div className="text-center text-white/80">
                  <p className="text-lg">Score: <span className="font-bold text-primary">{score}</span></p>
                  <p className="text-sm">Level: {level}</p>
                  {score >= highScore && score > 0 && (
                    <p className="text-yellow-400 font-bold mt-1">🎉 New High Score!</p>
                  )}
                </div>

                {/* Reward section */}
                {earnedDiscount && !rewardClaimed && (
                  <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40 rounded-lg p-3 mx-6 text-center">
                    <p className="text-yellow-300 font-bold text-sm">🎁 You earned a {earnedDiscount}% off coupon!</p>
                    {user ? (
                      <Button onClick={handleClaimReward} size="sm" className="mt-2 gap-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                        <Gift className="w-3.5 h-3.5" /> Claim Reward
                      </Button>
                    ) : (
                      <Link to="/login">
                        <Button size="sm" className="mt-2 gap-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
                          <LogIn className="w-3.5 h-3.5" /> Login to Claim
                        </Button>
                      </Link>
                    )}
                  </div>
                )}

                {rewardClaimed && (
                  <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-3 mx-6 text-center">
                    <p className="text-green-300 font-bold text-sm">✅ Coupon claimed! Check your rewards.</p>
                  </div>
                )}

                {!earnedDiscount && (
                  <p className="text-white/50 text-xs">Score {REWARD_THRESHOLDS[0].score}+ to earn a coupon!</p>
                )}

                <Button onClick={startGame} className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold">
                  <RotateCcw className="w-4 h-4" /> Play Again
                </Button>
              </div>
            )}
          </div>

          {/* My Rewards */}
          {user && rewards.length > 0 && (
            <div className="mt-4 bg-card rounded-lg p-4 border">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Gift className="w-4 h-4 text-yellow-500" /> My Rewards
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {rewards.slice(0, 5).map(r => (
                  <div key={r.id} className={`flex items-center justify-between text-sm p-2 rounded-lg ${r.is_redeemed ? 'bg-muted/50 opacity-60' : 'bg-primary/5 border border-primary/20'}`}>
                    <div>
                      <span className="font-mono font-bold text-primary">{r.coupon_code}</span>
                      <span className="text-muted-foreground ml-2">{r.discount_percent}% off</span>
                    </div>
                    <span className={`text-xs ${r.is_redeemed ? 'text-muted-foreground' : 'text-green-500 font-semibold'}`}>
                      {r.is_redeemed ? 'Used' : 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* How to Play */}
          <div className="mt-4 bg-card rounded-lg p-4 border">
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <span className="text-lg">🍉</span> How to Play
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Swipe/drag across fruits to slice them</li>
              <li>• Different fruits give different points</li>
              <li>• Avoid slicing 💣 bombs — you lose a life!</li>
              <li>• Missing fruits also costs a life</li>
              <li>• Chain slices quickly for combo multipliers (up to 5x)</li>
              <li>• 🎁 Score 500+ to earn discount coupons!</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FruitGame;

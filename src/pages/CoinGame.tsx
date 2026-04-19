import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Trophy, Heart, Play, RotateCcw } from 'lucide-react';

interface Coin {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  type: 'gold' | 'silver' | 'diamond';
}

interface Bomb {
  id: number;
  x: number;
  y: number;
  speed: number;
}

const CoinGame = () => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('coinGameHighScore') || '0');
  });
  const [lives, setLives] = useState(3);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [bombs, setBombs] = useState<Bomb[]>([]);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const gameRef = useRef<HTMLDivElement>(null);
  const coinIdRef = useRef(0);
  const frameRef = useRef<number>();
  const lastSpawnRef = useRef(0);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    setCoins([]);
    setBombs([]);
    setLevel(1);
    setCombo(0);
  };

  const spawnCoin = useCallback(() => {
    const types: Coin['type'][] = ['gold', 'gold', 'gold', 'silver', 'diamond'];
    const type = types[Math.floor(Math.random() * types.length)];
    const coin: Coin = {
      id: coinIdRef.current++,
      x: Math.random() * 85 + 5,
      y: -10,
      size: type === 'diamond' ? 35 : type === 'silver' ? 30 : 28,
      speed: 1 + Math.random() * (0.5 + level * 0.3),
      type,
    };
    setCoins(prev => [...prev, coin]);
  }, [level]);

  const spawnBomb = useCallback(() => {
    if (Math.random() < 0.3 + level * 0.05) {
      const bomb: Bomb = {
        id: coinIdRef.current++,
        x: Math.random() * 85 + 5,
        y: -10,
        speed: 1.5 + Math.random() * level * 0.3,
      };
      setBombs(prev => [...prev, bomb]);
    }
  }, [level]);

  const collectCoin = (coinId: number, type: Coin['type']) => {
    const points = type === 'diamond' ? 50 : type === 'silver' ? 20 : 10;
    const comboMultiplier = Math.min(combo + 1, 5);
    setScore(prev => prev + points * comboMultiplier);
    setCombo(prev => prev + 1);
    setShowCombo(true);
    setTimeout(() => setShowCombo(false), 600);
    setCoins(prev => prev.filter(c => c.id !== coinId));
  };

  const hitBomb = (bombId: number) => {
    setBombs(prev => prev.filter(b => b.id !== bombId));
    setLives(prev => prev - 1);
    setCombo(0);
  };

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      const now = Date.now();

      // Spawn
      if (now - lastSpawnRef.current > Math.max(400, 1000 - level * 50)) {
        spawnCoin();
        spawnBomb();
        lastSpawnRef.current = now;
      }

      // Move coins down
      setCoins(prev => {
        const updated = prev.map(c => ({ ...c, y: c.y + c.speed }));
        const missed = updated.filter(c => c.y > 105);
        if (missed.length > 0) {
          setCombo(0);
        }
        return updated.filter(c => c.y <= 105);
      });

      // Move bombs down
      setBombs(prev => prev.map(b => ({ ...b, y: b.y + b.speed })).filter(b => b.y <= 105));

      frameRef.current = requestAnimationFrame(gameLoop);
    };

    lastSpawnRef.current = Date.now();
    frameRef.current = requestAnimationFrame(gameLoop);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [gameState, spawnCoin, spawnBomb, level]);

  // Level up
  useEffect(() => {
    if (gameState === 'playing') {
      setLevel(Math.floor(score / 200) + 1);
    }
  }, [score, gameState]);

  // Game over
  useEffect(() => {
    if (lives <= 0 && gameState === 'playing') {
      setGameState('gameover');
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('coinGameHighScore', score.toString());
      }
    }
  }, [lives, gameState, score, highScore]);

  const coinEmoji = (type: Coin['type']) => {
    if (type === 'diamond') return '💎';
    if (type === 'silver') return '🪙';
    return '🟡';
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-card border-b shrink-0">
        <div className="flex items-center gap-2">
          <Coins className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Coin Catcher</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold">{highScore}</span>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Exit ✕
          </button>
        </div>
      </div>

      {/* Game Area - Full Screen */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={gameRef}
          className="absolute inset-0 bg-gradient-to-b from-blue-950 via-indigo-950 to-purple-950 select-none"
        >
          {/* Stars background */}
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/40 rounded-full animate-pulse"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s` }}
            />
          ))}

          {gameState === 'menu' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-10">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-7xl md:text-8xl">🪙</motion.div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Coin Catcher</h2>
              <p className="text-white/70 text-base md:text-lg text-center px-8 max-w-md">Tap falling coins to collect them!<br />Avoid the bombs 💣</p>
              <div className="text-white/50 text-sm space-y-1 text-center">
                <p>🟡 Gold = 10pts | 🪙 Silver = 20pts | 💎 Diamond = 50pts</p>
                <p>Build combos for multipliers!</p>
              </div>
              <Button onClick={startGame} className="btn-primary-gradient gap-2 px-10 py-6 text-lg">
                <Play className="w-5 h-5" /> Play Game
              </Button>
            </div>
          )}

          {gameState === 'playing' && (
            <>
              {/* HUD */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                <div className="flex gap-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Heart key={i} className={`w-6 h-6 ${i < lives ? 'text-red-500 fill-red-500' : 'text-white/20'}`} />
                  ))}
                </div>
                <div className="bg-black/50 rounded-full px-4 py-2 text-white font-bold text-base">
                  Score: {score}
                </div>
                <div className="bg-black/50 rounded-full px-3 py-2 text-white/80 text-sm">
                  Lv.{level}
                </div>
              </div>

              {/* Combo indicator */}
              <AnimatePresence>
                {showCombo && combo > 1 && (
                  <motion.div
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-16 left-1/2 -translate-x-1/2 z-10 bg-gradient-to-r from-primary to-accent text-white font-bold px-4 py-2 rounded-full text-base"
                  >
                    {combo}x Combo! 🔥
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Coins */}
              <AnimatePresence>
                {coins.map(coin => (
                  <motion.button
                    key={coin.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    onClick={() => collectCoin(coin.id, coin.type)}
                    className="absolute cursor-pointer z-20 active:scale-150 transition-transform"
                    style={{
                      left: `${coin.x}%`,
                      top: `${coin.y}%`,
                      fontSize: `${coin.size}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {coinEmoji(coin.type)}
                  </motion.button>
                ))}
              </AnimatePresence>

              {/* Bombs */}
              <AnimatePresence>
                {bombs.map(bomb => (
                  <motion.button
                    key={bomb.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                    exit={{ scale: 2, opacity: 0 }}
                    onClick={() => hitBomb(bomb.id)}
                    className="absolute cursor-pointer z-20"
                    style={{
                      left: `${bomb.x}%`,
                      top: `${bomb.y}%`,
                      fontSize: '28px',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    💣
                  </motion.button>
                ))}
              </AnimatePresence>
            </>
          )}

          {gameState === 'gameover' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-black/60 backdrop-blur-sm">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl md:text-7xl">
                {score > highScore ? '🏆' : '💀'}
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-bold text-white">Game Over!</h2>
              <div className="text-center text-white/80 space-y-1">
                <p className="text-xl">Score: <span className="font-bold text-primary">{score}</span></p>
                <p className="text-base">Level Reached: {level}</p>
                {score >= highScore && score > 0 && (
                  <p className="text-yellow-400 font-bold mt-2 text-lg">🎉 New High Score!</p>
                )}
              </div>
              <div className="flex gap-3 mt-4">
                <Button onClick={startGame} className="btn-primary-gradient gap-2 px-8 py-6 text-lg">
                  <RotateCcw className="w-5 h-5" /> Play Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Panel - Bottom */}
      <div className="bg-card border-t px-4 py-3 shrink-0">
        <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2 text-sm">
          <Coins className="w-4 h-4 text-primary" /> How to Play
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>• Tap coins to collect</span>
          <span>• 🟡 Gold = 10 | 🪙 Silver = 20</span>
          <span>• Avoid 💣 bombs</span>
          <span>• 💎 Diamond = 50</span>
          <span>• Chain for combos</span>
          <span>• Speed increases</span>
        </div>
      </div>
    </div>
  );
};

export default CoinGame;
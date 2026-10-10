import { GameAdBanner } from '@/components/ads/GameAdBanner';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, ArrowLeft, Dices, Trophy, Star } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCoinWallet } from '@/hooks/useCoinWallet';
import { toast } from '@/hooks/use-toast';

// ---- Board model (15x15 classic Ludo, 2 players: red = you, green = computer) ----
const TRACK: [number, number][] = [
  [6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],
  [1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],
  [8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],
  [13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0],
];
const SAFE = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
const START: Record<Color, number> = { red: 0, green: 13 };
const BASE_SPOTS: Record<Color, [number, number][]> = {
  red: [[10,1],[10,4],[13,1],[13,4]],
  green: [[1,10],[1,13],[4,10],[4,13]],
};
const HOME = 56; // pos 51..55 home stretch, 56 = finished
const WIN_COINS = 5;
const MAX_WINS_PER_DAY = 3;
const WINS_KEY = 'trendra:ludo-wins';
const WELCOME_KEY = 'trendra:welcome-coins';

type Color = 'red' | 'green';
type Tokens = Record<Color, number[]>; // -1 base, 0..50 track (relative), 51..55 stretch, 56 home

const todayStr = () => new Date().toISOString().slice(0, 10);
const absIndex = (color: Color, pos: number) => (pos + START[color]) % 52;

function tokenCell(color: Color, pos: number, idx: number): [number, number] {
  if (pos < 0) return BASE_SPOTS[color][idx];
  if (pos >= HOME) return [7, 7];
  if (pos > 50) return color === 'red' ? [7, pos - 50] : [14 - (pos - 50), 7];
  return TRACK[absIndex(color, pos)];
}

function movableTokens(tokens: number[], dice: number): number[] {
  const out: number[] = [];
  tokens.forEach((p, i) => {
    if (p >= HOME) return;
    if (p < 0) { if (dice === 6) out.push(i); return; }
    if (p + dice <= HOME) out.push(i);
  });
  return out;
}

const freshTokens = (): Tokens => ({ red: [-1, -1, -1, -1], green: [-1, -1, -1, -1] });

// Dice pip layouts (positions in a 3x3 grid, 0..8)
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const DiceFace = ({ value, rolling }: { value: number | null; rolling: boolean }) => {
  if (rolling) {
    return (
      <motion.div
        animate={{ rotate: [0, 180, 360], scale: [1, 1.15, 1] }}
        transition={{ duration: 0.55, ease: 'easeInOut' }}
        className="w-16 h-16 rounded-2xl bg-white shadow-[0_6px_16px_rgba(0,0,0,0.25),inset_0_-3px_6px_rgba(0,0,0,0.12)] border border-slate-200 flex items-center justify-center"
      >
        <Dices className="w-8 h-8 text-slate-700" />
      </motion.div>
    );
  }
  if (value === null) {
    return (
      <div className="w-16 h-16 rounded-2xl bg-white/60 border-2 border-dashed border-slate-300 flex items-center justify-center text-2xl">
        🎲
      </div>
    );
  }
  return (
    <motion.div
      key={value}
      initial={{ scale: 0.6, rotate: -30 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      className="w-16 h-16 rounded-2xl bg-white shadow-[0_6px_16px_rgba(0,0,0,0.25),inset_0_-3px_6px_rgba(0,0,0,0.12)] border border-slate-200 p-2.5 grid grid-cols-3 grid-rows-3"
    >
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} className="flex items-center justify-center">
          {PIPS[value].includes(i) && <div className="w-2.5 h-2.5 rounded-full bg-slate-800 shadow-inner" />}
        </div>
      ))}
    </motion.div>
  );
};

const Ludo = () => {
  const { user } = useAuth();
  const { balance, addCoins } = useCoinWallet();
  const [tokens, setTokens] = useState<Tokens>(freshTokens);
  const [turn, setTurn] = useState<Color>('red');
  const [dice, setDice] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [message, setMessage] = useState('Dice roll karke shuru karein! 🎲');
  const [winner, setWinner] = useState<Color | null>(null);
  const [lastMoved, setLastMoved] = useState<{ color: Color; idx: number } | null>(null);
  const [winsToday, setWinsToday] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(WINS_KEY) || '{}');
      return raw.date === todayStr() ? raw.count : 0;
    } catch { return 0; }
  });
  const busyRef = useRef(false);

  // Welcome bonus: 10 free coins, first time only
  useEffect(() => {
    if (!user) return;
    if (localStorage.getItem(WELCOME_KEY)) return;
    localStorage.setItem(WELCOME_KEY, '1');
    addCoins(10).then((ok) => {
      if (ok !== null) toast({ title: '🎁 10 welcome coins mile!', description: 'Trendra me aapka swagat hai.' });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const recordWin = useCallback(() => {
    const next = winsToday + 1;
    setWinsToday(next);
    localStorage.setItem(WINS_KEY, JSON.stringify({ date: todayStr(), count: next }));
    return next;
  }, [winsToday]);

  const applyMove = useCallback((color: Color, idx: number, diceVal: number, current: Tokens): { next: Tokens; extra: boolean; note: string } => {
    const next: Tokens = { red: [...current.red], green: [...current.green] };
    const mine = next[color];
    let extra = diceVal === 6;
    let note = '';
    if (mine[idx] < 0) {
      mine[idx] = 0;
      note = `${color === 'red' ? 'Aapki' : 'Computer ki'} goti bahar aayi!`;
    } else {
      mine[idx] += diceVal;
      if (mine[idx] === HOME) {
        extra = true;
        note = color === 'red' ? '🏠 Goti ghar pahunchi!' : 'Computer ki goti ghar pahunchi.';
      } else if (mine[idx] <= 50) {
        const abs = absIndex(color, mine[idx]);
        if (!SAFE.has(abs)) {
          const other: Color = color === 'red' ? 'green' : 'red';
          let captured = false;
          next[other] = next[other].map((p) => {
            if (p >= 0 && p <= 50 && absIndex(other, p) === abs) { captured = true; return -1; }
            return p;
          });
          if (captured) {
            extra = true;
            note = color === 'red' ? '💥 Aapne computer ki goti kaati!' : '😖 Computer ne aapki goti kaat di!';
          }
        }
      }
    }
    return { next, extra, note };
  }, []);

  const finishIfWon = useCallback((t: Tokens): Color | null => {
    if (t.red.every((p) => p >= HOME)) return 'red';
    if (t.green.every((p) => p >= HOME)) return 'green';
    return null;
  }, []);

  const endTurn = useCallback((t: Tokens, nextTurn: Color, note: string) => {
    const w = finishIfWon(t);
    if (w) {
      setWinner(w);
      if (w === 'red') {
        setMessage('🎉 Aap jeet gaye!');
        if (!user) {
          toast({ title: 'Jeet!', description: 'Coins ke liye login karein.' });
        } else if (winsToday >= MAX_WINS_PER_DAY) {
          toast({ title: '🎉 Jeet!', description: 'Aaj ke Ludo coins ki limit poori — kal phir khelein.' });
        } else {
          const n = recordWin();
          addCoins(WIN_COINS).then((ok) => {
            if (ok !== null) toast({ title: `🎉 ${WIN_COINS} coins jeete! (${n}/${MAX_WINS_PER_DAY} aaj)` });
          });
        }
      } else {
        setMessage('🤖 Computer jeet gaya — phir try karein!');
      }
      return;
    }
    setTurn(nextTurn);
    setDice(null);
    if (note) setMessage(note);
  }, [addCoins, finishIfWon, recordWin, user, winsToday]);

  // ---- Player roll ----
  const rollDice = () => {
    if (turn !== 'red' || rolling || winner || busyRef.current) return;
    setRolling(true);
    const val = 1 + Math.floor(Math.random() * 6);
    setTimeout(() => {
      setDice(val);
      setRolling(false);
      const moves = movableTokens(tokens.red, val);
      if (moves.length === 0) {
        setMessage(`🎲 ${val} aaya — koi chaal nahi, computer ki baari.`);
        busyRef.current = true;
        setTimeout(() => { busyRef.current = false; endTurn(tokens, 'green', ''); }, 1200);
      } else {
        setMessage(`🎲 ${val} aaya — goti chunein!`);
      }
    }, 600);
  };

  const playToken = (idx: number) => {
    if (turn !== 'red' || dice === null || rolling || winner) return;
    if (!movableTokens(tokens.red, dice).includes(idx)) return;
    const { next, extra, note } = applyMove('red', idx, dice, tokens);
    setTokens(next);
    setLastMoved({ color: 'red', idx });
    setDice(null);
    if (extra && !finishIfWon(next)) {
      setMessage(note ? `${note} Ek aur roll!` : 'Ek aur roll!');
      setTurn('red');
    } else {
      endTurn(next, 'green', note);
    }
  };

  // ---- Computer turn ----
  useEffect(() => {
    if (turn !== 'green' || winner) return;
    let cancelled = false;
    const step = () => {
      if (cancelled) return;
      setRolling(true);
      const val = 1 + Math.floor(Math.random() * 6);
      setTimeout(() => {
        if (cancelled) return;
        setDice(val);
        setRolling(false);
        setTokens((current) => {
          const moves = movableTokens(current.green, val);
          if (moves.length === 0) {
            setMessage(`🤖 Computer ko ${val} — koi chaal nahi. Aapki baari!`);
            setTimeout(() => { if (!cancelled) endTurn(current, 'red', ''); }, 900);
            return current;
          }
          // Simple AI: capture > reach home > leave base > token closest to home
          let pick = moves[0];
          let best = -Infinity;
          for (const i of moves) {
            const p = current.green[i];
            let score = p < 0 ? 50 : p;
            const np = p < 0 ? 0 : p + val;
            if (np <= 50 && !SAFE.has(absIndex('green', np))) {
              const abs = absIndex('green', np);
              if (current.red.some((rp) => rp >= 0 && rp <= 50 && absIndex('red', rp) === abs)) score += 1000;
            }
            if (np === HOME) score += 500;
            if (score > best) { best = score; pick = i; }
          }
          const { next, extra, note } = applyMove('green', pick, val, current);
          setLastMoved({ color: 'green', idx: pick });
          setMessage(note || `🤖 Computer ne ${val} khela.`);
          setTimeout(() => {
            if (cancelled) return;
            if (extra && !finishIfWon(next)) step();
            else endTurn(next, 'red', '');
          }, 900);
          return next;
        });
      }, 700);
    };
    const t = setTimeout(step, 800);
    return () => { cancelled = true; clearTimeout(t); };
  }, [turn, winner, applyMove, endTurn, finishIfWon]);

  const reset = () => {
    setTokens(freshTokens());
    setTurn('red');
    setDice(null);
    setWinner(null);
    setLastMoved(null);
    setMessage('Naya game — dice roll karein! 🎲');
  };

  // ---- Board rendering ----
  const cellClass = (r: number, c: number): string => {
    if (r >= 9 && r <= 14 && c <= 5) return 'bg-gradient-to-br from-red-500 to-red-600'; // red yard
    if (r <= 5 && c >= 9) return 'bg-gradient-to-br from-green-500 to-green-600'; // green yard
    if (r <= 5 && c <= 5) return 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700';
    if (r >= 9 && c >= 9) return 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700';
    if (r === 7 && c >= 1 && c <= 5) return 'bg-red-200 dark:bg-red-300'; // red home stretch
    if (c === 7 && r >= 9 && r <= 13) return 'bg-green-200 dark:bg-green-300'; // green home stretch
    if (r >= 6 && r <= 8 && c >= 6 && c <= 8) return 'bg-slate-900'; // center
    return 'bg-white dark:bg-slate-100';
  };

  const isSafeCell = (r: number, c: number) => TRACK.some(([tr, tc], i) => tr === r && tc === c && SAFE.has(i));
  const isStartCell = (r: number, c: number, color: Color) => {
    const [sr, sc] = TRACK[START[color]];
    return sr === r && sc === c;
  };

  const tokensAt = (r: number, c: number) => {
    const list: { color: Color; idx: number }[] = [];
    (['red', 'green'] as Color[]).forEach((color) => {
      tokens[color].forEach((p, i) => {
        const [tr, tc] = tokenCell(color, p, i);
        if (tr === r && tc === c) list.push({ color, idx: i });
      });
    });
    return list;
  };

  const playable = turn === 'red' && dice !== null && !rolling && !winner
    ? movableTokens(tokens.red, dice)
    : [];

  const homeCount = (color: Color) => tokens[color].filter((p) => p >= HOME).length;

  const cells = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const here = tokensAt(r, c);
      const yardInner =
        (r >= 10 && r <= 13 && c >= 1 && c <= 4) || (r >= 1 && r <= 4 && c >= 10 && c <= 13);
      const isCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;
      cells.push(
        <div
          key={`${r}-${c}`}
          className={`relative aspect-square border border-slate-300/50 flex items-center justify-center ${cellClass(r, c)} ${yardInner ? '!bg-white dark:!bg-slate-50 rounded-full scale-[0.92] shadow-inner' : ''}`}
        >
          {isSafeCell(r, c) && <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 fill-amber-400" />}
          {isStartCell(r, c, 'red') && <span className="absolute inset-0 bg-red-400/60" />}
          {isStartCell(r, c, 'green') && <span className="absolute inset-0 bg-green-400/60" />}
          {r === 7 && c === 7 && <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 fill-amber-400" />}
          {isCenter && r === 6 && c === 6 && <span className="absolute inset-0 bg-gradient-to-br from-red-500/70 to-transparent" />}
          {isCenter && r === 8 && c === 8 && <span className="absolute inset-0 bg-gradient-to-tl from-green-500/70 to-transparent" />}
          <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-[1px] p-[1px]">
            {here.map(({ color, idx }) => {
              const canPlay = color === 'red' && playable.includes(idx);
              const justMoved = lastMoved?.color === color && lastMoved?.idx === idx;
              return (
                <motion.button
                  key={`${color}-${idx}`}
                  onClick={() => canPlay && playToken(idx)}
                  disabled={!canPlay}
                  initial={justMoved ? { scale: 0.3 } : false}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  className={`relative rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.35),inset_0_-2px_3px_rgba(0,0,0,0.3),inset_0_2px_2px_rgba(255,255,255,0.4)] transition-transform ${
                    color === 'red'
                      ? 'bg-gradient-to-br from-red-400 to-red-700 border border-red-900'
                      : 'bg-gradient-to-br from-green-400 to-green-700 border border-green-900'
                  } ${here.length > 1 ? 'w-2.5 h-2.5 sm:w-3 sm:h-3' : 'w-3.5 h-3.5 sm:w-5 sm:h-5'} ${
                    canPlay ? 'ring-2 ring-yellow-300 ring-offset-1 animate-bounce cursor-pointer z-10' : ''
                  }`}
                  aria-label={`${color} goti ${idx + 1}`}
                >
                  <span className="absolute top-[15%] left-[20%] w-[35%] h-[25%] rounded-full bg-white/50" />
                </motion.button>
              );
            })}
          </div>
        </div>
      );
    }
  }

  return (
    <Layout>
      <GameAdBanner />
      <div className="container mx-auto px-4 py-6 max-w-xl text-center">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-3 hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-red-600 via-amber-500 to-green-600 bg-clip-text text-transparent">
          🎲 Trendra Ludo
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Free game — computer ke against! Jeetne par {WIN_COINS} coins (din me {MAX_WINS_PER_DAY} baar tak). Koi entry fee nahi.
        </p>
        {user && (
          <div className="inline-flex items-center gap-1 mt-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 text-sm font-bold shadow-md">
            <Coins className="w-4 h-4" /> {balance} coins
          </div>
        )}

        {/* Turn indicator */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            turn === 'red' && !winner ? 'bg-red-500 text-white shadow-lg scale-105' : 'bg-muted text-muted-foreground'
          }`}>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-red-900" />
            Aap ({homeCount('red')}/4 🏠)
          </div>
          <span className="text-muted-foreground text-xs font-semibold">VS</span>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            turn === 'green' && !winner ? 'bg-green-500 text-white shadow-lg scale-105' : 'bg-muted text-muted-foreground'
          }`}>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-green-900" />
            Computer ({homeCount('green')}/4 🏠)
          </div>
        </div>

        <div className="mt-4 mx-auto w-full max-w-[520px] rounded-2xl overflow-hidden shadow-2xl ring-4 ring-slate-700/20 border border-border">
          <div className="grid" style={{ gridTemplateColumns: 'repeat(15, 1fr)' }}>
            {cells}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-5">
          <DiceFace value={dice} rolling={rolling} />
          <Button
            size="lg"
            onClick={rollDice}
            disabled={turn !== 'red' || rolling || dice !== null || !!winner}
            className="font-bold rounded-xl px-6 shadow-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0"
          >
            {turn === 'red' ? (dice !== null ? 'Goti chunein 👆' : '🎲 Roll karein') : '🤖 Computer khel raha...'}
          </Button>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={message}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-3 text-sm font-medium text-foreground min-h-[1.5rem]"
          >
            {message}
          </motion.p>
        </AnimatePresence>

        {winner && (
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
            className="mt-3 p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950/40 dark:to-yellow-950/40 border-2 border-amber-300 shadow-xl"
          >
            <p className="text-2xl font-extrabold text-foreground">
              {winner === 'red' ? '🎉 Aap jeet gaye!' : '🤖 Computer jeet gaya!'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {winner === 'red' ? `+${WIN_COINS} coins (limit: ${MAX_WINS_PER_DAY}/din)` : 'Koi baat nahi — ek aur game?'}
            </p>
            <Button onClick={reset} className="mt-3 font-bold">🔄 Naya game</Button>
          </motion.div>
        )}

        <div className="mt-6 flex gap-2 justify-center flex-wrap">
          <Button asChild variant="outline" className="rounded-xl"><Link to="/spin-wheel">🎡 Spin Wheel</Link></Button>
          <Button asChild variant="outline" className="rounded-xl"><Link to="/hill-climb">🏎️ Hill Climb</Link></Button>
          <Button asChild variant="outline" className="rounded-xl"><Link to="/redeem">💰 Coins redeem</Link></Button>
        </div>
      </div>
    </Layout>
  );
};

export default Ludo;

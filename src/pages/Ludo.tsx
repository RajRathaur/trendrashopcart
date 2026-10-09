import { GameAdBanner } from '@/components/ads/GameAdBanner';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coins, ArrowLeft, Dices } from 'lucide-react';
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

const Ludo = () => {
  const { user } = useAuth();
  const { balance, addCoins } = useCoinWallet();
  const [tokens, setTokens] = useState<Tokens>({ red: [-1, -1], green: [-1, -1] });
  const [turn, setTurn] = useState<Color>('red');
  const [dice, setDice] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [message, setMessage] = useState('Dice roll karke shuru karein! 🎲');
  const [winner, setWinner] = useState<Color | null>(null);
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
          // Simple AI: capture > leave base > token closest to home
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
    setTokens({ red: [-1, -1], green: [-1, -1] });
    setTurn('red');
    setDice(null);
    setWinner(null);
    setMessage('Naya game — dice roll karein! 🎲');
  };

  // ---- Board rendering ----
  const cellClass = (r: number, c: number): string => {
    if (r >= 9 && r <= 14 && c <= 5) return 'bg-red-500/90'; // red yard
    if (r <= 5 && c >= 9) return 'bg-green-500/90'; // green yard
    if (r <= 5 && c <= 5) return 'bg-amber-300/40'; // unused yards (decor)
    if (r >= 9 && c >= 9) return 'bg-sky-300/40';
    if (r === 7 && c >= 1 && c <= 5) return 'bg-red-300'; // red home stretch
    if (c === 7 && r >= 9 && r <= 13) return 'bg-green-300'; // green home stretch
    if (r >= 6 && r <= 8 && c >= 6 && c <= 8) return 'bg-slate-800'; // center
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

  const cells = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const here = tokensAt(r, c);
      const yardInner =
        (r >= 10 && r <= 13 && c >= 1 && c <= 4) || (r >= 1 && r <= 4 && c >= 10 && c <= 13);
      cells.push(
        <div
          key={`${r}-${c}`}
          className={`relative aspect-square border border-slate-300/60 flex items-center justify-center ${cellClass(r, c)} ${yardInner ? 'bg-white/90 dark:bg-white/90' : ''}`}
        >
          {isSafeCell(r, c) && <span className="text-[8px] sm:text-[10px] text-slate-500">★</span>}
          {isStartCell(r, c, 'red') && <span className="absolute inset-0 bg-red-400/50" />}
          {isStartCell(r, c, 'green') && <span className="absolute inset-0 bg-green-400/50" />}
          {r === 7 && c === 7 && <span className="text-[10px]">🏆</span>}
          <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-[1px]">
            {here.map(({ color, idx }) => {
              const canPlay = color === 'red' && playable.includes(idx);
              return (
                <button
                  key={`${color}-${idx}`}
                  onClick={() => canPlay && playToken(idx)}
                  disabled={!canPlay}
                  className={`rounded-full border-2 shadow transition-transform ${
                    color === 'red' ? 'bg-red-600 border-red-900' : 'bg-green-600 border-green-900'
                  } ${here.length > 1 ? 'w-2.5 h-2.5 sm:w-3 sm:h-3' : 'w-3.5 h-3.5 sm:w-5 sm:h-5'} ${
                    canPlay ? 'ring-2 ring-yellow-400 animate-pulse scale-110 cursor-pointer' : ''
                  }`}
                  aria-label={`${color} goti ${idx + 1}`}
                />
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
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <ArrowLeft className="w-4 h-4" /> Home
        </Link>
        <h1 className="text-2xl font-bold text-foreground">🎲 Trendra Ludo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Free game — computer ke against! Jeetne par {WIN_COINS} coins (din me {MAX_WINS_PER_DAY} baar tak). Koi entry fee nahi.
        </p>
        {user && (
          <div className="inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold">
            <Coins className="w-4 h-4" /> {balance} coins
          </div>
        )}

        <div className="mt-4 mx-auto w-full max-w-[520px] rounded-xl overflow-hidden shadow-xl border border-border">
          <div className="grid" style={{ gridTemplateColumns: 'repeat(15, 1fr)' }}>
            {cells}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4">
          <motion.div
            key={dice ?? 'idle'}
            initial={{ rotate: rolling ? 360 : 0, scale: rolling ? 1.2 : 1 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-16 h-16 rounded-xl bg-card border-2 border-primary shadow-lg flex items-center justify-center text-3xl font-extrabold text-foreground"
          >
            {rolling ? <Dices className="w-8 h-8 animate-spin" /> : dice ?? '🎲'}
          </motion.div>
          <Button
            size="lg"
            onClick={rollDice}
            disabled={turn !== 'red' || rolling || dice !== null || !!winner}
            className="font-bold"
          >
            {turn === 'red' ? (dice !== null ? 'Goti chunein' : 'Roll karein') : '🤖 Computer khel raha...'}
          </Button>
        </div>

        <p className="mt-3 text-sm font-medium text-foreground min-h-[1.5rem]">{message}</p>

        {winner && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-2">
            <p className="text-xl font-bold text-foreground">
              {winner === 'red' ? '🎉 Aap jeet gaye!' : '🤖 Computer jeet gaya!'}
            </p>
            <Button onClick={reset} className="mt-3">Naya game</Button>
          </motion.div>
        )}

        <div className="mt-6 flex gap-2 justify-center flex-wrap">
          <Button asChild variant="outline"><Link to="/spin-wheel">🎡 Spin Wheel</Link></Button>
          <Button asChild variant="outline"><Link to="/hill-climb">🏎️ Hill Climb</Link></Button>
          <Button asChild variant="outline"><Link to="/redeem">Coins redeem</Link></Button>
        </div>
      </div>
    </Layout>
  );
};

export default Ludo;

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Coins } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCoinWallet } from '@/hooks/useCoinWallet';
import { toast } from '@/hooks/use-toast';

// Terrain height (world units, y up) at world x
const terrain = (x: number) => {
  const d = Math.max(0, x - 300) / 4000; // gets hillier with distance
  return 120 + Math.sin(x / 180) * (30 + 60 * Math.min(d, 1.5)) + Math.sin(x / 67) * (8 + 15 * Math.min(d, 1)) + Math.sin(x / 400) * 50;
};

const GRAVITY = 900;
const ENGINE = 420;
const BRAKE = 500;
const DRAG = 0.35;
const MAX_FUEL = 100;
const LEVEL_M = 100; // every 100m = 1 level
const COINS_PER_LEVEL = 3;

type Pickup = { x: number; kind: 'coin' | 'fuel'; taken: boolean };

const makePickups = (): Pickup[] => {
  const out: Pickup[] = [];
  for (let x = 400; x < 60000; x += 140) out.push({ x, kind: 'coin', taken: false });
  for (let x = 1500; x < 60000; x += 1500 + Math.floor(x / 20)) out.push({ x, kind: 'fuel', taken: false });
  return out;
};

const HillClimb = () => {
  const { user } = useAuth();
  const { addCoins } = useCoinWallet();
  const addCoinsRef = useRef(addCoins);
  addCoinsRef.current = addCoins;
  const userRef = useRef(user);
  userRef.current = user;
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const input = useRef({ gas: false, brake: false });
  const [state, setState] = useState<'menu' | 'playing' | 'over'>('menu');
  const [hud, setHud] = useState({ dist: 0, coins: 0, fuel: MAX_FUEL, level: 1 });
  const [best, setBest] = useState(() => parseInt(localStorage.getItem('hillClimbBest') || '0'));
  const [reason, setReason] = useState('');

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (['ArrowRight', 'd', 'D'].includes(e.key)) input.current.gas = true;
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) input.current.brake = true;
    };
    const up = (e: KeyboardEvent) => {
      if (['ArrowRight', 'd', 'D'].includes(e.key)) input.current.gas = false;
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) input.current.brake = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  useEffect(() => {
    if (state !== 'playing') return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    ctx.imageSmoothingQuality = 'high';
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    const car = { x: 100, y: terrain(100) + 20, vx: 0, vy: 0, angle: 0, av: 0, air: false };
    let fuel = MAX_FUEL, coins = 0, airTime = 0;
    const pickups = makePickups();
    let last = performance.now();
    let raf = 0;
    let hudTimer = 0;
    let ended = false;

    const end = (why: string) => {
      if (ended) return;
      ended = true;
      const dist = Math.floor(car.x / 10);
      setReason(why);
      const levels = Math.floor(dist / LEVEL_M);
      setHud({ dist, coins, fuel: Math.max(0, fuel), level: levels + 1 });
      setBest((b) => {
        const nb = Math.max(b, dist);
        localStorage.setItem('hillClimbBest', String(nb));
        return nb;
      });
      setState('over');
      const earned = levels * COINS_PER_LEVEL;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      if (earned > 0 && userRef.current) {
        addCoinsRef.current(earned).then((r) => r !== null && toast({ title: `🪙 ${earned} coins wallet me jude! (${levels} level × 3)` }));
      }
    };

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      const { gas, brake } = input.current;
      const throttle = fuel > 0 ? (gas ? 1 : 0) - (brake ? 1 : 0) : 0;
      if (throttle !== 0) fuel -= dt * 6;
      else fuel -= dt * 1.5;

      const ground = terrain(car.x);
      const slope = Math.atan2(terrain(car.x + 4) - terrain(car.x - 4), 8);

      if (!car.air) {
        // drive along slope
        const along = Math.cos(slope) * car.vx + Math.sin(slope) * car.vy;
        let a = -GRAVITY * Math.sin(slope) + throttle * (throttle > 0 ? ENGINE : BRAKE) - DRAG * along;
        let v = along + a * dt;
        car.vx = Math.cos(slope) * v;
        car.vy = Math.sin(slope) * v;
        car.x += car.vx * dt;
        const ng = terrain(car.x);
        const nslope = Math.atan2(terrain(car.x + 4) - terrain(car.x - 4), 8);
        // launch if terrain falls away faster than the car can follow
        if (car.vx > 0 && nslope < slope - 0.02 && v > 260) {
          car.air = true;
          car.y = ng + 0.5;
          car.av = (nslope - slope) * 2;
        } else {
          car.y = ng;
          car.angle += (nslope - car.angle) * Math.min(1, dt * 15);
        }
      } else {
        car.vy -= GRAVITY * dt;
        car.x += car.vx * dt;
        car.y += car.vy * dt;
        airTime += dt;
        // tilt control in air: gas leans back, brake leans forward
        car.av += throttle * 3 * dt;
        car.angle += car.av * dt;
        const g = terrain(car.x);
        if (car.y <= g) {
          const s = Math.atan2(terrain(car.x + 4) - terrain(car.x - 4), 8);
          let diff = Math.abs(((car.angle - s + Math.PI) % (Math.PI * 2)) - Math.PI);
          if (diff > 1.6) { end('Gaadi palat gayi! 🙃'); return; }
          if (airTime > 0.6) coins += 2; // air-time bonus
          car.air = false; airTime = 0; car.av = 0; car.y = g; car.angle = s;
          const v = Math.cos(s) * car.vx + Math.sin(s) * car.vy;
          car.vx = Math.cos(s) * v; car.vy = Math.sin(s) * v;
        }
      }
      if (car.x < 20) { car.x = 20; car.vx = Math.max(0, car.vx); }

      for (const p of pickups) {
        if (p.taken || Math.abs(p.x - car.x) > 25) continue;
        const py = terrain(p.x) + 30;
        if (Math.abs(py - (car.y + 15)) < 45) {
          p.taken = true;
          if (p.kind === 'coin') coins += 1; else fuel = MAX_FUEL;
        }
      }
      if (fuel <= 0 && Math.abs(car.vx) < 5 && !car.air) { end('Petrol khatam! ⛽'); return; }

      // ---- draw ----
      const W = canvas.width / dpr, H = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#7cc6f2'); sky.addColorStop(1, '#d9f1ff');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      // sun & clouds
      ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.arc(W - 60, 50, 26, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (let i = 0; i < 4; i++) {
        const cx = ((i * 260 - car.x * 0.15) % (W + 200) + W + 200) % (W + 200) - 100;
        ctx.beginPath(); ctx.ellipse(cx, 40 + i * 18, 40, 14, 0, 0, 7); ctx.fill();
      }
      const camX = car.x - W * 0.3;
      const camY = car.y - H * 0.45;
      const sx = (x: number) => x - camX;
      const sy = (y: number) => H - (y - camY);
      // far hills
      ctx.fillStyle = '#9fd39a';
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 10) ctx.lineTo(x, H * 0.62 - Math.sin((x + camX * 0.3) / 140) * 30);
      ctx.lineTo(W, H); ctx.fill();
      // ground
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 6) ctx.lineTo(x, sy(terrain(camX + x)));
      ctx.lineTo(W, H); ctx.closePath();
      ctx.fillStyle = '#8b5a2b'; ctx.fill();
      ctx.lineWidth = 10; ctx.strokeStyle = '#4caf50';
      ctx.beginPath();
      for (let x = 0; x <= W; x += 6) { const y = sy(terrain(camX + x)); x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
      // pickups
      ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const p of pickups) {
        if (p.taken) continue;
        const px = sx(p.x);
        if (px < -30 || px > W + 30) continue;
        ctx.fillText(p.kind === 'coin' ? '🪙' : '⛽', px, sy(terrain(p.x) + 30));
      }
      // car
      ctx.save();
      ctx.translate(sx(car.x), sy(car.y));
      ctx.rotate(-car.angle);
      ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
      const body = ctx.createLinearGradient(0, -30, 0, -12);
      body.addColorStop(0, '#ff6b5e'); body.addColorStop(1, '#b71c1c');
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.roundRect(-30, -30, 60, 18, 6); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-26, -28, 52, 3);
      ctx.fillStyle = '#ffca28';
      ctx.beginPath(); ctx.roundRect(-14, -44, 26, 15, 4); ctx.fill();
      ctx.font = '16px sans-serif'; ctx.fillText('🧒', 0, -38);
      const t = car.x / 12;
      for (const wx of [-20, 20]) {
        ctx.save(); ctx.translate(wx, -8); ctx.rotate(t);
        ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, 7); ctx.fill();
        ctx.fillStyle = '#bdbdbd'; ctx.fillRect(-2, -8, 4, 16);
        ctx.restore();
      }
      ctx.restore();

      hudTimer += dt;
      if (hudTimer > 0.1) { hudTimer = 0; const d = Math.floor(car.x / 10); setHud({ dist: d, coins, fuel: Math.max(0, fuel), level: Math.floor(d / LEVEL_M) + 1 }); }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [state]);

  const start = () => {
    const el = wrapRef.current as any;
    if (el && !document.fullscreenElement && el.requestFullscreen) {
      el.requestFullscreen().then(() => (screen.orientation as any)?.lock?.('landscape').catch(() => {})).catch(() => {});
    }
    setState('playing');
  };

  const pedal = (k: 'gas' | 'brake') => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); input.current[k] = true; },
    onPointerUp: () => { input.current[k] = false; },
    onPointerLeave: () => { input.current[k] = false; },
    onPointerCancel: () => { input.current[k] = false; },
  });

  return (
    <Layout hideFooter>
      <div className="container mx-auto px-3 py-4 max-w-3xl">
        <div className="flex items-center justify-between mb-2">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="w-4 h-4" /> Home</Link>
          <h1 className="text-lg font-bold text-foreground">🏎️ Hill Climb Racing</h1>
          <span className="text-xs text-muted-foreground">Best: {best}m</span>
        </div>

        <div ref={wrapRef} className={`${state === 'playing' ? 'fixed inset-0 z-[100] rounded-none' : 'relative w-full h-[60svh] min-h-[320px] rounded-xl'} overflow-hidden bg-secondary select-none touch-none`}>
          <canvas ref={canvasRef} className="w-full h-full block" />
          {state === 'playing' && (
            <>
              <div className="absolute top-2 left-2 right-2 flex items-center gap-2 text-sm font-bold">
                <span className="px-2 py-1 rounded bg-card/90 text-foreground">Lv {hud.level}</span>
                <span className="px-2 py-1 rounded bg-card/90 text-foreground">{hud.dist}m</span>
                <span className="px-2 py-1 rounded bg-card/90 text-foreground inline-flex items-center gap-1"><Coins className="w-4 h-4" />{hud.coins}</span>
                <div className="flex-1 h-3 rounded-full bg-card/90 overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${hud.fuel}%` }} />
                </div>
                <span>⛽</span>
              </div>
              <button {...pedal('brake')} className="absolute bottom-3 left-3 w-24 h-24 rounded-2xl bg-card/90 text-foreground font-bold text-lg shadow-lg active:scale-95">BRAKE</button>
              <button {...pedal('gas')} className="absolute bottom-3 right-3 w-24 h-24 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-lg active:scale-95">GAS</button>
            </>
          )}
          {state !== 'playing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 text-center p-4">
              {state === 'menu' ? (
                <>
                  <div className="text-5xl">🏎️⛰️</div>
                  <p className="text-foreground font-semibold">Pahadon par gaadi chalao! Har 100m = 1 level, har level paar karne par 3 coins.</p>
                  <p className="text-xs text-muted-foreground">GAS = aage / hawa me peeche jhuko · BRAKE = peeche / hawa me aage jhuko · Gaadi palti to game over</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-foreground">{reason}</p>
                  <p className="text-foreground">{hud.dist}m · Level {hud.level - 1} paar · +{(hud.level - 1) * 3} coins</p>
                  <p className="text-xs text-muted-foreground">{user ? 'Coins aapke wallet me jud gaye' : 'Login karke khelein to coins wallet me judenge'}</p>
                </>
              )}
              <Button size="lg" onClick={start}>{state === 'menu' ? 'Start' : 'Phir khelo'}</Button>
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-2 justify-center">
          <Button asChild variant="outline"><Link to="/spin-wheel">🎡 Spin the Wheel</Link></Button>
          <Button asChild variant="outline"><Link to="/fruit-game">🍉 Fruit Slicer</Link></Button>
        </div>
      </div>
    </Layout>
  );
};

export default HillClimb;

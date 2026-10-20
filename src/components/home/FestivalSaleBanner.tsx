import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useSiteContent } from '@/hooks/useSiteContent';
import { Button } from '@/components/ui/button';
import { FestivalSale, SALE_PRESETS, getSaleStatus, getTimeLeft, parseSale } from '@/lib/festivalSale';

const pad = (n: number) => String(n).padStart(2, '0');

const TimeBox = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <span className="min-w-[2.6rem] sm:min-w-[3.2rem] rounded-md bg-festive-foreground/95 text-festive-deep text-lg sm:text-2xl font-extrabold tabular-nums px-1.5 py-1 text-center shadow-sm">
      {pad(value)}
    </span>
    <span className="mt-1 text-[10px] uppercase tracking-wider text-festive-foreground/80">{label}</span>
  </div>
);

/** Pure visual banner — used on homepage and in admin preview. */
export const FestivalSaleCard = ({ sale, now }: { sale: FestivalSale; now: Date }) => {
  const [copied, setCopied] = useState(false);
  const preset = SALE_PRESETS[sale.theme];
  const status = getSaleStatus(sale, now);
  const target = status === 'scheduled' && sale.startAt ? sale.startAt : sale.endAt;
  const t = target ? getTimeLeft(target, now) : { days: 0, hours: 0, minutes: 0, seconds: 0 };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(sale.coupon);
      setCopied(true);
      toast.success(`Coupon ${sale.coupon} copy ho gaya`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy nahi ho paya');
    }
  };

  return (
    <section
      aria-label={sale.title}
      className="relative overflow-hidden rounded-lg bg-gradient-to-r from-festive-deep via-festive-deep to-festive text-festive-foreground shadow-md"
    >
      {/* soft diya glow */}
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-festive-gold/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -left-12 -bottom-20 h-40 w-40 rounded-full bg-festive/40 blur-3xl" />

      <div className="relative flex flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <span className="text-3xl sm:text-4xl leading-none" aria-hidden>{preset.emoji}</span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-festive-gold">
              {status === 'scheduled' ? 'Jald shuru hoga' : 'Sirf limited time'}
            </p>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight">{sale.title}</h2>
            {sale.subtitle && <p className="mt-1 text-sm text-festive-foreground/85">{sale.subtitle}</p>}
            {sale.coupon && (
              <button
                type="button"
                onClick={copyCode}
                className="mt-2 inline-flex items-center gap-2 rounded-md border border-dashed border-festive-gold/80 bg-festive-foreground/10 px-3 py-1 text-sm font-bold tracking-wider hover:bg-festive-foreground/20 transition-colors"
              >
                Code: {sale.coupon}
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div>
            <p className="mb-1 text-[11px] text-festive-foreground/80">
              {status === 'scheduled' ? 'Shuru hone me' : 'Offer khatam hone me'}
            </p>
            <div className="flex items-start gap-1.5 sm:gap-2">
              {t.days > 0 && <TimeBox value={t.days} label="Din" />}
              <TimeBox value={t.hours} label="Ghante" />
              <TimeBox value={t.minutes} label="Min" />
              <TimeBox value={t.seconds} label="Sec" />
            </div>
          </div>
          {status !== 'scheduled' && (
            <Button asChild className="bg-festive-gold text-festive-deep hover:bg-festive-gold/90 font-bold">
              <Link to="/products?type=deals">Abhi Khareedein</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

export const FestivalSaleBanner = () => {
  const { content, loading } = useSiteContent();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (loading) return null;
  const sale = parseSale(content);
  const status = getSaleStatus(sale, now);
  if (status !== 'live' && status !== 'scheduled') return null;

  return <FestivalSaleCard sale={sale} now={now} />;
};

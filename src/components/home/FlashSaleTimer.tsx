import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useAnimationSettings, useEffectivePerformance } from '@/lib/animationSettings';


interface FlashSaleTimerProps {
  endTime?: Date;
}

export const FlashSaleTimer = ({ endTime }: FlashSaleTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const saleEndTime = endTime || new Date(new Date().setHours(23, 59, 59, 999));

    const calculateTimeLeft = () => {
      const distance = saleEndTime.getTime() - Date.now();
      if (distance > 0) {
        setTimeLeft({
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  const fmt = (n: number) => n.toString().padStart(2, '0');

  const { flashSale } = useAnimationSettings();
  const { low } = useEffectivePerformance();
  const styleName = flashSale.style;

  const styleMap: Record<string, { anim?: string; iconAnim?: string }> = {
    pulse: { anim: low ? undefined : 'flash-pulse 2s ease-in-out infinite' },
    glow: { iconAnim: low ? undefined : 'flash-glow 1.8s ease-in-out infinite' },
    marquee: {},
    plain: {},
  };
  const chosen = styleMap[styleName] || styleMap.pulse;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-card shadow-sm px-4 py-3 flex items-center justify-between rounded-md"
      style={{ animation: chosen.anim }}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <Zap className="h-5 w-5 text-yellow-500 shrink-0" style={{ animation: chosen.iconAnim }} />
        {styleName === 'marquee' && !low ? (
          <div className="relative flex-1 overflow-hidden whitespace-nowrap">
            <div
              className="inline-flex gap-8 font-bold text-base text-foreground"
              style={{ animation: 'flash-marquee 12s linear infinite' }}
            >
              <span>⚡ Flash Sale · Trendra</span>
              <span>⚡ Mega Deals Live Now</span>
              <span>⚡ Flash Sale · Trendra</span>
              <span>⚡ Mega Deals Live Now</span>
            </div>
          </div>
        ) : (
          <span className="font-bold text-base text-foreground">Flash Sale</span>
        )}
      </div>


      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground mr-1">Ends in</span>
        <TimeBlock value={fmt(timeLeft.hours)} />
        <span className="text-foreground font-bold">:</span>
        <TimeBlock value={fmt(timeLeft.minutes)} />
        <span className="text-foreground font-bold">:</span>
        <TimeBlock value={fmt(timeLeft.seconds)} />
      </div>
    </motion.div>
  );
};

const TimeBlock = ({ value }: { value: string }) => (
  <div className="bg-foreground text-background text-sm font-bold rounded-sm px-1.5 py-0.5 min-w-[28px] text-center">
    <motion.span key={value} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
      {value}
    </motion.span>
  </div>
);

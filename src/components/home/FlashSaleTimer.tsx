import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock } from 'lucide-react';

interface FlashSaleTimerProps {
  endTime?: Date;
}

export const FlashSaleTimer = ({ endTime }: FlashSaleTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Default: sale ends at midnight
    const saleEndTime = endTime || new Date(new Date().setHours(23, 59, 59, 999));

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const distance = saleEndTime.getTime() - now;

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

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-3 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-xl shadow-lg"
    >
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-yellow-300 animate-pulse" />
        <span className="font-bold text-sm md:text-base">Flash Sale Ends In:</span>
      </div>
      
      <div className="flex items-center gap-1">
        <TimeBlock value={formatNumber(timeLeft.hours)} label="H" />
        <span className="text-xl font-bold">:</span>
        <TimeBlock value={formatNumber(timeLeft.minutes)} label="M" />
        <span className="text-xl font-bold">:</span>
        <TimeBlock value={formatNumber(timeLeft.seconds)} label="S" />
      </div>
    </motion.div>
  );
};

const TimeBlock = ({ value, label }: { value: string; label: string }) => (
  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 min-w-[40px] text-center">
    <motion.span
      key={value}
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="text-lg md:text-xl font-bold block"
    >
      {value}
    </motion.span>
  </div>
);

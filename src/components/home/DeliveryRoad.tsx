import { useEffect, useState } from 'react';
import { Truck, Bike, Package, PackageCheck, MapPin, CheckCircle2 } from 'lucide-react';

const stages = [
  { label: 'Packed', Icon: Package },
  { label: 'Shipped', Icon: PackageCheck },
  { label: 'Out for Delivery', Icon: MapPin },
  { label: 'Delivered', Icon: CheckCircle2 },
];

export const DeliveryRoad = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Faster + smoother when motion is allowed; slow crawl when reduced.
  const truckDuration = reduced ? '30s' : '7s';
  const bikeDuration = reduced ? '24s' : '5s';

  return (
    <section
      aria-label="Delivery in progress"
      className="relative w-screen left-1/2 right-1/2 -mx-[50vw] overflow-hidden"
      style={{ height: '92px' }}
    >
      {/* Process stages above the road */}
      <div className="absolute top-2 left-0 right-0 px-4">
        <ul className="mx-auto flex max-w-3xl items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
          {stages.map(({ label, Icon }) => (
            <li key={label} className="flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
              <span className="whitespace-nowrap">{label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Road line */}
      <div className="absolute bottom-4 left-0 right-0 h-[2px] bg-[hsl(240,5%,25%)]" />

      {/* Dashed centre markings */}
      <div
        className="absolute bottom-[15px] left-0 right-0 h-[1px]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, hsl(240,5%,40%) 0px, hsl(240,5%,40%) 12px, transparent 12px, transparent 28px)',
          backgroundRepeat: 'repeat-x',
        }}
      />

      {/* Delivery truck riding on top of the road */}
      <div
        className="absolute bottom-[18px] flex items-center will-change-transform"
        style={{
          animation: `drive-across ${truckDuration} linear infinite`,
        }}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/30 backdrop-blur-sm shadow-sm">
          <Truck className="w-4 h-4 text-[hsl(var(--primary))]" />
        </div>
      </div>

      {/* Delivery boy on a bike — faster, slightly offset */}
      <div
        className="absolute bottom-[18px] flex items-center will-change-transform"
        style={{
          animation: `drive-across ${bikeDuration} linear infinite`,
          animationDelay: reduced ? '0s' : '-2s',
        }}
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[hsl(var(--accent))]/15 border border-[hsl(var(--accent))]/40 backdrop-blur-sm shadow-sm">
          <Bike className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
        </div>
      </div>
    </section>
  );
};

export default DeliveryRoad;

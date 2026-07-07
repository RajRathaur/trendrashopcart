import { useEffect, useState } from 'react';
import { Package, PackageCheck, MapPin, CheckCircle2 } from 'lucide-react';
import deliveryBoy from '@/assets/delivery-boy.png';
import deliveryTruck from '@/assets/delivery-truck.png';

const stages = [
  { label: 'Packed', Icon: Package },
  { label: 'Shipped', Icon: PackageCheck },
  { label: 'Out for Delivery', Icon: MapPin },
  { label: 'Delivered', Icon: CheckCircle2 },
];

/**
 * DeliveryRoad – lightweight, GPU-composited animation.
 * Only `transform` + `opacity` are animated, so the browser keeps every
 * moving element on its own compositor layer (no layout / paint per frame).
 */
export const DeliveryRoad = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const truckDuration = reduced ? '70s' : '28s';
  const bikeDuration  = reduced ? '55s' : '20s';
  const ease = 'cubic-bezier(0.45, 0.05, 0.55, 0.95)';

  // Shared GPU hints – kept in one place so every moving layer opts in.
  const gpuLayer: React.CSSProperties = {
    willChange: 'transform',
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
  };

  return (
    <section
      aria-label="Delivery in progress"
      className="relative w-screen left-1/2 right-1/2 -mx-[50vw] overflow-hidden"
      style={{
        height: '110px',
        // Isolate the section so its animation can't invalidate the rest
        // of the page during scroll / resize.
        contain: 'layout paint style',
      }}
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
      <div className="absolute bottom-5 left-0 right-0 h-[2px] bg-[hsl(240,5%,25%)]" />

      {/* Dashed centre markings – transform-scrolled for GPU compositing.
          We render a strip 200% wide and slide it by one tile width. */}
      <div
        className="absolute bottom-[19px] left-0 h-[1px] overflow-hidden"
        style={{ right: 0 }}
      >
        <div
          style={{
            ...gpuLayer,
            width: '200%',
            height: '100%',
            backgroundImage:
              'repeating-linear-gradient(90deg, hsl(240,5%,40%) 0px, hsl(240,5%,40%) 24px, transparent 24px, transparent 56px)',
            animation: reduced
              ? undefined
              : `markings-scroll ${truckDuration} linear infinite`,
          }}
        />
      </div>

      {/* Delivery truck */}
      <div
        className="absolute bottom-[22px]"
        style={{
          ...gpuLayer,
          animation: `drive-across ${truckDuration} ${ease} infinite`,
        }}
      >
        <img
          src={deliveryTruck}
          alt=""
          aria-hidden="true"
          width={56}
          height={56}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-14 w-auto select-none"
          style={{
            ...gpuLayer,
            animation: reduced
              ? undefined
              : 'vehicle-bob 1.6s cubic-bezier(0.37, 0, 0.63, 1) infinite',
          }}
        />
      </div>

      {/* Delivery boy on scooter */}
      <div
        className="absolute bottom-[22px]"
        style={{
          ...gpuLayer,
          animation: `drive-across ${bikeDuration} ${ease} infinite`,
          animationDelay: reduced ? '0s' : '-8s',
        }}
      >
        <img
          src={deliveryBoy}
          alt=""
          aria-hidden="true"
          width={52}
          height={52}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-[52px] w-auto select-none"
          style={{
            ...gpuLayer,
            animation: reduced
              ? undefined
              : 'vehicle-bob 1.1s cubic-bezier(0.37, 0, 0.63, 1) infinite',
          }}
        />
      </div>
    </section>
  );
};

export default DeliveryRoad;

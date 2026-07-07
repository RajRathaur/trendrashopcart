import { useEffect, useState } from 'react';
import deliveryBoy from '@/assets/delivery-boy.png';
import deliveryTruck from '@/assets/delivery-truck.png';

const stages = ['Packed', 'Dispatched', 'In Transit', 'Delivered'];

/**
 * DeliveryRoad – GPU-composited, jank-free.
 * Only `transform` + `opacity` are animated so every layer stays on the compositor.
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

  const truckDuration = reduced ? '70s' : '30s';
  const bikeDuration  = reduced ? '55s' : '22s';
  const ease = 'cubic-bezier(0.45, 0.05, 0.55, 0.95)';

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
      style={{ height: '120px', contain: 'layout paint style' }}
    >
      {/* Live tracker pill */}
      <div className="absolute top-3 left-0 right-0 flex justify-center px-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 backdrop-blur-sm px-3 py-1 text-[10px] sm:text-xs shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-medium tracking-wide text-foreground/80 uppercase">
            Live · Trendra Express
          </span>
        </div>
      </div>

      {/* Compact 4-stage progress track */}
      <div className="absolute top-11 left-0 right-0 px-6">
        <div className="mx-auto flex max-w-md items-center justify-between">
          {stages.map((label, i) => (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]"
                  style={{ opacity: 0.4 + i * 0.2 }}
                />
                <span className="mt-1 text-[9px] sm:text-[10px] text-muted-foreground whitespace-nowrap">
                  {label}
                </span>
              </div>
              {i < stages.length - 1 && (
                <div className="relative mx-1 h-[1px] flex-1 overflow-hidden bg-border">
                  <div
                    className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[hsl(var(--primary))] to-transparent"
                    style={{
                      ...gpuLayer,
                      animation: reduced
                        ? undefined
                        : `track-sweep 3.2s ${ease} ${i * 0.4}s infinite`,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Road line */}
      <div className="absolute bottom-5 left-0 right-0 h-[2px] bg-[hsl(240,5%,25%)]" />

      {/* Dashed centre markings – transform-scrolled */}
      <div className="absolute bottom-[19px] left-0 right-0 h-[1px] overflow-hidden">
        <div
          style={{
            ...gpuLayer,
            width: '200%',
            height: '100%',
            backgroundImage:
              'repeating-linear-gradient(90deg, hsl(240,5%,40%) 0px, hsl(240,5%,40%) 24px, transparent 24px, transparent 56px)',
            animation: reduced ? undefined : `markings-scroll ${truckDuration} linear infinite`,
          }}
        />
      </div>

      {/* Delivery truck – wheels sit on the line */}
      <div
        className="absolute bottom-[18px]"
        style={{ ...gpuLayer, animation: `drive-across ${truckDuration} ${ease} infinite` }}
      >
        <img
          src={deliveryTruck}
          alt=""
          aria-hidden="true"
          width={72}
          height={45}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-[42px] w-auto select-none block"
          style={{
            ...gpuLayer,
            animation: reduced ? undefined : 'vehicle-bob 1.6s cubic-bezier(0.37, 0, 0.63, 1) infinite',
          }}
        />
      </div>

      {/* Delivery boy on scooter – wheels sit on the line */}
      <div
        className="absolute bottom-[18px]"
        style={{
          ...gpuLayer,
          animation: `drive-across ${bikeDuration} ${ease} infinite`,
          animationDelay: reduced ? '0s' : '-9s',
        }}
      >
        <img
          src={deliveryBoy}
          alt=""
          aria-hidden="true"
          width={64}
          height={40}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-[40px] w-auto select-none block"
          style={{
            ...gpuLayer,
            animation: reduced ? undefined : 'vehicle-bob 1.1s cubic-bezier(0.37, 0, 0.63, 1) infinite',
          }}
        />
      </div>
    </section>
  );
};

export default DeliveryRoad;

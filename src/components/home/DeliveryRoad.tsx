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

export const DeliveryRoad = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Slow, calm cruise. Truck is heavier/slower, scooter a bit quicker.
  const truckDuration = reduced ? '60s' : '22s';
  const bikeDuration = reduced ? '48s' : '16s';

  return (
    <section
      aria-label="Delivery in progress"
      className="relative w-screen left-1/2 right-1/2 -mx-[50vw] overflow-hidden"
      style={{ height: '110px' }}
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

      {/* Dashed centre markings */}
      <div
        className="absolute bottom-[19px] left-0 right-0 h-[1px]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, hsl(240,5%,40%) 0px, hsl(240,5%,40%) 12px, transparent 12px, transparent 28px)',
          backgroundRepeat: 'repeat-x',
        }}
      />

      {/* Delivery truck riding on top of the road */}
      <div
        className="absolute bottom-[22px] will-change-transform"
        style={{
          animation: `drive-across ${truckDuration} linear infinite`,
        }}
      >
        <img
          src={deliveryTruck}
          alt=""
          aria-hidden="true"
          width={56}
          height={56}
          loading="lazy"
          className="h-14 w-auto select-none"
          draggable={false}
          style={{
            animation: reduced ? undefined : 'vehicle-bob 1.4s ease-in-out infinite',
          }}
        />
      </div>

      {/* Delivery boy on a scooter — slightly quicker, offset start */}
      <div
        className="absolute bottom-[22px] will-change-transform"
        style={{
          animation: `drive-across ${bikeDuration} linear infinite`,
          animationDelay: reduced ? '0s' : '-6s',
        }}
      >
        <img
          src={deliveryBoy}
          alt=""
          aria-hidden="true"
          width={52}
          height={52}
          loading="lazy"
          className="h-[52px] w-auto select-none"
          draggable={false}
          style={{
            animation: reduced ? undefined : 'vehicle-bob 0.9s ease-in-out infinite',
          }}
        />
      </div>
    </section>
  );
};

export default DeliveryRoad;

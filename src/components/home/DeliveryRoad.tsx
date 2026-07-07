import { Truck } from 'lucide-react';

export const DeliveryRoad = () => {
  return (
    <section
      aria-label="Delivery in progress"
      className="relative w-screen left-1/2 right-1/2 -mx-[50vw] overflow-hidden"
      style={{ height: '48px' }}
    >
      {/* Road line */}
      <div className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-[hsl(240,5%,25%)]" />

      {/* Dashed centre markings */}
      <div
        className="absolute top-1/2 left-0 right-0 h-[1px] -translate-y-1/2"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, hsl(240,5%,40%) 0px, hsl(240,5%,40%) 12px, transparent 12px, transparent 28px)',
          backgroundRepeat: 'repeat-x',
        }}
      />

      {/* Moving delivery truck */}
      <div
        className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1.5"
        style={{
          animation: 'drive-across 6s linear infinite',
        }}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/30 backdrop-blur-sm">
          <Truck className="w-4 h-4 text-[hsl(var(--primary))]" />
        </div>
      </div>
    </section>
  );
};

export default DeliveryRoad;

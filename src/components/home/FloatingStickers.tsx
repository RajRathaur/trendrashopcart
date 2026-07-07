import { useAnimationSettings, useEffectivePerformance, type StickerConfig } from '@/lib/animationSettings';

/**
 * Floating decorative stickers. Admin-controlled via animationSettings.
 * All animations are pure CSS transform/opacity so they stay smooth on mobile.
 * Auto-disabled on low-power devices.
 */
export const FloatingStickers = () => {
  const { stickers } = useAnimationSettings();
  const { low } = useEffectivePerformance();

  const active = stickers.filter((s) => s.enabled);
  if (active.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[45] overflow-hidden"
      style={{ contain: 'layout paint style' }}
    >
      {active.map((s) => (
        <Sticker key={s.id} s={s} low={low} />
      ))}
    </div>
  );
};

const Sticker = ({ s, low }: { s: StickerConfig; low: boolean }) => {
  // On low-power devices, keep them visible but drop looping animation
  const anim = low ? 'none' : animationCss(s);
  return (
    <img
      src={s.imageUrl}
      alt=""
      width={s.sizePx}
      height={s.sizePx}
      loading="lazy"
      decoding="async"
      draggable={false}
      style={{
        position: 'absolute',
        left: `${s.xPercent}%`,
        top: `${s.yPercent}%`,
        width: `${s.sizePx}px`,
        height: 'auto',
        opacity: s.opacity,
        transform: `translate3d(-50%, -50%, 0) rotate(${s.rotateDeg}deg)`,
        transformOrigin: 'center',
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        animation: anim,
      }}
    />
  );
};

const animationCss = (s: StickerConfig) => {
  const d = `${s.durationSec}s`;
  switch (s.animation) {
    case 'floatY':
      return `sticker-float ${d} ease-in-out infinite`;
    case 'bounce':
      return `sticker-bounce ${d} cubic-bezier(.37,0,.63,1) infinite`;
    case 'driveAcross':
      return `sticker-drive ${d} linear infinite`;
    case 'spin':
      return `sticker-spin ${d} linear infinite`;
    case 'wobble':
      return `sticker-wobble ${d} ease-in-out infinite`;
    case 'orbit':
      return `sticker-orbit ${d} linear infinite`;
    case 'pulse':
      return `sticker-pulse ${d} ease-in-out infinite`;
    case 'swing':
      return `sticker-swing ${d} ease-in-out infinite`;
    default:
      return 'none';
  }
};

export default FloatingStickers;

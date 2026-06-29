import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import femaleImg from '@/assets/cinematic-female-model.jpg';
import maleImg from '@/assets/cinematic-male-model.jpg';

/**
 * ADMIN-EDITABLE CONTENT
 * Modify text, image paths and CTAs here. Keeps the cinematic
 * component free of hard-coded copy so admins can rebrand easily.
 */
export const contentConfig = {
  brand: 'TRENDRA',
  tagline: 'Cinema for the way you dress',
  female: {
    image: femaleImg,
    label: 'Edit · Femme Noir',
    title: 'She Wears The Night',
    subtitle: 'Sculpted silhouettes. Liquid silks. Heels that walk like poetry.',
    price: '₹ 12,499',
    cta: { label: 'Shop Femme', href: '/products?gender=women' },
  },
  male: {
    image: maleImg,
    label: 'Edit · Monsieur Noir',
    title: 'He Walks In Shadows',
    subtitle: 'Tailored bombers. Cargo lines. Sneakers cut from quiet luxury.',
    price: '₹ 9,999',
    cta: { label: 'Shop Monsieur', href: '/products?gender=men' },
  },
  finale: {
    headline: 'Two Worlds. One Wardrobe.',
    sub: 'Welcome to Trendra — the cinematic shopkart.',
    cta: { label: 'Enter the Collection', href: '/products' },
  },
};

export const CinematicHero = () => {
  const root = useRef<HTMLDivElement>(null);
  const reduceMotion = typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!root.current || reduceMotion) return;
    const ctx = gsap.context(() => {
      gsap.set('.cine-female', { scale: 1.45, filter: 'blur(24px) saturate(0.6)', clipPath: 'inset(40% 30% 40% 30%)' });
      gsap.set('.cine-male', { xPercent: 100, scale: 1.2, filter: 'blur(12px)' });
      gsap.set('.cine-male-zoom', { scale: 1, transformOrigin: '50% 85%' });
      gsap.set('.cine-finale', { autoAlpha: 0, scale: 0.92 });
      gsap.set('.fem-copy > *', { y: 40, autoAlpha: 0 });
      gsap.set('.male-copy > *', { y: 40, autoAlpha: 0 });

      const tl = gsap.timeline({
        defaults: { ease: 'power3.inOut' },
        repeat: -1,
        repeatDelay: 1.2,
        onRepeat: () => {
          gsap.set('.cine-female', { xPercent: 0, scale: 1.45, filter: 'blur(24px) saturate(0.6)', clipPath: 'inset(40% 30% 40% 30%)' });
          gsap.set('.cine-male', { xPercent: 100, scale: 1.2, filter: 'blur(12px)' });
          gsap.set('.cine-male-zoom', { scale: 1 });
          gsap.set('.cine-finale', { autoAlpha: 0, scale: 0.92 });
          gsap.set('.fem-copy', { xPercent: 0, autoAlpha: 1 });
          gsap.set('.fem-copy > *', { y: 40, autoAlpha: 0 });
          gsap.set('.male-copy', { autoAlpha: 1 });
          gsap.set('.male-copy > *', { y: 40, autoAlpha: 0 });
        },
      });

      // STEP 1 — Female liquid reveal + zoom out
      tl.to('.cine-female', {
        scale: 1,
        filter: 'blur(0px) saturate(1)',
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 2.2,
      })
        .to('.fem-copy > *', { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.12 }, '-=1.2')
        .to({}, { duration: 1.1 }) // hold

        // STEP 2 — Cinematic horizontal pan to male
        .to('.cine-female', { xPercent: -100, scale: 1.1, duration: 1.6, ease: 'power2.inOut' })
        .to('.fem-copy', { xPercent: -100, autoAlpha: 0, duration: 1.6, ease: 'power2.inOut' }, '<')
        .to('.cine-male', { xPercent: 0, scale: 1, filter: 'blur(0px)', duration: 1.6, ease: 'power2.inOut' }, '<')

        // STEP 3 — Male copy reveal
        .to('.male-copy > *', { y: 0, autoAlpha: 1, duration: 0.9, stagger: 0.12 }, '-=0.6')
        .to({}, { duration: 1 })

        // STEP 4 — Zoom into sneakers
        .to('.cine-male-zoom', { scale: 1.8, duration: 1.8, ease: 'power2.inOut' })
        .to('.male-copy', { autoAlpha: 0, duration: 0.6 }, '<')
        .to('.cine-finale', { autoAlpha: 1, scale: 1, duration: 1.2 }, '-=0.6');

      // Subtle infinite breathing on idle finale
      gsap.to('.cine-glow', {
        opacity: 0.55,
        scale: 1.15,
        duration: 3.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }, root);

    return () => ctx.revert();
  }, [reduceMotion]);

  const c = contentConfig;

  return (
    <section
      ref={root}
      aria-label="Trendra cinematic hero"
      className="relative w-screen h-[100svh] overflow-hidden bg-black left-1/2 right-1/2 -mx-[50vw]"
      style={{ fontFamily: '"Urbanist", "Space Grotesk", system-ui, sans-serif' }}
    >
      {/* Top brand bar */}
      <div className="absolute top-0 inset-x-0 z-40 flex items-center justify-between px-5 md:px-10 py-5">
        <span className="text-[#deff9a] tracking-[0.4em] text-xs md:text-sm font-bold uppercase">
          {c.brand}
        </span>
        <span className="hidden md:block text-white/50 text-xs uppercase tracking-[0.3em]">
          {c.tagline}
        </span>
      </div>

      {/* Ambient lime glow */}
      <div
        className="cine-glow pointer-events-none absolute -bottom-40 left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] rounded-full opacity-30 blur-[140px]"
        style={{ background: '#deff9a' }}
      />

      {/* FEMALE LAYER */}
      <div className="cine-female absolute inset-0 will-change-transform">
        <img
          src={c.female.image}
          alt={c.female.title}
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full object-cover object-center"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/10 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

        <div className="fem-copy absolute inset-0 z-20 flex flex-col justify-end md:justify-center px-6 md:px-16 pb-24 md:pb-0 max-w-2xl">
          <span className="text-[#deff9a] text-[10px] md:text-xs tracking-[0.5em] uppercase font-bold">
            {c.female.label}
          </span>
          <h1 className="mt-4 text-white text-5xl md:text-8xl font-black uppercase leading-[0.95] tracking-tight">
            {c.female.title}
          </h1>
          <p className="mt-5 text-white/70 text-sm md:text-lg max-w-md font-light">
            {c.female.subtitle}
          </p>
          <div className="mt-6 flex items-center gap-5">
            <span className="text-[#deff9a] text-xl md:text-2xl font-bold">{c.female.price}</span>
            <Link
              to={c.female.cta.href}
              className="px-6 py-3 bg-[#deff9a] text-black text-xs md:text-sm font-bold uppercase tracking-[0.25em] hover:bg-white transition-colors"
            >
              {c.female.cta.label}
            </Link>
          </div>
        </div>
      </div>

      {/* MALE LAYER */}
      <div className="cine-male absolute inset-0 will-change-transform">
        <div className="cine-male-zoom absolute inset-0 will-change-transform">
          <img
            src={c.male.image}
            alt={c.male.title}
            width={1920}
            height={1080}
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/10 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />

        <div className="male-copy absolute inset-0 z-20 flex flex-col justify-end md:justify-center md:items-end px-6 md:px-16 pb-24 md:pb-0">
          <div className="max-w-2xl md:text-right">
            <span className="text-[#deff9a] text-[10px] md:text-xs tracking-[0.5em] uppercase font-bold">
              {c.male.label}
            </span>
            <h2 className="mt-4 text-white text-5xl md:text-8xl font-black uppercase leading-[0.95] tracking-tight">
              {c.male.title}
            </h2>
            <p className="mt-5 text-white/70 text-sm md:text-lg max-w-md md:ml-auto font-light">
              {c.male.subtitle}
            </p>
            <div className="mt-6 flex items-center gap-5 md:justify-end">
              <span className="text-[#deff9a] text-xl md:text-2xl font-bold">{c.male.price}</span>
              <Link
                to={c.male.cta.href}
                className="px-6 py-3 bg-[#deff9a] text-black text-xs md:text-sm font-bold uppercase tracking-[0.25em] hover:bg-white transition-colors"
              >
                {c.male.cta.label}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* FINALE OVERLAY */}
      <div className="cine-finale absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6 bg-black/60 backdrop-blur-sm">
        <span className="text-[#deff9a] text-[10px] md:text-xs tracking-[0.6em] uppercase font-bold">
          {c.brand}
        </span>
        <h3 className="mt-5 text-white text-4xl md:text-7xl font-black uppercase leading-[0.95] tracking-tight max-w-4xl">
          {c.finale.headline}
        </h3>
        <p className="mt-5 text-white/70 text-sm md:text-lg max-w-xl font-light">
          {c.finale.sub}
        </p>
        <Link
          to={c.finale.cta.href}
          className="mt-8 px-8 py-4 bg-[#deff9a] text-black text-xs md:text-sm font-bold uppercase tracking-[0.3em] hover:bg-white transition-colors"
        >
          {c.finale.cta.label}
        </Link>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-5 inset-x-0 z-40 flex justify-center pointer-events-none">
        <span className="text-white/40 text-[10px] tracking-[0.4em] uppercase animate-pulse">
          Scroll
        </span>
      </div>
    </section>
  );
};

export default CinematicHero;

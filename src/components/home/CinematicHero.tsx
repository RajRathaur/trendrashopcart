import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import femaleImg from '@/assets/cinematic-female-model.jpg';
import maleImg from '@/assets/cinematic-male-model.jpg';

/**
 * ADMIN-EDITABLE CONTENT
 * Modify text, image paths and CTAs here.
 */
export const contentConfig = {
  brand: 'TRENDRA',
  tagline: 'Cinema for the way you dress',
  female: {
    image: femaleImg,
    label: 'Femme Noir',
    title: 'She Owns The Night',
    subtitle: 'Sharp tailoring. Structured power. Quiet luxury that commands every room.',
    cta: { label: 'Shop Femme', href: '/products?gender=women' },
  },
  male: {
    image: maleImg,
    label: 'Monsieur Noir',
    title: 'He Walks In Shadows',
    subtitle: 'Tailored bombers. Cargo lines. Sneakers cut from quiet luxury.',
    cta: { label: 'Shop Monsieur', href: '/products?gender=men' },
  },
};

/**
 * Renders the cinematic hero. Animation plays exactly ONCE on first view,
 * then both models settle into a split-screen collage that stays on screen.
 * Same layout on desktop and mobile (no separate mobile fallback).
 */
export const CinematicHero = () => {
  const root = useRef<HTMLDivElement>(null);
  const [animationDone, setAnimationDone] = useState(false);
  const c = contentConfig;
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!root.current) return;
    if (reduceMotion) {
      setAnimationDone(true);
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set('.cine-female-overlay', { xPercent: 100, scale: 1.15, filter: 'blur(10px)' });
      gsap.set('.cine-male-overlay', { xPercent: 100, scale: 1.15, filter: 'blur(10px)' });
      gsap.set('.cine-fem-copy > *', { y: 30, autoAlpha: 0 });
      gsap.set('.cine-male-copy > *', { y: 30, autoAlpha: 0 });

      const tl = gsap.timeline({
        defaults: { ease: 'power3.inOut' },
        onComplete: () => setAnimationDone(true),
      });

      tl
        // STEP 1 — Female slides in
        .to('.cine-female-overlay', {
          xPercent: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.4,
        })
        .to('.cine-fem-copy > *', { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.1 }, '-=0.5')
        .to({}, { duration: 1.2 })
        // STEP 2 — Female pans left while male enters from right
        .to('.cine-fem-copy', { autoAlpha: 0, duration: 0.5 })
        .to('.cine-female-overlay', { xPercent: -100, duration: 1.4 }, '<')
        .to('.cine-male-overlay', { xPercent: 0, scale: 1, filter: 'blur(0px)', duration: 1.4 }, '<')
        .to('.cine-male-copy > *', { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.1 }, '-=0.5')
        .to({}, { duration: 1.2 })
        // STEP 3 — Fade overlays to reveal the static split collage underneath
        .to('.cine-male-copy', { autoAlpha: 0, duration: 0.5 })
        .to(['.cine-female-overlay', '.cine-male-overlay'], { autoAlpha: 0, duration: 1 }, '-=0.2');
    }, root);

    return () => ctx.revert();
  }, [reduceMotion]);

  return (
    <section
      ref={root}
      aria-label="Trendra cinematic hero"
      className="relative w-screen overflow-hidden bg-black left-1/2 right-1/2 -mx-[50vw]"
      style={{ fontFamily: '"Urbanist", "Space Grotesk", system-ui, sans-serif' }}
    >
      {/* Top brand bar */}
      <div className="absolute top-0 inset-x-0 z-40 flex items-center justify-between px-5 md:px-10 py-5">
        <span className="text-[#deff9a] tracking-[0.4em] text-xs md:text-sm font-bold uppercase">
          {c.brand}
        </span>
        <span className="hidden sm:block text-white/75 text-[10px] md:text-xs uppercase tracking-[0.3em]">
          {c.tagline}
        </span>
      </div>

      {/* ================== STATIC SPLIT COLLAGE (final state) ================== */}
      <div className="grid grid-cols-2 min-h-[70vh] sm:min-h-[80vh] md:min-h-[88vh]">
        {/* Female side */}
        <div className="relative overflow-hidden border-r border-black">
          <img
            src={c.female.image}
            alt={c.female.title}
            width={1024}
            height={1536}
            className="absolute inset-0 w-full h-full object-cover object-top"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          <div className="absolute inset-0 z-10 flex flex-col justify-end px-3 sm:px-6 md:px-10 pb-8 sm:pb-12 md:pb-16">
            <span className="text-[#deff9a] text-[8px] sm:text-[10px] md:text-xs tracking-[0.4em] uppercase font-bold">
              {c.female.label}
            </span>
            <h1 className="mt-2 text-white text-lg sm:text-2xl md:text-5xl font-black uppercase leading-[0.95] tracking-tight drop-shadow-lg">
              {c.female.title}
            </h1>
            <p className="mt-2 text-white/75 text-[10px] sm:text-xs md:text-base max-w-xs font-light drop-shadow hidden sm:block">
              {c.female.subtitle}
            </p>
            <div className="mt-3 md:mt-5">
              <Link
                to={c.female.cta.href}
                className="inline-block px-3 py-2 sm:px-5 sm:py-3 bg-[#deff9a] text-black text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] hover:bg-white transition-colors"
              >
                {c.female.cta.label}
              </Link>
            </div>
          </div>
        </div>

        {/* Male side */}
        <div className="relative overflow-hidden">
          <img
            src={c.male.image}
            alt={c.male.title}
            width={1920}
            height={1080}
            className="absolute inset-0 w-full h-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-black/60 via-transparent to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          <div className="absolute inset-0 z-10 flex flex-col justify-end items-end text-right px-3 sm:px-6 md:px-10 pb-8 sm:pb-12 md:pb-16">
            <span className="text-[#deff9a] text-[8px] sm:text-[10px] md:text-xs tracking-[0.4em] uppercase font-bold">
              {c.male.label}
            </span>
            <h2 className="mt-2 text-white text-lg sm:text-2xl md:text-5xl font-black uppercase leading-[0.95] tracking-tight drop-shadow-lg">
              {c.male.title}
            </h2>
            <p className="mt-2 text-white/75 text-[10px] sm:text-xs md:text-base max-w-xs font-light drop-shadow hidden sm:block">
              {c.male.subtitle}
            </p>
            <div className="mt-3 md:mt-5">
              <Link
                to={c.male.cta.href}
                className="inline-block px-3 py-2 sm:px-5 sm:py-3 bg-[#deff9a] text-black text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] hover:bg-white transition-colors"
              >
                {c.male.cta.label}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ================== ONE-SHOT ANIMATION OVERLAY ================== */}
      {!animationDone && !reduceMotion && (
        <>
          {/* Female overlay (full screen) */}
          <div className="cine-female-overlay absolute inset-0 z-20 will-change-transform">
            <img
              src={c.female.image}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
            <div className="cine-fem-copy absolute inset-0 z-10 flex flex-col justify-end md:justify-center px-6 md:px-16 pb-32 md:pb-0 max-w-2xl">
              <span className="text-[#deff9a] text-[10px] md:text-xs tracking-[0.5em] uppercase font-bold">
                {c.female.label}
              </span>
              <h1 className="mt-3 text-white text-4xl md:text-7xl font-black uppercase leading-[0.95] tracking-tight drop-shadow-lg">
                {c.female.title}
              </h1>
              <p className="mt-4 text-white/80 text-sm md:text-lg max-w-md font-light drop-shadow">
                {c.female.subtitle}
              </p>
            </div>
          </div>

          {/* Male overlay (full screen) */}
          <div className="cine-male-overlay absolute inset-0 z-20 will-change-transform">
            <img
              src={c.male.image}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-transparent to-black/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
            <div className="cine-male-copy absolute inset-0 z-10 flex flex-col justify-end md:justify-center md:items-end px-6 md:px-16 pb-24 md:pb-0">
              <div className="max-w-2xl md:text-right">
                <span className="text-[#deff9a] text-[10px] md:text-xs tracking-[0.5em] uppercase font-bold">
                  {c.male.label}
                </span>
                <h2 className="mt-3 text-white text-4xl md:text-7xl font-black uppercase leading-[0.95] tracking-tight drop-shadow-lg">
                  {c.male.title}
                </h2>
                <p className="mt-4 text-white/80 text-sm md:text-lg max-w-md md:ml-auto font-light drop-shadow">
                  {c.male.subtitle}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Soft bottom fade INTO the page background (matches index.css --background) */}
      <div className="absolute bottom-0 inset-x-0 h-24 md:h-32 bg-gradient-to-t from-background via-background/70 to-transparent z-30 pointer-events-none" />
    </section>
  );
};

export default CinematicHero;

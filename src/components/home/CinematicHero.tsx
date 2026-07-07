import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import femaleImg from '@/assets/cinematic-female-model.jpg';
import maleImg from '@/assets/cinematic-male-model.jpg';
import { useAnimationSettings, useEffectivePerformance, speedFactor } from '@/lib/animationSettings';


/**
 * ADMIN-EDITABLE CONTENT
 */
export const contentConfig = {
  brand: 'TRENDRA',
  tagline: 'Style that speaks for you',
  female: {
    image: femaleImg,
    label: 'For Her',
    title: 'Elegance, Redefined',
    subtitle: 'From timeless weaves to modern drapes. Find pieces that celebrate your style.',
    cta: { label: 'Shop Women', href: '/products?gender=women' },
  },
  male: {
    image: maleImg,
    label: 'For Him',
    title: 'Confidence, Tailored',
    subtitle: 'Smart casuals to statement looks. Dress with intent, every single day.',
    cta: { label: 'Shop Men', href: '/products?gender=men' },
  },
  finale: {
    headline: 'For Her. For Him. For Every Moment.',
    sub: 'Trendra — India\'s fashion destination.',
    cta: { label: 'Explore Collection', href: '/products' },
  },
};

export const CinematicHero = () => {
  const root = useRef<HTMLDivElement>(null);
  const c = contentConfig;
  const { hero } = useAnimationSettings();
  const { low } = useEffectivePerformance();
  const reduceMotion =
    !hero.enabled ||
    hero.style === 'staticSplit' ||
    low ||
    (typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const timeScale = 1 / speedFactor(hero.speed); // faster speed -> higher timeScale
  const style = hero.style;

  useEffect(() => {
    if (!root.current || reduceMotion) return;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    // Blur filters are the #1 jank source on mobile GPUs — drop them on small screens.
    const initialBlur = isMobile ? 'blur(0px)' : 'blur(12px)';
    const zoomTarget = isMobile ? 1.35 : 1.8;

    const ctx = gsap.context(() => {
      gsap.set('.cine-female', { xPercent: 100, scale: 1.15, filter: initialBlur });
      gsap.set('.cine-female-zoom', { scale: 1, transformOrigin: '50% 50%' });
      gsap.set('.cine-male', { xPercent: 100, scale: 1.15, filter: initialBlur });
      gsap.set('.cine-male-zoom', { scale: 1, transformOrigin: '50% 85%' });
      gsap.set('.cine-finale', { autoAlpha: 0, scale: 0.94 });
      gsap.set('.fem-copy > *', { y: 30, autoAlpha: 0 });
      gsap.set('.male-copy > *', { y: 30, autoAlpha: 0 });

      const tl = gsap.timeline({
        defaults: { ease: 'power3.inOut' },
      });
      tl.timeScale(timeScale);

      if (style === 'crossfade') {
        gsap.set('.cine-female', { xPercent: 0, scale: 1, filter: 'blur(0px)', autoAlpha: 1 });
        gsap.set('.cine-male', { xPercent: 0, scale: 1, filter: 'blur(0px)', autoAlpha: 0 });
        tl.to('.fem-copy > *', { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1 })
          .to({}, { duration: 3 })
          .to('.fem-copy', { autoAlpha: 0, duration: 0.6 })
          .to('.cine-female', { autoAlpha: 0, duration: 1.2 }, '<')
          .to('.cine-male', { autoAlpha: 1, duration: 1.2 }, '<')
          .to('.male-copy > *', { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1 }, '-=0.3')
          .to({}, { duration: 3 })
          .to('.cine-finale', { autoAlpha: 1, scale: 1, duration: 1.2 });
      } else if (style === 'kenBurns') {
        gsap.set('.cine-female', { xPercent: 0, scale: 1, filter: 'blur(0px)' });
        gsap.set('.cine-male', { xPercent: 0, scale: 1, filter: 'blur(0px)' });
        gsap.set('.cine-female', { clipPath: 'inset(0 50% 0 0)' });
        gsap.set('.cine-male', { clipPath: 'inset(0 0 0 50%)' });
        tl.to('.fem-copy > *', { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1 })
          .to('.male-copy > *', { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1 }, '<');
        gsap.to('.cine-female-zoom', { scale: 1.12, duration: 10, ease: 'sine.inOut', repeat: -1, yoyo: true });
        gsap.to('.cine-male-zoom', { scale: 1.12, duration: 10, ease: 'sine.inOut', repeat: -1, yoyo: true });
      } else {
        // Default cinematic sequence
        tl.to('.cine-female', { xPercent: 0, scale: 1, filter: 'blur(0px)', duration: 1.4, ease: 'power2.inOut' })
          .to('.fem-copy > *', { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1 }, '-=0.5')
          .to({}, { duration: 1 })
          .to('.cine-female-zoom', { scale: zoomTarget, duration: 1.6, ease: 'power2.inOut' })
          .to('.fem-copy', { autoAlpha: 0, duration: 0.5 }, '<')
          .to('.cine-female', { xPercent: -100, scale: 1.08, duration: 1.4, ease: 'power2.inOut' })
          .to('.cine-male', { xPercent: 0, scale: 1, filter: 'blur(0px)', duration: 1.4, ease: 'power2.inOut' }, '<')
          .to('.male-copy > *', { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1 }, '-=0.5')
          .to({}, { duration: 1 })
          .to('.cine-male-zoom', { scale: zoomTarget, duration: 1.6, ease: 'power2.inOut' })
          .to('.male-copy', { autoAlpha: 0, duration: 0.5 }, '<')
          .to('.cine-finale', { autoAlpha: 1, scale: 1, duration: 1.1 }, '-=0.5');
      }

      if (!isMobile) {
        // Glow pulse also uses filter/blur underneath — skip on mobile.
        gsap.to('.cine-glow', {
          opacity: 0.55,
          scale: 1.15,
          duration: 3.4,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }
    }, root);




    return () => ctx.revert();
  }, [reduceMotion, style, timeScale]);

  // Reduced-motion: static side-by-side collage
  if (reduceMotion) {
    return (
      <section
        ref={root}
        aria-label="Trendra cinematic hero"
        className="relative w-screen overflow-hidden bg-[#f5f0e8] left-1/2 right-1/2 -mx-[50vw]"
      >
        <div className="grid grid-cols-2 min-h-[70vh] md:min-h-[85vh] gap-1 p-1">
          <div className="relative overflow-hidden">
            <img src={c.female.image} alt={c.female.title} className="w-full h-full object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#f5f0e8]/80 via-[#f5f0e8]/20 to-transparent" />
          </div>
          <div className="relative overflow-hidden">
            <img src={c.male.image} alt={c.male.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#f5f0e8]/80 via-[#f5f0e8]/20 to-transparent" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={root}
      aria-label="Trendra cinematic hero"
      className="relative w-screen h-[62svh] sm:h-[70svh] md:h-[100svh] overflow-hidden bg-[#f5f0e8] left-1/2 right-1/2 -mx-[50vw]"
    >
      <div className="absolute top-0 inset-x-0 z-40 flex items-center justify-between px-5 md:px-10 py-4 md:py-5">
        <span className="text-[#7d9b76] tracking-[0.4em] text-[10px] md:text-sm font-bold uppercase">{c.brand}</span>
        <span className="hidden md:block text-[#2d2d2d]/60 text-xs uppercase tracking-[0.3em]">{c.tagline}</span>
      </div>

      <div
        className="cine-glow pointer-events-none absolute -bottom-40 left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] rounded-full opacity-20 blur-[140px]"
        style={{ background: '#a8c0a0' }}
      />

      {/* FEMALE LAYER */}
      <div className="cine-female absolute inset-0 will-change-transform">
        <div className="cine-female-zoom absolute inset-0 will-change-transform">
          <img
            src={c.female.image}
            alt={c.female.title}
            width={1024}
            height={1536}
            className="absolute inset-0 w-full h-full object-cover object-top"
            fetchPriority="high"
            decoding="async"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#f5f0e8]/80 via-transparent to-[#f5f0e8]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#f5f0e8]/95 via-[#f5f0e8]/30 to-transparent" />
        <div className="fem-copy absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-16 pt-14 md:pt-0 max-w-2xl">
          <span className="text-[#7d9b76] text-[10px] md:text-xs tracking-[0.4em] md:tracking-[0.5em] uppercase font-bold">{c.female.label}</span>
          <h1 className="mt-3 md:mt-5 text-[#2d2d2d] text-3xl md:text-8xl font-black uppercase leading-[1.05] md:leading-[0.95] tracking-tight">
            {c.female.title}
          </h1>
          <p className="mt-3 md:mt-5 text-[#2d2d2d]/70 text-xs md:text-lg max-w-md font-light leading-relaxed">{c.female.subtitle}</p>
          <div className="mt-5 md:mt-7">
            <Link
              to={c.female.cta.href}
              className="inline-block px-5 py-2.5 md:px-6 md:py-3 bg-[#7d9b76] text-white text-[11px] md:text-sm font-bold uppercase tracking-[0.25em] hover:bg-[#5a7a54] transition-colors"
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
        <div className="absolute inset-0 bg-gradient-to-l from-[#f5f0e8]/80 via-transparent to-[#f5f0e8]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#f5f0e8]/95 via-[#f5f0e8]/30 to-transparent" />
        <div className="male-copy absolute inset-0 z-20 flex flex-col justify-center md:items-end px-6 md:px-16 pt-14 md:pt-0">
          <div className="max-w-2xl md:text-right">
            <span className="text-[#7d9b76] text-[10px] md:text-xs tracking-[0.4em] md:tracking-[0.5em] uppercase font-bold">{c.male.label}</span>
            <h2 className="mt-3 md:mt-5 text-[#2d2d2d] text-3xl md:text-8xl font-black uppercase leading-[1.05] md:leading-[0.95] tracking-tight">
              {c.male.title}
            </h2>
            <p className="mt-3 md:mt-5 text-[#2d2d2d]/70 text-xs md:text-lg max-w-md md:ml-auto font-light leading-relaxed">{c.male.subtitle}</p>
            <div className="mt-5 md:mt-7 md:text-right">
              <Link
                to={c.male.cta.href}
                className="inline-block px-5 py-2.5 md:px-6 md:py-3 bg-[#7d9b76] text-white text-[11px] md:text-sm font-bold uppercase tracking-[0.25em] hover:bg-[#5a7a54] transition-colors"
              >
                {c.male.cta.label}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* FINALE */}
      <div className="cine-finale absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6 py-10 bg-[#f5f0e8]/85 backdrop-blur-sm">
        <span className="text-[#7d9b76] text-[10px] md:text-xs tracking-[0.5em] md:tracking-[0.6em] uppercase font-bold">{c.brand}</span>
        <h3 className="mt-6 md:mt-7 text-[#2d2d2d] text-[26px] sm:text-4xl md:text-7xl font-black uppercase leading-[1.1] md:leading-[0.95] tracking-tight max-w-4xl">
          {c.finale.headline}
        </h3>
        <p className="mt-5 md:mt-6 text-[#2d2d2d]/70 text-xs sm:text-sm md:text-lg max-w-xl font-light leading-relaxed">{c.finale.sub}</p>
        <Link
          to={c.finale.cta.href}
          className="mt-7 md:mt-8 px-6 py-3 md:px-8 md:py-4 bg-[#7d9b76] text-white text-[11px] md:text-sm font-bold uppercase tracking-[0.3em] hover:bg-[#5a7a54] transition-colors"
        >
          {c.finale.cta.label}
        </Link>
      </div>

    </section>

  );
};

export default CinematicHero;

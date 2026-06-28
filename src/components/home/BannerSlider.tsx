import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

interface Banner {
  id: string;
  image_url: string;
  title?: string;
  link_url?: string;
}

interface BannerSliderProps {
  banners: Banner[];
  autoPlayInterval?: number;
}

const SWIPE_THRESHOLD = 50;

export const BannerSlider = ({
  banners,
  autoPlayInterval = 5000,
}: BannerSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  // Autoplay with pause support
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [banners.length, autoPlayInterval, isPaused, goToNext]);

  // Pause when tab is hidden
  useEffect(() => {
    const onVisibility = () => setIsPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (Math.abs(touchDeltaX.current) > SWIPE_THRESHOLD) {
      if (touchDeltaX.current < 0) goToNext();
      else goToPrevious();
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
    // Resume shortly after tap/swipe ends
    setTimeout(() => setIsPaused(false), 1500);
  };

  if (banners.length === 0) {
    return (
      <ScrollReveal variant="scale">
        <div className="banner-gradient aspect-[21/9] md:aspect-[4/1] flex items-center justify-center">
          <div className="text-center text-primary-foreground">
            <h2 className="text-2xl md:text-4xl font-bold mb-2">Welcome to Trendra</h2>
            <p className="text-lg opacity-90">Best deals, best prices!</p>
          </div>
        </div>
      </ScrollReveal>
    );
  }

  return (
    <ScrollReveal variant="scale">
      <div
        className="relative overflow-hidden select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="region"
        aria-label="Promotional banners"
            aria-roledescription="carousel"
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner, idx) => (
            <div
              key={banner.id}
              className="min-w-full"
              aria-roledescription="slide"
              aria-label={`${idx + 1} of ${banners.length}`}
            >
              <a
                href={banner.link_url || '#'}
                className="block w-full aspect-[4/3] md:aspect-[4/1]"
                draggable={false}
              >
                <img
                  src={banner.image_url}
                  alt={banner.title || 'Banner'}
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />
              </a>
            </div>
          ))}
        </div>

        {/* Navigation Arrows (hidden on mobile, swipe is primary) */}
        {banners.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Previous banner"
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              aria-label="Next banner"
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 rounded-full opacity-80 hover:opacity-100"
              onClick={goToNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to banner ${index + 1}`}
                className={cn(
                  'h-2 rounded-full transition-all',
                  index === currentIndex
                    ? 'bg-primary-foreground w-6'
                    : 'bg-primary-foreground/50 hover:bg-primary-foreground/70 w-2'
                )}
              />
            ))}
          </div>
        )}
      </div>
    </ScrollReveal>
  );
};

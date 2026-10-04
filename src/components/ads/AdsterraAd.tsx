import { useEffect, useRef, useState } from 'react';

interface AdsterraAdProps {
  adKey: string;
  width: number;
  height: number;
  className?: string;
}

/**
 * Adsterra iframe ad unit. Each placement runs inside its own document,
 * preventing concurrent loaders from overwriting the global atOptions.
 */
export const AdsterraAd = ({ adKey, width, height, className }: AdsterraAdProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: '300px 0px' },
    );
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  const source = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank"><style>html,body{margin:0;padding:0;width:${width}px;height:${height}px;overflow:hidden}</style></head><body><script>var atOptions={'key':'${adKey}','format':'iframe','height':${height},'width':${width},'params':{}};<\/script><script src="https://bauval.org/22/${adKey}"><\/script></body></html>`;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width, height, maxWidth: '100%', margin: '0 auto', overflow: 'hidden' }}
      aria-label="Advertisement"
    >
      {shouldLoad && (
        <iframe
          title="Advertisement"
          srcDoc={source}
          width={width}
          height={height}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          style={{ display: 'block', border: 0, maxWidth: '100%' }}
        />
      )}
    </div>
  );
};

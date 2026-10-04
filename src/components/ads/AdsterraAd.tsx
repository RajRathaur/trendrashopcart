import { useEffect, useRef } from 'react';

interface AdsterraAdProps {
  adKey: string;
  width: number;
  height: number;
  className?: string;
}

/**
 * Adsterra iframe ad unit. Injects the atOptions config and the
 * bauval.org loader script into an isolated container so multiple
 * units on one page don't clash over the global atOptions variable.
 */
export const AdsterraAd = ({ adKey, width, height, className }: AdsterraAdProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear any previous render (React StrictMode double-invokes effects)
    container.innerHTML = '';

    const configScript = document.createElement('script');
    configScript.type = 'text/javascript';
    configScript.text = `atOptions = { 'key' : '${adKey}', 'format' : 'iframe', 'height' : ${height}, 'width' : ${width}, 'params' : {} };`;

    const loaderScript = document.createElement('script');
    loaderScript.type = 'text/javascript';
    loaderScript.src = `https://bauval.org/22/${adKey}`;
    loaderScript.async = true;

    container.appendChild(configScript);
    container.appendChild(loaderScript);

    return () => {
      container.innerHTML = '';
    };
  }, [adKey, width, height]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width, height, maxWidth: '100%', margin: '0 auto', overflow: 'hidden' }}
      aria-label="Advertisement"
    />
  );
};

import { AdsterraAd } from './AdsterraAd';

/** Top-of-game Adsterra banner: 728×90 on desktop, 320×50 on mobile. */
export function GameAdBanner() {
  return (
    <div className="w-full flex justify-center py-1" data-testid="game-ad">
      <div className="hidden md:block"><AdsterraAd adKey="87a01297c493a91f49e43feb0e934043" width={728} height={90} /></div>
      <div className="md:hidden"><AdsterraAd adKey="835b73275328dbc781e07c6046dae00c" width={320} height={50} /></div>
    </div>
  );
}

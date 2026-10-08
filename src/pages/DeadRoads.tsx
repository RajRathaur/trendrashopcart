import { GameAdBanner } from '@/components/ads/GameAdBanner';
import { useNavigate } from 'react-router-dom';

const DeadRoads = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="shrink-0 bg-card"><GameAdBanner /></div>
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b shrink-0">
        <h1 className="text-lg font-bold text-foreground">🛣️ Dead Roads</h1>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Exit ✕
        </button>
      </div>
      <iframe
        src="/dead-roads.html"
        title="Dead Roads"
        className="flex-1 w-full border-0"
        allow="autoplay; fullscreen"
      />
    </div>
  );
};

export default DeadRoads;

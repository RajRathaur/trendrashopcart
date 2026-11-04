import { memo, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Play, Send, ShoppingBag, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeedReel, avatarLetter, formatCount } from '@/lib/reels';

interface ReelItemProps {
  reel: FeedReel;
  active: boolean;
  /** Load the video file (active reel and its neighbours only, to save data). */
  load: boolean;
  muted: boolean;
  liked: boolean;
  following: boolean;
  isOwn: boolean;
  onToggleMute: () => void;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onFollow: () => void;
}

const ReelItemBase = ({
  reel, active, load, muted, liked, following, isOwn,
  onToggleMute, onLike, onComment, onShare, onFollow,
}: ReelItemProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [burst, setBurst] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const tapTimer = useRef<number | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active && !paused) {
      v.play().catch(() => setPaused(true));
    } else {
      v.pause();
    }
  }, [active, paused, load]);

  // Restart from the beginning whenever this reel scrolls back into view.
  useEffect(() => {
    if (!active) {
      setPaused(false);
      if (videoRef.current) videoRef.current.currentTime = 0;
    }
  }, [active]);

  const onTap = () => {
    if (tapTimer.current) {
      window.clearTimeout(tapTimer.current);
      tapTimer.current = null;
      setBurst((b) => b + 1);
      if (!liked) onLike();
      return;
    }
    tapTimer.current = window.setTimeout(() => {
      tapTimer.current = null;
      setPaused((p) => !p);
    }, 250);
  };

  const author = reel.author;
  const product = reel.product;

  return (
    <article className="relative h-full w-full overflow-hidden bg-reel text-reel-foreground" aria-label={`Reel by @${author?.username ?? 'user'}`}>
      {load ? (
        <video
          ref={videoRef}
          src={reel.video_url}
          poster={reel.thumbnail_url ?? undefined}
          className="absolute inset-0 h-full w-full object-contain"
          playsInline
          loop
          muted={muted}
          preload={active ? 'auto' : 'metadata'}
        />
      ) : (
        reel.thumbnail_url && (
          <img src={reel.thumbnail_url} alt="" className="absolute inset-0 h-full w-full object-contain" loading="lazy" />
        )
      )}

      {/* Tap layer: single tap pause/play, double tap like */}
      <button type="button" onClick={onTap} className="absolute inset-0 z-10 cursor-pointer" aria-label={paused ? 'Play' : 'Pause'} />

      {paused && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <span className="rounded-full bg-reel/50 p-4 backdrop-blur-sm">
            <Play className="h-10 w-10 fill-current" />
          </span>
        </div>
      )}

      {burst > 0 && (
        <div key={burst} className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <Heart className="h-24 w-24 animate-reel-heart fill-destructive text-destructive" />
        </div>
      )}

      {/* Bottom scrim for readable text */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1/2 bg-gradient-to-t from-reel/80 to-transparent" />

      <button
        type="button"
        onClick={onToggleMute}
        className="absolute right-3 top-16 z-30 rounded-full bg-reel/40 p-2 backdrop-blur-sm"
        aria-label={muted ? 'Awaaz chalu karein' : 'Awaaz band karein'}
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>

      {/* Right action rail */}
      <div className="absolute bottom-24 right-2 z-30 flex flex-col items-center gap-5 md:bottom-10">
        <button type="button" onClick={onLike} className="flex flex-col items-center gap-1" aria-label={liked ? 'Unlike' : 'Like'} aria-pressed={liked}>
          <Heart className={cn('h-7 w-7 drop-shadow transition-transform active:scale-90', liked && 'fill-destructive text-destructive')} />
          <span className="text-xs font-semibold drop-shadow">{formatCount(reel.like_count)}</span>
        </button>
        <button type="button" onClick={onComment} className="flex flex-col items-center gap-1" aria-label="Comments">
          <MessageCircle className="h-7 w-7 drop-shadow" />
          <span className="text-xs font-semibold drop-shadow">{formatCount(reel.comment_count)}</span>
        </button>
        <button type="button" onClick={onShare} className="flex flex-col items-center gap-1" aria-label="Share">
          <Send className="h-7 w-7 drop-shadow" />
          <span className="text-xs font-semibold drop-shadow">Share</span>
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute inset-x-0 bottom-0 z-30 space-y-2 px-3 pb-20 pr-16 md:pb-5">
        <div className="flex items-center gap-2">
          <Link to={`/u/${author?.username ?? ''}`} className="flex min-w-0 items-center gap-2">
            {author?.avatar_url ? (
              <img src={author.avatar_url} alt="" className="h-8 w-8 shrink-0 rounded-full border border-reel-foreground/60 object-cover" />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-reel-foreground/60 bg-primary text-sm font-bold text-primary-foreground">
                {avatarLetter(author)}
              </span>
            )}
            <span className="truncate text-sm font-semibold drop-shadow">@{author?.username ?? 'user'}</span>
          </Link>
          {!isOwn && (
            <button
              type="button"
              onClick={onFollow}
              className={cn(
                'shrink-0 rounded-md border border-reel-foreground/70 px-2.5 py-0.5 text-xs font-semibold',
                following && 'border-transparent bg-reel-foreground/20',
              )}
            >
              {following ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        {reel.caption && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className={cn('block max-w-full text-left text-sm leading-snug drop-shadow', !expanded && 'line-clamp-2')}
          >
            {reel.caption}
          </button>
        )}

        {product && (
          <Link
            to={`/product/${product.id}`}
            className="inline-flex max-w-[75%] items-center gap-2 rounded-full bg-reel/45 py-1 pl-1 pr-3 text-xs backdrop-blur-sm"
            aria-label={`Product dekhein: ${product.name}`}
          >
            {product.images?.[0] ? (
              <img src={product.images[0]} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
            ) : (
              <ShoppingBag className="h-4 w-4 shrink-0" />
            )}
            <span className="truncate">{product.name}</span>
            <span className="shrink-0 font-semibold">₹{Math.round(Number(product.price)).toLocaleString('en-IN')}</span>
          </Link>
        )}
      </div>
    </article>
  );
};

export const ReelItem = memo(ReelItemBase);

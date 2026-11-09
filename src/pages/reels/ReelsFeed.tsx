import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clapperboard, Loader2, Plus, UserCircle, Search, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Seo } from '@/components/Seo';
import { ReelItem } from '@/components/reels/ReelItem';
import { CommentsDrawer } from '@/components/reels/CommentsDrawer';
import { useReelActions } from '@/hooks/useReelActions';
import { FEED_SELECT, FeedReel } from '@/lib/reels';
import { SITE_URL } from '@/lib/site';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PAGE = 8;
type Tab = 'all' | 'following';

const ReelsFeed = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('all');
  const [reels, setReels] = useState<FeedReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  const [commentsFor, setCommentsFor] = useState<FeedReel | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewed = useRef<Set<string>>(new Set());
  const loadingMore = useRef(false);

  const { user, liked, following, toggleLike, toggleFollow, requireLogin } = useReelActions(reels.map((r) => r.id));
  const followingKey = [...following].sort().join(',');

  const fetchPage = useCallback(async (offset: number, exclude?: string): Promise<FeedReel[]> => {
    let q = supabase.from('reels').select(FEED_SELECT).eq('status', 'approved')
      .order('approved_at', { ascending: false }).range(offset, offset + PAGE - 1);
    if (tab === 'following') {
      const ids = followingKey ? followingKey.split(',') : [];
      if (ids.length === 0) return [];
      q = q.in('user_id', ids);
    }
    if (exclude) q = q.neq('id', exclude);
    const { data } = await q;
    return (data as unknown as FeedReel[] | null) ?? [];
  }, [tab, followingKey]);

  // First load (and reload on tab change).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setActive(0);
    containerRef.current?.scrollTo({ top: 0 });
    (async () => {
      let first: FeedReel[] = [];
      if (id && tab === 'all') {
        const { data } = await supabase.from('reels').select(FEED_SELECT).eq('id', id).maybeSingle();
        if (data) first = [data as unknown as FeedReel];
      }
      const page = await fetchPage(0, first[0]?.id);
      if (cancelled) return;
      setReels([...first, ...page]);
      setHasMore(page.length === PAGE);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id, tab, fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore.current || !hasMore) return;
    loadingMore.current = true;
    const offset = reels.filter((r) => r.status === 'approved' && r.id !== id).length;
    const page = await fetchPage(offset, id);
    setReels((list) => {
      const seen = new Set(list.map((r) => r.id));
      return [...list, ...page.filter((r) => !seen.has(r.id))];
    });
    setHasMore(page.length === PAGE);
    loadingMore.current = false;
  }, [fetchPage, hasMore, reels, id]);

  // Track which reel is on screen.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { root, threshold: 0.6 },
    );
    root.querySelectorAll('[data-index]').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [reels]);

  useEffect(() => {
    const r = reels[active];
    if (r && r.status === 'approved' && !viewed.current.has(r.id)) {
      viewed.current.add(r.id);
      // The request only runs once awaited/then-ed.
      void supabase.rpc('register_reel_view', { _reel_id: r.id }).then(() => undefined);
    }
    if (active >= reels.length - 3) loadMore();
  }, [active, reels, loadMore]);

  // Keyboard up/down on desktop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const root = containerRef.current;
      if (!root) return;
      e.preventDefault();
      root.scrollBy({ top: (e.key === 'ArrowDown' ? 1 : -1) * root.clientHeight, behavior: 'smooth' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const bump = (reelId: string, field: 'like_count' | 'comment_count', delta: number) =>
    setReels((list) => list.map((r) => (r.id === reelId ? { ...r, [field]: Math.max(0, r[field] + delta) } : r)));

  const share = async (r: FeedReel) => {
    const url = `${SITE_URL}/reels/${r.id}`;
    const text = r.caption ? r.caption.slice(0, 80) : `@${r.author?.username} ki reel Trendra par`;
    try {
      if (navigator.share) { await navigator.share({ title: 'Trendra Reels', text, url }); return; }
      await navigator.clipboard.writeText(url);
      toast.success('Link copy ho gaya');
    } catch { /* user closed share sheet */ }
  };

  const openUpload = () => { if (!requireLogin()) navigate('/reels/upload'); };
  const openMe = () => { if (!requireLogin()) navigate('/u/me'); };

  return (
    <div className="fixed inset-0 z-40 bg-reel text-reel-foreground">
      <Seo
        title="Trendra Reels — fashion videos dekhein aur shop karein"
        description="Trendra Reels par chhote fashion aur style videos dekhein, like, comment, follow karein aur pasand aaye to product turant khareedein."
        path={id ? `/reels/${id}` : '/reels'}
      />

      {/* Top bar */}
      <header className="absolute inset-x-0 top-0 z-50 flex items-center justify-between gap-2 bg-gradient-to-b from-reel/70 to-transparent px-3 pb-6 pt-3">
        <div className="flex items-center gap-1">
          <Link to="/" className="rounded-full p-2 hover:bg-reel-foreground/10" aria-label="Home par jaayein">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-lg font-bold">Reels</span>
        </div>
        <div className="flex rounded-full bg-reel-foreground/10 p-0.5 text-xs font-semibold">
          {(['all', 'following'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { if (t === 'following' && requireLogin()) return; setTab(t); }}
              className={cn('rounded-full px-3 py-1', tab === t ? 'bg-reel-foreground text-reel' : 'opacity-80')}
            >
              {t === 'all' ? 'Sabke liye' : 'Following'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={openUpload} className="rounded-full p-2 hover:bg-reel-foreground/10" aria-label="Reel daalein">
            <Plus className="h-5 w-5" />
          </button>
          <button type="button" onClick={openMe} className="rounded-full p-2 hover:bg-reel-foreground/10" aria-label="Meri profile">
            <UserCircle className="h-5 w-5" />
          </button>
        </div>
      </header>
      <nav aria-label="Explore videos" className="absolute left-3 top-16 z-50 flex gap-2">
        <Button variant="secondary" size="sm" asChild><Link to="/videos"><Video className="mr-1 h-4 w-4" />Tech videos</Link></Button>
        <Button variant="secondary" size="sm" asChild><Link to="/reels/search"><Search className="mr-1 h-4 w-4" />Users</Link></Button>
      </nav>

      <div
        ref={containerRef}
        className="no-scrollbar mx-auto h-full w-full snap-y snap-mandatory overflow-y-scroll md:max-w-[min(100vw,calc(100svh*9/16))]"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center"><Loader2 className="h-7 w-7 animate-spin" /></div>
        ) : reels.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
            <Clapperboard className="h-12 w-12 opacity-70" />
            <p className="text-base font-semibold">
              {tab === 'following' ? 'Jinhe aap follow karte hain, unki reels yahan dikhengi' : 'Abhi koi reel nahi hai'}
            </p>
            <button type="button" onClick={openUpload} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
              Pehli reel daalein
            </button>
          </div>
        ) : (
          reels.map((r, i) => (
            <div key={r.id} data-index={i} className="h-full w-full snap-start snap-always">
              <ReelItem
                reel={r}
                active={i === active}
                load={Math.abs(i - active) <= 1}
                muted={muted}
                liked={liked.has(r.id)}
                following={following.has(r.user_id)}
                isOwn={user?.id === r.user_id}
                onToggleMute={() => setMuted((m) => !m)}
                onLike={async () => { const d = await toggleLike(r.id); if (d) bump(r.id, 'like_count', d); }}
                onComment={() => setCommentsFor(r)}
                onShare={() => share(r)}
                onFollow={() => toggleFollow(r.user_id)}
              />
            </div>
          ))
        )}
      </div>

      <CommentsDrawer
        reelId={commentsFor?.id ?? null}
        reelOwnerId={commentsFor?.user_id}
        onClose={() => setCommentsFor(null)}
        onCountChange={(rid, d) => bump(rid, 'comment_count', d)}
      />
    </div>
  );
};

export default ReelsFeed;

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
type Campaign = { campaign_id: string; video_id: string; title: string; thumbnail_url: string | null; kind: string; brand_name: string };
function Placement({ row }: { row: Campaign }) {
  const ref = useRef<HTMLAnchorElement>(null); const { user } = useAuth();
  useEffect(() => {
    if (!ref.current || !user) return;
    const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { void supabase.rpc('record_campaign_event', { _id: row.campaign_id, _event: 'impression' }); observer.disconnect(); } }, { threshold: 0.5 });
    observer.observe(ref.current); return () => observer.disconnect();
  }, [row.campaign_id, user]);
  return <Link ref={ref} to={`/videos/${row.video_id}`} onClick={() => { if (user) void supabase.rpc('record_campaign_event', { _id: row.campaign_id, _event: 'click' }); }} className="w-64 min-w-0 shrink-0"><div className="relative aspect-video overflow-hidden rounded-lg bg-muted">{row.thumbnail_url ? <img src={row.thumbnail_url} alt={row.title} className="h-full w-full object-cover" loading="lazy" /> : <Video className="absolute inset-0 m-auto h-10 w-10 text-muted-foreground" />}</div><h3 className="mt-2 line-clamp-2 break-words font-semibold">{row.title}</h3><p className="text-xs text-muted-foreground">Sponsored{row.kind === 'sponsored' ? ` · ${row.brand_name}` : ' · Promoted video'}</p></Link>;
}
export function SponsoredVideos() {
  const [rows, setRows] = useState<Campaign[]>([]);
  useEffect(() => { void supabase.rpc('active_video_campaigns').then(({ data }) => setRows(data ?? [])); }, []);
  if (!rows.length) return null;
  return <section className="mb-8 border-b pb-6"><h2 className="mb-3 text-lg font-semibold">Sponsored</h2><div className="flex gap-4 overflow-x-auto pb-2">{rows.map(row => <Placement key={row.campaign_id} row={row} />)}</div></section>;
}
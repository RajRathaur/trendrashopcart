import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type ContentMap = Record<string, string>;

interface Ctx {
  content: ContentMap;
  get: (key: string, fallback: string) => string;
  set: (key: string, value: string) => Promise<void>;
  loading: boolean;
}

const SiteContentContext = createContext<Ctx | null>(null);

export const SiteContentProvider = ({ children }: { children: ReactNode }) => {
  const [content, setContent] = useState<ContentMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.from('site_content').select('content_key, content_value');
      if (alive && data) {
        const map: ContentMap = {};
        for (const row of data) map[row.content_key] = row.content_value;
        setContent(map);
      }
      setLoading(false);
    })();

    const channel = supabase
      .channel('site_content_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_content' }, (payload) => {
        const row = (payload.new as any) || (payload.old as any);
        if (!row?.content_key) return;
        setContent((prev) => {
          const next = { ...prev };
          if (payload.eventType === 'DELETE') delete next[row.content_key];
          else next[row.content_key] = row.content_value;
          return next;
        });
      })
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const get = useCallback(
    (key: string, fallback: string) => (content[key] !== undefined ? content[key] : fallback),
    [content]
  );

  const set = useCallback(async (key: string, value: string) => {
    setContent((prev) => ({ ...prev, [key]: value }));
    await supabase.from('site_content').upsert({ content_key: key, content_value: value }, { onConflict: 'content_key' });
  }, []);

  return (
    <SiteContentContext.Provider value={{ content, get, set, loading }}>
      {children}
    </SiteContentContext.Provider>
  );
};

export const useSiteContent = () => {
  const ctx = useContext(SiteContentContext);
  if (!ctx) throw new Error('useSiteContent must be used inside SiteContentProvider');
  return ctx;
};

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

const SUGGESTIONS = [
  'Saree under ₹1500',
  'Running shoes under ₹2000',
  'Gift for her under ₹999',
  'Best smartphone under ₹15000',
];

export const AiSuggestBox = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const go = (text: string) => {
    const q = text.trim();
    if (!q) return;
    navigate(`/assistant?q=${encodeURIComponent(q)}`);
  };

  return (
    <ScrollReveal variant="fadeUp">
      <section className="relative overflow-hidden rounded-xl border bg-card p-5 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            Trendra AI Assistant
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-foreground">
            Bataiye kya chahiye — AI dhoondh dega
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Apni zaroorat likhiye, hum sahi products suggest karenge
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              go(query);
            }}
            className="mt-4 flex items-center gap-2 rounded-full border bg-background p-1.5 pl-4 shadow-sm focus-within:ring-2 focus-within:ring-primary/40"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 1500 ke andar saree dikhao…"
              className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-label="Apni zaroorat likhiye"
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
              aria-label="AI se poochhein"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => go(s)}
                className="rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
};

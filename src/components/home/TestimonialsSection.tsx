import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/scroll-reveal';
import { supabase } from '@/integrations/supabase/client';

interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
}

const gradients = [
  'from-pink-500 to-rose-500',
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-indigo-500 to-violet-500',
];

const initialsFromName = (name?: string | null) => {
  if (!name) return 'TR';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'TR';
};

export const TestimonialsSection = () => {
  const [reviews, setReviews] = useState<Array<ReviewRow & { name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data } = await supabase
          .from('product_reviews')
          .select('id, rating, comment, created_at, user_id')
          .gte('rating', 4)
          .not('comment', 'is', null)
          .order('created_at', { ascending: false })
          .limit(6);

        if (!data || data.length === 0) {
          setReviews([]);
          return;
        }

        const userIds = Array.from(new Set(data.map((r: any) => r.user_id))).filter(Boolean);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds as string[]);

        const nameMap = new Map<string, string>(
          (profiles || []).map((p: any) => [p.user_id, p.full_name || 'Trendra Customer'])
        );

        setReviews(
          (data as ReviewRow[])
            .filter((r) => r.comment && r.comment.trim().length > 0)
            .slice(0, 3)
            .map((r) => ({ ...r, name: nameMap.get(r.user_id) || 'Trendra Customer' }))
        );
      } catch (e) {
        console.error('Failed to load reviews', e);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  if (loading) return null;
  if (reviews.length === 0) return null;

  return (
    <section className="py-12">
      <ScrollReveal variant="fadeUp">
        <div className="text-center mb-10">
          <h2 className="section-title justify-center text-2xl md:text-3xl">
            What Our Customers Say
          </h2>
          <p className="text-muted-foreground mt-2">Real reviews from verified shoppers</p>
        </div>
      </ScrollReveal>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6" staggerDelay={0.15}>
        {reviews.map((review, idx) => (
          <StaggerItem key={review.id}>
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="bg-card rounded-2xl p-6 shadow-sm border border-border/50 h-full relative overflow-hidden group"
            >
              <Quote className="absolute top-4 right-4 h-8 w-8 text-muted/20 group-hover:text-primary/20 transition-colors" />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: Math.round(review.rating) }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-foreground mb-6 leading-relaxed">"{review.comment}"</p>
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${
                    gradients[idx % gradients.length]
                  } flex items-center justify-center text-white font-bold`}
                >
                  {initialsFromName(review.name)}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{review.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
};

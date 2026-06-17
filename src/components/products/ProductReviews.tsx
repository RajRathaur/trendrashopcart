import { useState, useEffect } from 'react';
import { Star, ThumbsUp, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  user_id: string;
  is_verified_purchase: boolean | null;
  profile?: { full_name: string | null };
}

interface ProductReviewsProps {
  productId: string;
  productRating: number;
  reviewCount: number;
}

export const ProductReviews = ({ productId, productRating, reviewCount }: ProductReviewsProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      // Fetch only safe display fields via security-definer function
      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .rpc('get_public_profiles', { _user_ids: userIds });

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      setReviews(data.map(r => ({ ...r, profile: profileMap.get(r.user_id) || null })) as Review[]);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please login to write a review');
      return;
    }
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase
      .from('product_reviews')
      .insert({
        product_id: productId,
        user_id: user.id,
        rating,
        title: title.trim() || null,
        comment: comment.trim() || null,
      });

    if (error) {
      if (error.code === '23505') {
        toast.error('You have already reviewed this product');
      } else {
        toast.error('Failed to submit review');
      }
    } else {
      toast.success('Review submitted!');
      setShowForm(false);
      setRating(0);
      setTitle('');
      setComment('');
      fetchReviews();
    }
    setSubmitting(false);
  };

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Ratings & Reviews</h2>
        {user && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Write a Review'}
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="flex gap-8 items-start">
        <div className="text-center">
          <div className="text-4xl font-bold text-foreground">{productRating.toFixed(1)}</div>
          <div className="flex justify-center mt-1">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={cn('h-4 w-4', s <= Math.round(productRating) ? 'text-yellow-500 fill-current' : 'text-muted-foreground/30')} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{reviewCount} reviews</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {ratingDistribution.map(({ star, count, pct }) => (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-muted-foreground">{star}</span>
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-6 text-right text-muted-foreground">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Write Review Form */}
      {showForm && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-4 border">
          <div>
            <p className="text-sm font-medium mb-2">Your Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(s => (
                <button
                  key={s}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  className="p-0.5"
                >
                  <Star className={cn('h-7 w-7 transition-colors', (hoverRating || rating) >= s ? 'text-yellow-500 fill-current' : 'text-muted-foreground/30')} />
                </button>
              ))}
            </div>
          </div>
          <Input placeholder="Review title (optional)" value={title} onChange={e => setTitle(e.target.value)} maxLength={100} />
          <Textarea placeholder="Write your review..." value={comment} onChange={e => setComment(e.target.value)} maxLength={1000} rows={3} />
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm py-4">No reviews yet. Be the first to review!</p>
      ) : (
        <div className="divide-y">
          {reviews.map(review => (
            <div key={review.id} className="py-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="rating-badge">
                  <span>{review.rating}</span>
                  <Star className="h-2.5 w-2.5 fill-current" />
                </div>
                {review.title && <span className="font-medium text-sm text-foreground">{review.title}</span>}
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {review.profile?.full_name || 'Anonymous'}
                </span>
                {review.is_verified_purchase && (
                  <span className="text-green-600 font-medium">✓ Verified Purchase</span>
                )}
                <span>{new Date(review.created_at).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

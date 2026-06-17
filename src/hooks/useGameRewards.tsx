import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface GameReward {
  id: string;
  coupon_code: string;
  discount_percent: number;
  game_score: number;
  is_redeemed: boolean;
  created_at: string;
  expires_at: string;
}

const REWARD_THRESHOLDS = [
  { score: 500, discount: 5 },
  { score: 1000, discount: 10 },
  { score: 2000, discount: 15 },
];

export const useGameRewards = () => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<GameReward[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRewards = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('game_rewards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setRewards(data as GameReward[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const getEarnedDiscount = (score: number): number | null => {
    for (let i = REWARD_THRESHOLDS.length - 1; i >= 0; i--) {
      if (score >= REWARD_THRESHOLDS[i].score) {
        return REWARD_THRESHOLDS[i].discount;
      }
    }
    return null;
  };

  const claimReward = async (score: number): Promise<GameReward | null> => {
    if (!user) {
      toast({ title: 'Login Required', description: 'Please login to claim rewards!', variant: 'destructive' });
      return null;
    }
    const discount = getEarnedDiscount(score);
    if (!discount) return null;

    // Server-side validated reward claim — coupon code and discount come from the database
    const { data, error } = await (supabase as any).rpc('claim_game_reward', { _score: score });

    if (error || !data) {
      toast({ title: 'Error', description: 'Could not claim reward', variant: 'destructive' });
      return null;
    }

    const reward = data as unknown as GameReward;
    toast({ title: '🎉 Reward Earned!', description: `You got a ${reward.discount_percent}% off coupon: ${reward.coupon_code}` });
    await fetchRewards();
    return reward;
  };

  return { rewards, loading, claimReward, getEarnedDiscount, fetchRewards, REWARD_THRESHOLDS };
};

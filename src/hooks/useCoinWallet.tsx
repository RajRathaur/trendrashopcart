import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export const COINS_PER_RUPEE = 20;
export const MIN_REDEEM_COINS = 200;

export interface RedeemRequest {
  id: string;
  coins_spent: number;
  amount_inr: number;
  status: string;
  google_play_code: string | null;
  admin_notes: string | null;
  contact_email: string | null;
  created_at: string;
}

export const useCoinWallet = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [requests, setRequests] = useState<RedeemRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWallet = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [w, r] = await Promise.all([
      (supabase as any).from('coin_wallet').select('*').eq('user_id', user.id).maybeSingle(),
      (supabase as any).from('redeem_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    if (w.data) {
      setBalance(w.data.balance);
      setTotalEarned(w.data.total_earned);
    } else {
      setBalance(0);
      setTotalEarned(0);
    }
    if (r.data) setRequests(r.data as RedeemRequest[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  const addCoins = async (coins: number) => {
    if (!user || coins <= 0) return null;
    const { data, error } = await (supabase as any).rpc('add_coins', { _coins: coins });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return null;
    }
    await fetchWallet();
    return data as number;
  };

  const requestRedeem = async (coins: number, email: string) => {
    if (!user) {
      toast({ title: 'Login required', variant: 'destructive' });
      return false;
    }
    const { error } = await (supabase as any).rpc('request_redeem', { _coins: coins, _email: email });
    if (error) {
      toast({ title: 'Redeem failed', description: error.message, variant: 'destructive' });
      return false;
    }
    toast({ title: '✅ Request submitted', description: 'Admin review ke baad code email pe milega.' });
    await fetchWallet();
    return true;
  };

  return { balance, totalEarned, requests, loading, fetchWallet, addCoins, requestRedeem };
};

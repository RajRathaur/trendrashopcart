import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Gift, Clock, CheckCircle2, XCircle, Copy, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCoinWallet, COINS_PER_RUPEE, MIN_REDEEM_COINS } from '@/hooks/useCoinWallet';
import { toast } from '@/hooks/use-toast';

const PRESETS = [
  { coins: 200, rupees: 10 },
  { coins: 600, rupees: 30 },
  { coins: 1000, rupees: 50 },
  { coins: 2000, rupees: 100 },
];

const Redeem = () => {
  const { user } = useAuth();
  const { balance, totalEarned, requests, requestRedeem, loading } = useCoinWallet();
  const [selected, setSelected] = useState<number>(200);
  const [email, setEmail] = useState(user?.email || '');
  const [submitting, setSubmitting] = useState(false);

  const handleRedeem = async () => {
    if (selected < MIN_REDEEM_COINS) return;
    if (selected > balance) {
      toast({ title: 'Not enough coins', variant: 'destructive' });
      return;
    }
    if (!email || !email.includes('@')) {
      toast({ title: 'Valid email zaroori hai', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    await requestRedeem(selected, email);
    setSubmitting(false);
  };

  const statusBadge = (s: string) => {
    if (s === 'approved') return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
    if (s === 'rejected') return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Gift className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Login to redeem coins</h1>
          <p className="text-muted-foreground mb-4">Game khelo, coins kamao, Google Play code lo!</p>
          <Link to="/login"><Button className="gap-2"><LogIn className="w-4 h-4" />Login</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Wallet card */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Your Coin Balance</p>
              <div className="flex items-center gap-2 mt-1">
                <Coins className="w-7 h-7 text-yellow-500" />
                <span className="text-3xl font-bold text-foreground">{balance}</span>
                <span className="text-muted-foreground">coins</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">≈ ₹{(balance / COINS_PER_RUPEE).toFixed(2)} • Total earned: {totalEarned}</p>
            </div>
            <Link to="/fruit-game"><Button variant="outline" className="gap-2"><Coins className="w-4 h-4" />Play & Earn</Button></Link>
          </div>
        </Card>

        {/* Redeem form */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><Gift className="w-5 h-5 text-primary" /> Redeem Google Play Code</h2>
          <p className="text-sm text-muted-foreground mb-4">{COINS_PER_RUPEE} coins = ₹1 • Minimum {MIN_REDEEM_COINS} coins (₹{MIN_REDEEM_COINS / COINS_PER_RUPEE})</p>

          <Label className="mb-2 block">Choose amount</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {PRESETS.map(p => {
              const enabled = balance >= p.coins;
              return (
                <button
                  key={p.coins}
                  onClick={() => setSelected(p.coins)}
                  disabled={!enabled}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    selected === p.coins ? 'border-primary bg-primary/10' : 'border-border'
                  } ${!enabled ? 'opacity-40 cursor-not-allowed' : 'hover:border-primary/50'}`}
                >
                  <div className="text-lg font-bold">₹{p.rupees}</div>
                  <div className="text-xs text-muted-foreground">{p.coins} coins</div>
                </button>
              );
            })}
          </div>

          <Label htmlFor="email" className="mb-2 block">Email for Google Play code</Label>
          <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" maxLength={255} className="mb-4" />

          <Button onClick={handleRedeem} disabled={submitting || balance < selected || selected < MIN_REDEEM_COINS} className="w-full gap-2">
            <Gift className="w-4 h-4" />
            {submitting ? 'Submitting...' : `Request ₹${selected / COINS_PER_RUPEE} Code`}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">Admin manually verify karke 24-48 hrs me code email karega.</p>
        </Card>

        {/* History */}
        <Card className="p-6">
          <h3 className="font-bold mb-3">Redeem History</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No redeem requests yet.</p>
          ) : (
            <div className="space-y-2">
              {requests.map(r => (
                <div key={r.id} className="border rounded-lg p-3 flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">₹{Number(r.amount_inr).toFixed(0)}</span>
                      <span className="text-xs text-muted-foreground">{r.coins_spent} coins</span>
                      {statusBadge(r.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(r.created_at).toLocaleString()}</p>
                    {r.google_play_code && (
                      <div className="mt-2 flex items-center gap-2 bg-muted p-2 rounded">
                        <code className="text-sm font-mono flex-1 break-all">{r.google_play_code}</code>
                        <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(r.google_play_code!); toast({ title: 'Copied!' }); }}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {r.admin_notes && <p className="text-xs text-muted-foreground mt-1 italic">Note: {r.admin_notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default Redeem;

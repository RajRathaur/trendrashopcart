import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { lovable } from '@/integrations/lovable';
import trendraLogo from '@/assets/trendra-logo.jpeg';

const getSafeRedirectPath = (value: string | null) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
};

/**
 * Dedicated full-page Google sign-in.
 * Opened in a top-level tab so Google's page is never rendered inside an
 * embedded preview iframe (which fails with ERR_BLOCKED_BY_RESPONSE).
 */
const GoogleSignInPage = () => {
  const [searchParams] = useSearchParams();
  const redirect = getSafeRedirectPath(searchParams.get('redirect'));
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const started = useRef(false);

  const start = async () => {
    setError(null);
    setStarting(true);
    try {
      sessionStorage.setItem('trendra_google_redirect', redirect);
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
        extraParams: { prompt: 'select_account' },
      });
      if (result?.error) throw result.error;
      if (!result?.redirected) {
        window.location.replace(redirect);
      }
    } catch (err: any) {
      const msg: string = err?.message || '';
      let friendly = 'Google login shuru nahi ho paaya. Neeche button se dobara try karein.';
      if (/popup|blocked/i.test(msg)) friendly = 'Popup block ho gaya. Browser me popups allow karke retry karein.';
      else if (/cancel|closed/i.test(msg)) friendly = 'Login cancel ho gaya. Dobara try karein.';
      else if (/network|fetch|timeout/i.test(msg)) friendly = 'Network issue. Internet check karke retry karein.';
      setError(friendly);
      setStarting(false);
    }
  };

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-card rounded-xl shadow-lg p-8 text-center">
        <img src={trendraLogo} alt="Trendra" className="w-14 h-14 rounded-xl object-cover mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground mb-2">Signing in with Google</h1>

        {starting && !error && (
          <div className="flex flex-col items-center gap-3 mt-6 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm">Google ka secure page khul raha hai...</p>
          </div>
        )}

        {error && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button className="w-full" onClick={start}>Retry Google Login</Button>
          </div>
        )}

        <div className="mt-6 text-sm">
          <Link to={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-primary hover:underline">
            Email / OTP se login karein
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GoogleSignInPage;

import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

// Pages jo bina login khul sakti hain
const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password'];

/**
 * Poori site ke liye login gate — bina login koi page touch nahi hoga.
 * Bina login ke har request /login par chali jaati hai, aur login ke baad
 * user wapas usi page par aa jaata hai.
 */
export const AuthGate = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (PUBLIC_PATHS.some((p) => location.pathname.startsWith(p))) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    const redirect = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  return <>{children}</>;
};

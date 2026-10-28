import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { isPublicPath, loginPath } from '@/lib/publicPaths';

/**
 * Login gate — home, product list and product pages are open to everyone.
 * Every other page (cart, checkout, orders, games…) sends logged-out
 * shoppers to /login, and brings them back to the same page afterwards.
 */
export const AuthGate = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isPublicPath(location.pathname)) {
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
    return <Navigate to={loginPath(location.pathname + location.search)} replace />;
  }

  return <>{children}</>;
};

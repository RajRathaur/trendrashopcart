import { type ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Set true for seller routes (allow both admin and seller). */
  allowSeller?: boolean;
}

export const AdminGuard = ({ children, allowSeller = false }: Props) => {
  const { user, isAdmin, isSeller, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    document.title = 'Loading… — Trendra';
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  const authorized = isAdmin || (allowSeller && isSeller);
  if (!authorized) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

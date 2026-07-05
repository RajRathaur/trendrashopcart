import { ReactNode, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Package, ShoppingCart, LogOut, Store, CreditCard, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/seller', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/seller/products', label: 'My Products', icon: Package },
  { href: '/seller/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/seller/payments', label: 'Payments', icon: CreditCard },
];

export const SellerLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, isSeller, isLoading, user, seller } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate('/login?redirect=/seller', { replace: true });
      return;
    }
    if (!isSeller) {
      // Either not registered or awaiting approval
      navigate('/become-seller', { replace: true });
    }
  }, [isLoading, isSeller, user, navigate]);

  if (isLoading || !isSeller) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="p-4 border-b">
          <Link to="/seller" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Store className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <div className="text-lg font-bold">Seller Panel</div>
              <div className="text-xs text-muted-foreground truncate max-w-[160px]">{seller?.business_name}</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t space-y-2">
          <Link to="/">
            <Button variant="outline" className="w-full justify-start gap-2">
              <Store className="h-4 w-4" />
              Back to Store
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-6 bg-background overflow-auto">{children}</main>
    </div>
  );
};

import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Heart, ShoppingCart, User } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';

export const BottomNav = () => {
  const location = useLocation();
  const { itemCount } = useCart();
  const { user } = useAuth();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Explore', path: '/products' },
    { icon: Heart, label: 'Wishlist', path: '/wishlist' },
    { icon: ShoppingCart, label: 'Cart', path: '/cart', badge: itemCount },
    { icon: User, label: user ? 'Account' : 'Login', path: user ? '/orders' : '/login' },
  ];

  return (
    <nav className="bottom-nav py-1.5 px-2 safe-area-inset-bottom">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-0.5 px-3 py-1 relative"
            >
              <div className="relative">
                <item.icon
                  className={`h-5 w-5 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-yellow-400 text-foreground text-[9px] font-bold rounded-full h-3.5 min-w-[14px] flex items-center justify-center px-0.5">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

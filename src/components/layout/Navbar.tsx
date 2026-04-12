import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Heart, User, Menu, ChevronDown, Package, Store, Smartphone, Shirt, Home, Sparkles, ShoppingBasket, Laptop, Watch, Baby, TrendingUp, MoreVertical, Gamepad2 } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import trendraLogo from '@/assets/trendra-logo.jpeg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

const categories = [
  { name: 'Fashion', slug: 'fashion', icon: Shirt, gradient: 'from-pink-500 to-rose-500', bg: 'bg-pink-50' },
  { name: 'Electronics', slug: 'electronics', icon: Smartphone, gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50' },
  { name: 'Home & Kitchen', slug: 'home-kitchen', icon: Home, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
  { name: 'Beauty', slug: 'beauty', icon: Sparkles, gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-50' },
  { name: 'Grocery', slug: 'grocery', icon: ShoppingBasket, gradient: 'from-green-500 to-emerald-500', bg: 'bg-green-50' },
  { name: 'Laptops', slug: 'laptops', icon: Laptop, gradient: 'from-slate-500 to-gray-600', bg: 'bg-slate-50' },
  { name: 'Watches', slug: 'watches', icon: Watch, gradient: 'from-orange-500 to-red-500', bg: 'bg-orange-50' },
  { name: 'Kids', slug: 'kids', icon: Baby, gradient: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-50' },
];

export const Navbar = () => {
  const { user, profile, isAdmin, isSeller, signOut } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategories, setShowCategories] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowCategories(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setShowCategories(false);
    }
  };

  const handleCategoryClick = (slug: string) => {
    navigate(`/products?category=${slug}`);
    setShowCategories(false);
  };

  return (
    <header className="sticky top-0 z-50">
      <nav className="navbar px-4 py-2.5">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 md:gap-6">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10 h-8 w-8">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <div className="bg-primary text-primary-foreground p-5">
                  <div className="flex items-center gap-3">
                    <img src={trendraLogo} alt="Trendra" className="w-10 h-10 rounded object-cover" />
                    <div>
                      <p className="font-bold text-lg">Trendra</p>
                      <p className="text-xs opacity-80">{user ? profile?.full_name || 'My Account' : 'Login & Sign Up'}</p>
                    </div>
                  </div>
                </div>
                <div className="py-2">
                  {!user && (
                    <Link to="/login" className="flex items-center gap-3 py-3 px-5 hover:bg-muted transition-colors border-b">
                      <User className="h-5 w-5 text-primary" />
                      <span className="font-medium">Login / Sign Up</span>
                    </Link>
                  )}
                  <div className="py-2 px-5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Shop By Category</p>
                  </div>
                  {categories.map(cat => (
                    <Link
                      key={cat.slug}
                      to={`/products?category=${cat.slug}`}
                      className="flex items-center gap-3 py-2.5 px-5 hover:bg-muted transition-colors"
                    >
                      <div className={`p-1.5 rounded bg-gradient-to-br ${cat.gradient}`}>
                        <cat.icon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="text-sm">{cat.name}</span>
                    </Link>
                  ))}
                  <hr className="my-2" />
                  <Link to="/fruit-game" className="flex items-center gap-3 py-2.5 px-5 hover:bg-muted">
                    <div className="p-1.5 rounded bg-gradient-to-br from-green-400 to-emerald-500">
                      <Gamepad2 className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-sm font-medium">🎮 Coin Game</span>
                  </Link>
                  <hr className="my-2" />
                  {user && (
                    <>
                      <Link to="/orders" className="flex items-center gap-3 py-2.5 px-5 hover:bg-muted">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">My Orders</span>
                      </Link>
                      <Link to="/wishlist" className="flex items-center gap-3 py-2.5 px-5 hover:bg-muted">
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">My Wishlist</span>
                      </Link>
                      {isSeller && (
                        <Link to="/seller" className="flex items-center gap-3 py-2.5 px-5 hover:bg-muted">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Seller Dashboard</span>
                        </Link>
                      )}
                      {isAdmin && (
                        <Link to="/admin" className="flex items-center gap-3 py-2.5 px-5 hover:bg-muted">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-primary">Admin Panel</span>
                        </Link>
                      )}
                    </>
                  )}
                  <Link to="/become-seller" className="flex items-center gap-3 py-2.5 px-5 hover:bg-muted">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Become a Seller</span>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link to="/" className="flex flex-col items-center shrink-0">
              <img src={trendraLogo} alt="Trendra" className="w-8 h-8 md:w-9 md:h-9 rounded object-cover" />
              <span className="text-[10px] md:text-xs font-semibold text-primary-foreground italic hidden sm:block -mt-0.5">
                Explore <span className="text-yellow-300">Plus</span>
              </span>
            </Link>

            {/* Search Bar with Category Dropdown */}
            <div ref={searchContainerRef} className="flex-1 max-w-2xl hidden md:block relative">
              <form onSubmit={handleSearch}>
                <div className="relative flex">
                  <Input
                    type="search"
                    placeholder="Search for Products, Brands and More"
                    className="search-bar pl-4 pr-12 h-9 w-full rounded-none rounded-l-sm border-0 text-sm"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => setShowCategories(true)}
                  />
                  <button type="submit" className="bg-white px-4 flex items-center justify-center rounded-r-sm hover:bg-gray-50 transition-colors">
                    <Search className="h-5 w-5 text-primary" />
                  </button>
                </div>
              </form>

              {/* Category Panel */}
              <div className={cn(
                "absolute top-full left-0 right-0 mt-1 bg-card shadow-xl border border-border overflow-hidden transition-all duration-200 origin-top z-50",
                showCategories
                  ? "opacity-100 scale-y-100"
                  : "opacity-0 scale-y-95 pointer-events-none"
              )}>
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Shop by Category</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.slug}
                        onClick={() => handleCategoryClick(cat.slug)}
                        className="flex flex-col items-center p-3 rounded hover:bg-muted transition-colors group"
                      >
                        <div className={`p-2.5 rounded-full ${cat.bg} mb-2 group-hover:scale-105 transition-transform`}>
                          <div className={`p-1 rounded bg-gradient-to-br ${cat.gradient}`}>
                            <cat.icon className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <span className="text-xs font-medium text-foreground">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-muted/50 px-4 py-2 border-t">
                  <Link
                    to="/products"
                    className="text-sm text-primary font-medium hover:underline"
                    onClick={() => setShowCategories(false)}
                  >
                    View All Products →
                  </Link>
                </div>
              </div>
            </div>

            {/* Desktop Nav Items */}
            <div className="hidden md:flex items-center gap-1">
              {/* Login / User */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-primary-foreground hover:bg-white/10 gap-1 text-sm font-medium h-9 px-3">
                      <User className="h-4 w-4" />
                      <span className="max-w-[80px] truncate">{profile?.full_name || 'Account'}</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 bg-card z-50">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">My Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="cursor-pointer">
                        <Package className="h-4 w-4 mr-2" />
                        Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/wishlist" className="cursor-pointer">
                        <Heart className="h-4 w-4 mr-2" />
                        Wishlist
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {!isSeller && (
                      <DropdownMenuItem asChild>
                        <Link to="/become-seller" className="cursor-pointer">
                          <Store className="h-4 w-4 mr-2" />
                          Become a Seller
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {isSeller && (
                      <DropdownMenuItem asChild>
                        <Link to="/seller" className="cursor-pointer">
                          <Store className="h-4 w-4 mr-2" />
                          Seller Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer font-medium text-primary">
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => navigate('/login')}
                  className="bg-white text-primary font-semibold hover:bg-white/90 h-8 px-8 text-sm rounded-sm shadow-none"
                >
                  Login
                </Button>
              )}

              {/* Become a Seller */}
              <Button
                variant="ghost"
                className="text-primary-foreground hover:bg-white/10 text-sm font-medium h-9 px-3"
                onClick={() => navigate('/become-seller')}
              >
                Become a Seller
              </Button>

              {/* More dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-primary-foreground hover:bg-white/10 text-sm font-medium h-9 px-3 gap-1">
                    More
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 bg-card z-50">
                  <DropdownMenuItem asChild>
                    <Link to="/about" className="cursor-pointer">About Us</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/contact" className="cursor-pointer">Contact Us</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/help" className="cursor-pointer">Help Center</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notifications */}
              <NotificationBell />

              {/* Cart */}
              <Button
                variant="ghost"
                className="text-primary-foreground hover:bg-white/10 relative h-9 px-3 gap-1.5 text-sm font-medium"
                onClick={() => navigate('/cart')}
              >
                <div className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2.5 bg-yellow-400 text-foreground text-[10px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-0.5">
                      {itemCount}
                    </span>
                  )}
                </div>
                <span className="hidden lg:inline">Cart</span>
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="mt-2 md:hidden relative" ref={searchContainerRef}>
            <form onSubmit={handleSearch}>
              <div className="relative flex">
                <Input
                  type="search"
                  placeholder="Search for Products, Brands and More"
                  className="search-bar pl-4 pr-4 h-9 w-full rounded-none rounded-l-sm border-0 text-sm"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setShowCategories(true)}
                />
                <button type="submit" className="bg-white px-3 flex items-center justify-center rounded-r-sm">
                  <Search className="h-4 w-4 text-primary" />
                </button>
              </div>
            </form>

            {/* Mobile Category Panel */}
            <div className={cn(
              "absolute top-full left-0 right-0 mt-1 bg-card shadow-xl border border-border overflow-hidden transition-all duration-200 origin-top z-50",
              showCategories
                ? "opacity-100 scale-y-100"
                : "opacity-0 scale-y-95 pointer-events-none"
            )}>
              <div className="p-3">
                <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Categories</h3>
                <div className="grid grid-cols-4 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => handleCategoryClick(cat.slug)}
                      className="flex flex-col items-center p-2 rounded hover:bg-muted transition-colors"
                    >
                      <div className={`p-2 rounded-full bg-gradient-to-br ${cat.gradient} mb-1`}>
                        <cat.icon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="text-[10px] font-medium text-foreground text-center leading-tight">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

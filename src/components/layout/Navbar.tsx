import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Heart, User, Menu, ChevronDown, Package, Store, Smartphone, Shirt, Home, Sparkles, ShoppingBasket, Laptop, Watch, Baby } from 'lucide-react';
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
      {/* Main Navbar */}
      <nav className="navbar px-4 py-3">
        <div className="container mx-auto">
          <div className="flex items-center gap-4">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="text-primary-foreground">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <div className="py-4">
                  <h2 className="text-lg font-bold mb-4">Menu</h2>
                  <div className="space-y-2">
                    {categories.map(cat => (
                      <Link 
                        key={cat.slug} 
                        to={`/products?category=${cat.slug}`} 
                        className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted transition-colors"
                      >
                        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${cat.gradient}`}>
                          <cat.icon className="h-4 w-4 text-white" />
                        </div>
                        {cat.name}
                      </Link>
                    ))}
                    <hr className="my-4" />
                    {user ? (
                      <>
                        <Link to="/orders" className="block py-2 px-3 rounded-md hover:bg-muted">
                          My Orders
                        </Link>
                        <Link to="/wishlist" className="block py-2 px-3 rounded-md hover:bg-muted">
                          Wishlist
                        </Link>
                        {isSeller && (
                          <Link to="/seller" className="block py-2 px-3 rounded-md hover:bg-muted">
                            Seller Dashboard
                          </Link>
                        )}
                        {isAdmin && (
                          <Link to="/admin" className="block py-2 px-3 rounded-md hover:bg-muted">
                            Admin Panel
                          </Link>
                        )}
                      </>
                    ) : (
                      <Link to="/login" className="block py-2 px-3 rounded-md hover:bg-muted">
                        Login / Sign Up
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img src={trendraLogo} alt="Trendra" className="w-10 h-10 rounded-lg object-cover" />
              <span className="text-xl font-bold text-primary-foreground hidden sm:block">Trendra</span>
            </Link>

            {/* Search Bar with Category Dropdown */}
            <div ref={searchContainerRef} className="flex-1 max-w-xl hidden md:block relative">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="search" 
                    placeholder="Search for products, brands and more" 
                    className="search-bar pl-10 pr-4 h-10 w-full" 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => setShowCategories(true)}
                  />
                </div>
              </form>

              {/* Category Panel */}
              <div className={cn(
                "absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-xl border border-border/50 overflow-hidden transition-all duration-300 origin-top",
                showCategories 
                  ? "opacity-100 scale-y-100 translate-y-0" 
                  : "opacity-0 scale-y-95 -translate-y-2 pointer-events-none"
              )}>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Shop by Category</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {categories.map((cat) => (
                      <button
                        key={cat.slug}
                        onClick={() => handleCategoryClick(cat.slug)}
                        className="flex flex-col items-center p-3 rounded-xl hover:bg-muted transition-all duration-200 group"
                      >
                        <div className={`p-3 rounded-xl ${cat.bg} mb-2 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
                          <div className={`p-1.5 rounded-lg bg-gradient-to-br ${cat.gradient}`}>
                            <cat.icon className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                          {cat.name}
                        </span>
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
            <div className="hidden md:flex items-center gap-2">
              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-primary-foreground gap-1">
                      <User className="h-5 w-5" />
                      <span className="max-w-[100px] truncate">
                        {profile?.full_name || 'Account'}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="cursor-pointer">
                        <Package className="h-4 w-4 mr-2" />
                        My Orders
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
                <Button variant="ghost" className="text-primary-foreground" onClick={() => navigate('/login')}>
                  <User className="h-5 w-5 mr-1" />
                  Login
                </Button>
              )}

              {/* Wishlist */}
              <Button variant="ghost" className="text-primary-foreground" onClick={() => navigate('/wishlist')}>
                <Heart className="h-5 w-5" />
              </Button>

              {/* Cart */}
              <Button variant="ghost" className="text-primary-foreground relative" onClick={() => navigate('/cart')}>
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="mt-3 md:hidden relative" ref={searchContainerRef}>
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder="Search products..." 
                  className="search-bar pl-10 pr-4 h-10 w-full" 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setShowCategories(true)}
                />
              </div>
            </form>

            {/* Mobile Category Panel */}
            <div className={cn(
              "absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-xl border border-border/50 overflow-hidden transition-all duration-300 origin-top z-50",
              showCategories 
                ? "opacity-100 scale-y-100 translate-y-0" 
                : "opacity-0 scale-y-95 -translate-y-2 pointer-events-none"
            )}>
              <div className="p-3">
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">Categories</h3>
                <div className="grid grid-cols-4 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => handleCategoryClick(cat.slug)}
                      className="flex flex-col items-center p-2 rounded-lg hover:bg-muted transition-all duration-200"
                    >
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${cat.gradient} mb-1`}>
                        <cat.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-[10px] font-medium text-foreground text-center leading-tight">
                        {cat.name}
                      </span>
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

import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Heart, User, Menu, ChevronDown, MapPin, Store, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useState } from 'react';
const categories = [{
  name: 'Fashion',
  slug: 'fashion'
}, {
  name: 'Electronics',
  slug: 'electronics'
}, {
  name: 'Home & Kitchen',
  slug: 'home-kitchen'
}, {
  name: 'Beauty',
  slug: 'beauty'
}, {
  name: 'Grocery',
  slug: 'grocery'
}];
export const Navbar = () => {
  const {
    user,
    profile,
    isAdmin,
    isSeller,
    signOut
  } = useAuth();
  const {
    itemCount
  } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };
  return <header className="sticky top-0 z-50">
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
                    {categories.map(cat => <Link key={cat.slug} to={`/products?category=${cat.slug}`} className="block py-2 px-3 rounded-md hover:bg-muted transition-colors">
                        {cat.name}
                      </Link>)}
                    <hr className="my-4" />
                    {user ? <>
                        <Link to="/orders" className="block py-2 px-3 rounded-md hover:bg-muted">
                          My Orders
                        </Link>
                        <Link to="/wishlist" className="block py-2 px-3 rounded-md hover:bg-muted">
                          Wishlist
                        </Link>
                        {isSeller && <Link to="/seller" className="block py-2 px-3 rounded-md hover:bg-muted">
                            Seller Dashboard
                          </Link>}
                        {isAdmin && <Link to="/admin" className="block py-2 px-3 rounded-md hover:bg-muted">
                            Admin Panel
                          </Link>}
                      </> : <Link to="/login" className="block py-2 px-3 rounded-md hover:bg-muted">
                        Login / Sign Up
                      </Link>}
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-foreground rounded-lg flex items-center justify-center">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-primary-foreground hidden sm:block">trendra

            </span>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden md:flex">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search for products, brands and more" className="search-bar pl-10 pr-4 h-10 w-full" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
            </form>

            {/* Desktop Nav Items */}
            <div className="hidden md:flex items-center gap-2">
              {/* User Menu */}
              {user ? <DropdownMenu>
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
                    {!isSeller && <DropdownMenuItem asChild>
                        <Link to="/become-seller" className="cursor-pointer">
                          <Store className="h-4 w-4 mr-2" />
                          Become a Seller
                        </Link>
                      </DropdownMenuItem>}
                    {isSeller && <DropdownMenuItem asChild>
                        <Link to="/seller" className="cursor-pointer">
                          <Store className="h-4 w-4 mr-2" />
                          Seller Dashboard
                        </Link>
                      </DropdownMenuItem>}
                    {isAdmin && <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer font-medium text-primary">
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu> : <Button variant="ghost" className="text-primary-foreground" onClick={() => navigate('/login')}>
                  <User className="h-5 w-5 mr-1" />
                  Login
                </Button>}

              {/* Wishlist */}
              <Button variant="ghost" className="text-primary-foreground" onClick={() => navigate('/wishlist')}>
                <Heart className="h-5 w-5" />
              </Button>

              {/* Cart */}
              <Button variant="ghost" className="text-primary-foreground relative" onClick={() => navigate('/cart')}>
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount}
                  </span>}
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="mt-3 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search products..." className="search-bar pl-10 pr-4 h-10 w-full" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </form>
        </div>
      </nav>

      {/* Categories Bar - Desktop */}
      <div className="bg-card border-b hidden md:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-8 py-2 overflow-x-auto no-scrollbar">
            {categories.map(cat => <Link key={cat.slug} to={`/products?category=${cat.slug}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap">
                {cat.name}
              </Link>)}
            <Link to="/become-seller" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap ml-auto">
              Sell on ShopKart
            </Link>
          </div>
        </div>
      </div>
    </header>;
};
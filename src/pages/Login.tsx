import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import trendraLogo from '@/assets/trendra-logo.jpeg';
import { toast } from 'sonner';

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });

  const { signIn, signUp, user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      if (isAdmin && redirect === '/') {
        navigate('/admin', { replace: true });
      } else {
        navigate(redirect, { replace: true });
      }
    }
  }, [user, isAdmin, authLoading, navigate, redirect]);



  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    if (!validateEmail(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!isLogin && !formData.fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw error;
        toast.success('Welcome back!');
        // Navigation handled by useEffect
      } else {
        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) throw error;
        toast.success('Account created! Please check your email to verify.');
        navigate(redirect);
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If already logged in, show loading (redirect happening)
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient items-center justify-center p-12">
          <div className="max-w-md text-primary-foreground">
            <div className="flex items-center gap-3 mb-8">
              <img src={trendraLogo} alt="Trendra" className="w-14 h-14 rounded-xl object-cover" />
              <span className="text-3xl font-bold">Trendra</span>
            </div>
          <h1 className="text-4xl font-bold mb-4">
            India's #1 Online Shopping Destination
          </h1>
          <p className="text-xl opacity-90 mb-8">
            Shop from millions of products with amazing deals and discounts. 
            Cash on Delivery available!
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              '🛍️ 10 Million+ Products',
              '💵 Cash on Delivery',
              '🚚 Free Shipping',
              '↩️ Easy Returns',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-primary-foreground/10 p-3 rounded-lg">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <img src={trendraLogo} alt="Trendra" className="w-12 h-12 rounded-xl object-cover" />
            <span className="text-2xl font-bold text-primary">Trendra</span>
          </div>

          <div className="bg-card rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {isLogin ? 'Welcome Back!' : 'Create Account'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isLogin
                ? 'Login to access your account'
                : 'Sign up to start shopping'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      className="pl-10"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="text-right">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot Password?
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                className="w-full btn-primary-gradient"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  'Please wait...'
                ) : (
                  <>
                    {isLogin ? 'Login' : 'Create Account'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>


            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary font-medium ml-1 hover:underline"
                >
                  {isLogin ? 'Sign Up' : 'Login'}
                </button>
              </p>
            </div>
          </div>

          {/* Seller Link */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/become-seller" className="text-primary hover:underline">
              Sell on Trendra
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

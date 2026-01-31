import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Store, TrendingUp, Users, Package, CheckCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const BecomeSellerPage = () => {
  const { user, isSeller, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    business_email: '',
    business_phone: '',
    gstin: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to register as a seller');
      navigate('/login?redirect=/become-seller');
      return;
    }

    // Validation
    if (!formData.business_name.trim()) {
      toast.error('Please enter your business name');
      return;
    }
    if (!formData.business_phone.trim() || formData.business_phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('sellers').insert({
        user_id: user.id,
        business_name: formData.business_name.trim(),
        business_email: formData.business_email.trim() || null,
        business_phone: formData.business_phone.trim(),
        gstin: formData.gstin.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        pincode: formData.pincode.trim() || null,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already registered as a seller');
        } else {
          throw error;
        }
        return;
      }

      await refreshProfile();
      setSubmitted(true);
      toast.success('Seller registration submitted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit registration');
    } finally {
      setLoading(false);
    }
  };

  if (isSeller) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 bg-success/20 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold mb-2">You're Already a Seller!</h1>
            <p className="text-muted-foreground mb-6">
              You have an approved seller account. Start selling on ShopKart today!
            </p>
            <Button onClick={() => navigate('/seller')} className="btn-primary-gradient">
              Go to Seller Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (submitted) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 bg-primary/20 rounded-full flex items-center justify-center">
              <Store className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Registration Submitted!</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for your interest in selling on ShopKart. Our team will review your application and get back to you within 2-3 business days.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              Continue Shopping
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Start Selling on ShopKart
          </h1>
          <p className="text-lg text-muted-foreground">
            Join thousands of sellers and grow your business with India's fastest-growing marketplace
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Users, title: '10M+ Customers', description: 'Access to millions of buyers across India' },
            { icon: TrendingUp, title: 'Grow Your Business', description: 'Powerful tools and analytics to scale' },
            { icon: Package, title: 'Easy Logistics', description: 'Hassle-free shipping and delivery support' },
          ].map((item, index) => (
            <div key={index} className="bg-card rounded-lg p-6 text-center shadow-sm">
              <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <item.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Registration Form */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-lg p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Seller Registration
            </h2>

            {!user && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-muted-foreground">
                  Please <button onClick={() => navigate('/login?redirect=/become-seller')} className="text-primary font-medium hover:underline">login or create an account</button> to register as a seller.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business_name">Business Name *</Label>
                  <Input
                    id="business_name"
                    placeholder="Enter your business name"
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    required
                    maxLength={200}
                  />
                </div>
                <div>
                  <Label htmlFor="business_phone">Business Phone *</Label>
                  <Input
                    id="business_phone"
                    type="tel"
                    placeholder="10-digit phone number"
                    value={formData.business_phone}
                    onChange={(e) => setFormData({ ...formData, business_phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    required
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="business_email">Business Email</Label>
                  <Input
                    id="business_email"
                    type="email"
                    placeholder="Enter business email"
                    value={formData.business_email}
                    onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                    maxLength={255}
                  />
                </div>
                <div>
                  <Label htmlFor="gstin">GSTIN (Optional)</Label>
                  <Input
                    id="gstin"
                    placeholder="Enter GST number"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    maxLength={15}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter your business address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  maxLength={500}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    placeholder="Pincode"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full btn-primary-gradient"
                  size="lg"
                  disabled={loading || !user}
                >
                  {loading ? 'Submitting...' : 'Submit Registration'}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                By registering, you agree to our Seller Terms of Service and Privacy Policy
              </p>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BecomeSellerPage;

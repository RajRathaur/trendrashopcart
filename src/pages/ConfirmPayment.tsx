import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Upload, CheckCircle2, Loader2, Image as ImageIcon } from 'lucide-react';

const ConfirmPayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const productName = searchParams.get('product') || '';
  const productPrice = searchParams.get('amount') || '';
  const productId = searchParams.get('productId') || '';

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setScreenshot(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!screenshot) {
      toast.error('Please upload your payment screenshot');
      return;
    }
    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setSubmitting(true);
    try {
      // Upload screenshot
      const fileExt = screenshot.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, screenshot);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('payment-screenshots')
        .getPublicUrl(fileName);

      // Insert payment confirmation
      const { error: insertError } = await supabase
        .from('payment_confirmations' as any)
        .insert({
          customer_name: customerName.trim(),
          phone_number: phone.trim(),
          delivery_address: address.trim(),
          product_name: productName || 'Unknown Product',
          payment_amount: parseFloat(productPrice) || 0,
          screenshot_url: urlData.publicUrl,
          product_id: productId || null,
          user_id: user?.id || null,
        } as any);

      if (insertError) throw insertError;

      // Notify admin via email (fire and forget)
      supabase.functions.invoke('notify-admin-payment', {
        body: {
          customerName: customerName.trim(),
          phoneNumber: phone.trim(),
          deliveryAddress: address.trim(),
          productName: productName || 'Unknown Product',
          paymentAmount: parseFloat(productPrice) || 0,
          screenshotUrl: urlData.publicUrl,
        },
      }).catch((err) => console.error('Admin notification error:', err));

      setSubmitted(true);
      toast.success('Payment confirmation submitted!');
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 max-w-lg text-center">
          <div className="bg-card rounded-2xl p-8 shadow-lg border">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-3">Order Received!</h1>
            <p className="text-muted-foreground mb-6">
              Your order has been received. Our team will verify the payment and process your order.
            </p>
            <div className="bg-muted rounded-lg p-4 mb-6 text-sm text-left space-y-1">
              <p><span className="font-medium">Product:</span> {productName}</p>
              <p><span className="font-medium">Amount:</span> ₹{productPrice}</p>
              <p><span className="font-medium">Name:</span> {customerName}</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/')} variant="outline" className="flex-1">
                Back to Home
              </Button>
              <Button onClick={() => navigate('/products')} className="flex-1">
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <div className="bg-card rounded-2xl p-6 shadow-lg border">
          <h1 className="text-2xl font-bold text-foreground mb-1">Confirm Your Payment</h1>
          <p className="text-muted-foreground mb-6 text-sm">
            Please upload your payment screenshot to confirm your order.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Screenshot Upload */}
            <div>
              <Label className="mb-2 block font-medium">Payment Screenshot *</Label>
              <label
                htmlFor="screenshot-upload"
                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary transition-colors bg-muted/30"
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Screenshot preview" className="h-full object-contain rounded-lg p-2" />
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground">
                    <Upload className="h-8 w-8 mb-2" />
                    <span className="text-sm">Click to upload screenshot</span>
                    <span className="text-xs mt-1">PNG, JPG up to 5MB</span>
                  </div>
                )}
                <input
                  id="screenshot-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Customer Name */}
            <div>
              <Label htmlFor="name" className="mb-2 block font-medium">Customer Name *</Label>
              <Input
                id="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your full name"
                required
                maxLength={100}
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="mb-2 block font-medium">Phone Number *</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9+\- ]/g, '').slice(0, 15))}
                placeholder="Enter your phone number"
                required
              />
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="address" className="mb-2 block font-medium">Delivery Address *</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your full delivery address"
                required
                maxLength={500}
                rows={3}
              />
            </div>

            {/* Product Info (read-only) */}
            <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product</span>
                <span className="font-medium text-foreground">{productName || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Amount</span>
                <span className="font-bold text-foreground">₹{productPrice || '0'}</span>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                'Submit Payment Confirmation'
              )}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ConfirmPayment;

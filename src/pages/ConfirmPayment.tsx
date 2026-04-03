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
import { Upload, CheckCircle2, Loader2, Shield, ArrowRight, Package } from 'lucide-react';
import { motion } from 'framer-motion';

const ConfirmPayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const productName = searchParams.get('product') || searchParams.get('order') || '';
  const productPrice = searchParams.get('amount') || '';
  const productId = searchParams.get('productId') || searchParams.get('orderId') || '';

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
      const fileExt = screenshot.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, screenshot);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('payment-screenshots')
        .getPublicUrl(fileName);

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
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl p-8 border border-border/50 shadow-lg"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            >
              <div className="w-20 h-20 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
            </motion.div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Payment Submitted!</h1>
            <p className="text-muted-foreground mb-6 text-sm">
              Our team will verify your payment and process your order shortly.
            </p>
            <div className="bg-muted/50 rounded-xl p-4 mb-6 text-sm text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order</span>
                <span className="font-medium">{productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-primary">₹{productPrice}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{customerName}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/orders')} className="flex-1">
                Track Order <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button onClick={() => navigate('/products')} variant="outline" className="flex-1">
                Continue Shopping
              </Button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border/50 shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="bg-primary/5 border-b border-border/50 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Confirm Your Payment</h1>
                <p className="text-muted-foreground text-xs">Upload your UPI payment screenshot to verify</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            {/* Order Info */}
            <div className="bg-muted/50 rounded-xl p-4 mb-5 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" /> Order
                </span>
                <span className="font-medium text-foreground">{productName || '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Amount to Pay</span>
                <span className="font-bold text-lg text-primary">₹{productPrice || '0'}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Screenshot Upload */}
              <div>
                <Label className="mb-2 block text-sm font-medium">Payment Screenshot *</Label>
                <label
                  htmlFor="screenshot-upload"
                  className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                    previewUrl ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-muted/30'
                  }`}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Screenshot preview" className="h-full object-contain rounded-lg p-2" />
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <Upload className="h-7 w-7 mb-2" />
                      <span className="text-sm font-medium">Click to upload screenshot</span>
                      <span className="text-xs mt-0.5">PNG, JPG up to 5MB</span>
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

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm">Customer Name *</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  maxLength={100}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm">Phone Number *</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9+\- ]/g, '').slice(0, 15))}
                  placeholder="10-digit mobile number"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-sm">Delivery Address *</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full delivery address"
                  required
                  maxLength={500}
                  rows={2}
                />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                ) : (
                  'Submit Payment Confirmation'
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1.5">
                <Shield className="h-3 w-3" /> Your payment details are secure
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ConfirmPayment;

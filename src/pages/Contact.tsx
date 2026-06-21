import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ADMIN_CONFIG, getWhatsAppLink } from '@/config/admin';
import { Seo } from '@/components/Seo';

const ContactPage = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!formData.message.trim()) {
      toast.error('Please enter your message');
      return;
    }

    setLoading(true);

    // Simulate API call (demo only)
    setTimeout(() => {
      toast.success('Thank you! Your message has been sent. We will get back to you soon.');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setLoading(false);
    }, 1000);
  };

  return (
    <Layout>
      <Seo
        title="Contact Trendra Shopkart — Customer Support"
        description="Reach the Trendra Shopkart team for orders, returns, seller queries or partnership requests. WhatsApp, email and phone support available."
        path="/contact"
      />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-4">Contact Us</h1>
          <p className="text-muted-foreground">
            Have questions or need help? We're here to assist you. Reach out to us and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h2 className="font-bold text-lg mb-6 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Get in Touch
              </h2>

              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Phone</h3>
                    <p className="text-sm text-muted-foreground">{ADMIN_CONFIG.phone.tollFree}</p>
                    <p className="text-sm text-muted-foreground">{ADMIN_CONFIG.phone.mobile}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">WhatsApp</h3>
                    <a 
                      href={getWhatsAppLink('Hi! I need help with my order.')} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      {ADMIN_CONFIG.whatsapp.displayNumber}
                    </a>
                    <p className="text-xs text-muted-foreground mt-1">Click to chat with us</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Email</h3>
                    <a href={`mailto:${ADMIN_CONFIG.email.primary}`} className="text-sm text-muted-foreground hover:text-primary">
                      {ADMIN_CONFIG.email.primary}
                    </a>
                    <br />
                    <a href={`mailto:${ADMIN_CONFIG.email.support}`} className="text-sm text-muted-foreground hover:text-primary">
                      {ADMIN_CONFIG.email.support}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Address</h3>
                    <p className="text-sm text-muted-foreground">
                      {ADMIN_CONFIG.address.company}<br />
                      {ADMIN_CONFIG.address.street}<br />
                      {ADMIN_CONFIG.address.city}, {ADMIN_CONFIG.address.state} {ADMIN_CONFIG.address.pincode}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Business Hours</h3>
                    <p className="text-sm text-muted-foreground">
                      {ADMIN_CONFIG.businessHours.days}<br />
                      {ADMIN_CONFIG.businessHours.time}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Link */}
            <div className="bg-primary/5 rounded-lg p-6 border border-primary/20">
              <h3 className="font-medium mb-2">Looking for quick answers?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Check our FAQ section for common questions about orders, delivery, and returns.
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Visit Help Center
              </Button>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg p-6 shadow-sm">
              <h2 className="font-bold text-lg mb-6">Send us a Message</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      maxLength={255}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="What is this regarding?"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      maxLength={200}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Type your message here..."
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.message.length}/1000 characters
                  </p>
                </div>

                <Button
                  type="submit"
                  className="btn-primary-gradient"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContactPage;

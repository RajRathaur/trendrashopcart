import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, ArrowRight, MessageCircle } from 'lucide-react';
import { ADMIN_CONFIG, getOrderWhatsAppLink } from '@/config/admin';

const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order') || 'ORD123456';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 bg-success/20 rounded-full flex items-center justify-center animate-scale-in">
            <CheckCircle className="h-14 w-14 text-success" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-2">
            Order Placed Successfully!
          </h1>
          
          <p className="text-muted-foreground mb-6">
            Thank you for your order. We'll notify you when it's shipped.
          </p>

          <div className="bg-card rounded-lg p-6 shadow-sm mb-6">
            <div className="flex items-center justify-center gap-2 text-primary mb-2">
              <Package className="h-5 w-5" />
              <span className="font-semibold">Order Number</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{orderNumber}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Payment: Cash on Delivery (COD)
            </p>
          </div>

          {/* WhatsApp Contact Card */}
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-3">
              Have questions about your order? Contact us on WhatsApp!
            </p>
            <a
              href={getOrderWhatsAppLink(orderNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Chat on WhatsApp
            </a>
            <p className="text-xs text-muted-foreground mt-2">
              {ADMIN_CONFIG.whatsapp.displayNumber}
            </p>
          </div>

          <div className="space-y-3">
            <Link to="/orders">
              <Button className="w-full btn-primary-gradient" size="lg">
                Track Your Order
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            
            <Link to="/products">
              <Button variant="outline" className="w-full" size="lg">
                Continue Shopping
              </Button>
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center text-sm">
            {[
              { icon: '📦', text: 'Order Received' },
              { icon: '🏭', text: 'Processing' },
              { icon: '🚚', text: 'On the Way' },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-2xl">{step.icon}</span>
                <span className="text-muted-foreground">{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderSuccessPage;

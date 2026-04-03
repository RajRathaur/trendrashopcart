import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, ArrowRight, Truck, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order') || 'ORD123456';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </motion.div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Order Placed Successfully!
          </h1>
          
          <p className="text-muted-foreground mb-6 text-sm">
            Thank you for your order. We'll notify you when it ships.
          </p>

          <div className="bg-card rounded-xl border border-border/50 p-5 mb-6">
            <div className="flex items-center justify-center gap-2 text-primary mb-2">
              <Package className="h-4 w-4" />
              <span className="text-sm font-semibold">Order Number</span>
            </div>
            <p className="text-xl font-bold text-foreground font-mono tracking-wide">{orderNumber}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Payment: Cash on Delivery (COD)
            </p>
          </div>

          {/* Order Timeline */}
          <div className="bg-card rounded-xl border border-border/50 p-5 mb-6">
            <div className="flex items-center justify-between">
              {[
                { icon: CheckCircle, label: 'Order Placed', active: true, color: 'text-green-600 bg-green-100 dark:bg-green-950/30' },
                { icon: Clock, label: 'Processing', active: false, color: 'text-muted-foreground bg-muted' },
                { icon: Truck, label: 'Shipped', active: false, color: 'text-muted-foreground bg-muted' },
                { icon: Package, label: 'Delivered', active: false, color: 'text-muted-foreground bg-muted' },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step.color}`}>
                    <step.icon className="h-4 w-4" />
                  </div>
                  <span className={`text-[10px] font-medium ${step.active ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Link to="/orders">
              <Button className="w-full" size="lg">
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
        </motion.div>
      </div>
    </Layout>
  );
};

export default OrderSuccessPage;

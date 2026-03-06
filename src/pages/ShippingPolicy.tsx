import { Layout } from '@/components/layout/Layout';
import { Truck } from 'lucide-react';

const ShippingPolicy = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Truck className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Shipping Policy</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Delivery Coverage</h2>
            <p className="text-muted-foreground">We deliver across India to all serviceable pin codes. Check delivery availability on the product page by entering your pin code.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Delivery Timelines</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Metro cities:</strong> 2-4 business days</li>
              <li><strong>Tier-2 cities:</strong> 3-5 business days</li>
              <li><strong>Remote areas:</strong> 5-7 business days</li>
            </ul>
            <p className="text-muted-foreground">Delivery times may vary during sales, festivals, or due to unforeseen circumstances.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Shipping Charges</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Orders above ₹499:</strong> FREE shipping</li>
              <li><strong>Orders below ₹499:</strong> ₹40 shipping fee</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Order Tracking</h2>
            <p className="text-muted-foreground">Once your order is shipped, you will receive a tracking ID via email. You can track your order from the Orders page in your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Delivery Attempts</h2>
            <p className="text-muted-foreground">Our delivery partner will make up to 2 delivery attempts. If delivery fails after 2 attempts, the order will be returned to us, and a refund will be initiated.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Cash on Delivery</h2>
            <p className="text-muted-foreground">Cash on Delivery (COD) is available for most pin codes. Please keep the exact amount ready at the time of delivery.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Contact</h2>
            <p className="text-muted-foreground">For shipping-related queries, contact us at trendra.care.ac.in@gmail.com.</p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default ShippingPolicy;

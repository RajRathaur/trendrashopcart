import { Layout } from '@/components/layout/Layout';
import { RotateCcw } from 'lucide-react';

const RefundPolicy = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <RotateCcw className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Refund & Return Policy</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Return Window</h2>
            <p className="text-muted-foreground">You may return most items within <strong>7 days</strong> of delivery. Items must be unused, in original packaging, and with all tags attached.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Non-Returnable Items</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Innerwear, lingerie, and swimwear</li>
              <li>Customized or personalized products</li>
              <li>Perishable goods</li>
              <li>Digital downloads and gift cards</li>
              <li>Items marked as "Non-Returnable" on the product page</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Refund Process</h2>
            <p className="text-muted-foreground">Once we receive and inspect the returned item, the refund will be processed within <strong>5-7 business days</strong>. Refunds will be credited to the original payment method.</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>UPI payments: Refund to original UPI ID within 3-5 days</li>
              <li>COD orders: Refund via bank transfer (provide bank details)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Damaged or Defective Items</h2>
            <p className="text-muted-foreground">If you receive a damaged or defective product, contact us within 48 hours of delivery with photos. We will arrange a free replacement or full refund.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Cancellation</h2>
            <p className="text-muted-foreground">Orders can be cancelled before they are shipped. Once shipped, the order must follow the return process. Cancellation requests can be made from your order history page.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Contact for Returns</h2>
            <p className="text-muted-foreground">For return or refund queries, reach us at trendra.care.ac.in@gmail.com or through the Contact Us page.</p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default RefundPolicy;

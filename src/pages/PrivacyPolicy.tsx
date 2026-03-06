import { Layout } from '@/components/layout/Layout';
import { Shield } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
            <p>When you use Trendra Shopcart, we collect the following information:</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Name, email address, phone number, and delivery address</li>
              <li>Payment information (processed securely through payment gateways)</li>
              <li>Order history and preferences</li>
              <li>Device information and browsing activity on our platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>To process and deliver your orders</li>
              <li>To communicate order updates and promotional offers</li>
              <li>To improve our services and user experience</li>
              <li>To prevent fraud and ensure platform security</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Data Security</h2>
            <p className="text-muted-foreground">We implement industry-standard security measures to protect your personal data. All payment transactions are processed through secure, encrypted channels. We do not store your card or UPI details on our servers.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Data Sharing</h2>
            <p className="text-muted-foreground">We do not sell your personal information. We share data only with delivery partners and payment processors necessary to fulfill your orders. Third-party services are bound by confidentiality agreements.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Your Rights</h2>
            <p className="text-muted-foreground">You can request access, correction, or deletion of your personal data at any time by contacting us at trendra.care.ac.in@gmail.com. You may also opt out of promotional communications.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Cookies</h2>
            <p className="text-muted-foreground">We use cookies and similar technologies to enhance your browsing experience, remember preferences, and analyze site traffic. You can manage cookie preferences in your browser settings.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Contact</h2>
            <p className="text-muted-foreground">For privacy-related queries, contact us at trendra.care.ac.in@gmail.com.</p>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default PrivacyPolicy;

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, Package, Truck, RotateCcw, CreditCard, ShieldCheck, HelpCircle, ChevronRight } from 'lucide-react';
import { Seo } from '@/components/Seo';

const helpCategories = [
  { icon: Package, title: 'Orders', description: 'Track, cancel, or return orders' },
  { icon: Truck, title: 'Shipping', description: 'Delivery times and charges' },
  { icon: RotateCcw, title: 'Returns', description: 'Return policy and refunds' },
  { icon: CreditCard, title: 'Payments', description: 'Payment options and COD' },
  { icon: ShieldCheck, title: 'Account', description: 'Login, profile, and security' },
  { icon: HelpCircle, title: 'General', description: 'Other queries' },
];

const faqs = [
  {
    category: 'Orders',
    questions: [
      {
        q: 'How do I track my order?',
        a: 'You can track your order by going to "My Orders" section in your account. Click on the order you want to track to see the current status and delivery updates.',
      },
      {
        q: 'Can I cancel my order?',
        a: 'Yes, you can cancel your order before it is shipped. Go to "My Orders", select the order, and click on "Cancel Order". Once shipped, you can request a return after delivery.',
      },
      {
        q: 'How do I change my delivery address?',
        a: 'You can change the delivery address only before the order is shipped. Contact our customer support immediately if you need to update the address.',
      },
    ],
  },
  {
    category: 'Shipping',
    questions: [
      {
        q: 'What are the delivery charges?',
        a: 'Delivery is FREE for orders above ₹499. For orders below ₹499, a nominal delivery fee of ₹40 is applicable.',
      },
      {
        q: 'How long does delivery take?',
        a: 'Standard delivery takes 3-7 business days depending on your location. Metro cities typically receive orders within 3-4 days.',
      },
      {
        q: 'Do you deliver to my pincode?',
        a: 'We deliver to most pincodes across India. You can check delivery availability by entering your pincode on the product page.',
      },
    ],
  },
  {
    category: 'Returns',
    questions: [
      {
        q: 'What is the return policy?',
        a: 'We offer easy returns within 7 days of delivery for most products. Items should be unused and in original packaging with tags intact.',
      },
      {
        q: 'How do I return a product?',
        a: 'Go to "My Orders", select the order, click "Return", choose the reason, and schedule a pickup. Our delivery partner will collect the item from your address.',
      },
      {
        q: 'When will I get my refund?',
        a: 'Refunds are processed within 5-7 business days after we receive and verify the returned product. The amount will be credited to your original payment method.',
      },
    ],
  },
  {
    category: 'Payments',
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'Currently, we only accept Cash on Delivery (COD). You can pay with cash or UPI at the time of delivery. Online payment options will be available soon.',
      },
      {
        q: 'Is Cash on Delivery available for all orders?',
        a: 'COD is available for most orders and pincodes. Some high-value orders or specific locations may have COD restrictions.',
      },
      {
        q: 'What if I don\'t have exact change for COD?',
        a: 'Our delivery partners carry change for COD orders. You can also pay via UPI to the delivery partner at the time of delivery.',
      },
    ],
  },
];

const HelpPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = searchQuery
    ? faqs.map(category => ({
        ...category,
        questions: category.questions.filter(
          q =>
            q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.a.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(category => category.questions.length > 0)
    : faqs;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.flatMap(c => c.questions.map(q => ({
      "@type": "Question",
      name: q.q,
      acceptedAnswer: { "@type": "Answer", text: q.a },
    }))),
  };

  return (
    <Layout>
      <Seo
        title="Help Center & FAQs — Trendra Shopkart"
        description="Get answers about orders, shipping, returns, payments and your Trendra account. Browse FAQs or contact our support team."
        path="/help"
        jsonLd={faqSchema}
      />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl font-bold text-foreground mb-4">Help Center</h1>
          <p className="text-muted-foreground mb-6">
            Find answers to your questions or contact our support team
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for help..."
              className="pl-10 h-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories */}
        {!searchQuery && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {helpCategories.map((category, index) => (
              <div
                key={index}
                className="bg-card rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
                  <category.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium text-sm">{category.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{category.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold mb-6">Frequently Asked Questions</h2>

          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try different keywords or <Link to="/contact" className="text-primary hover:underline">contact support</Link>
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredFaqs.map((category, index) => (
                <div key={index}>
                  <h3 className="font-semibold text-primary mb-3">{category.category}</h3>
                  <Accordion type="single" collapsible className="bg-card rounded-lg shadow-sm">
                    {category.questions.map((item, qIndex) => (
                      <AccordionItem key={qIndex} value={`${index}-${qIndex}`}>
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <span className="text-left">{item.q}</span>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 text-muted-foreground">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 bg-primary/5 rounded-lg p-8 text-center">
          <h3 className="font-bold text-lg mb-2">Still need help?</h3>
          <p className="text-muted-foreground mb-4">
            Our customer support team is available to assist you
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            Contact Support
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default HelpPage;

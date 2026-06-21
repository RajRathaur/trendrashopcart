import { Layout } from '@/components/layout/Layout';
import { Store, Truck, Shield, Users, Award, Heart } from 'lucide-react';
import { Seo } from '@/components/Seo';

const AboutPage = () => {
  return (
    <Layout>
      <Seo
        title="About Trendra — India's Trusted Online Shopping Destination"
        description="Learn about Trendra Shopkart, India's growing e-commerce platform offering quality products, Cash on Delivery, and fast nationwide shipping."
        path="/about"
      />
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
              <Store className="h-9 w-9 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            About Trendra
          </h1>
          <p className="text-lg text-muted-foreground">
            India's favorite online shopping destination, bringing quality products at the best prices right to your doorstep.
          </p>
        </div>

        {/* Story Section */}
        <div className="bg-card rounded-lg p-8 shadow-sm mb-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-4">Our Story</h2>
              <p className="text-muted-foreground mb-4">
                Founded with a vision to make online shopping accessible to every Indian, Trendra started as a small initiative to bridge the gap between quality products and affordable prices.
              </p>
              <p className="text-muted-foreground mb-4">
                Today, we've grown to become one of India's most trusted e-commerce platforms, serving millions of customers across the country with a wide range of products from fashion to electronics, home essentials to beauty care.
              </p>
              <p className="text-muted-foreground">
                Our commitment to customer satisfaction, combined with our Cash on Delivery option, has made us the preferred choice for shoppers who value trust and convenience.
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg p-8">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <p className="text-3xl font-bold text-primary">10M+</p>
                  <p className="text-sm text-muted-foreground">Happy Customers</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">1M+</p>
                  <p className="text-sm text-muted-foreground">Products</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">500+</p>
                  <p className="text-sm text-muted-foreground">Cities Served</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">50K+</p>
                  <p className="text-sm text-muted-foreground">Sellers</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">Why Choose Us</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Truck,
                title: 'Fast Delivery',
                description: 'Quick and reliable delivery across India with real-time tracking.',
              },
              {
                icon: Shield,
                title: 'Secure Shopping',
                description: '100% secure payments and data protection for peace of mind.',
              },
              {
                icon: Award,
                title: 'Quality Products',
                description: 'Curated selection of products from trusted brands and sellers.',
              },
              {
                icon: Users,
                title: 'Customer First',
                description: '24/7 customer support to assist you with any queries.',
              },
              {
                icon: Heart,
                title: 'Easy Returns',
                description: 'Hassle-free return policy for a worry-free shopping experience.',
              },
              {
                icon: Store,
                title: 'Cash on Delivery',
                description: 'Pay when you receive - no advance payment required.',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-card rounded-lg p-6 shadow-sm text-center hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mission Section */}
        <div className="bg-primary/5 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            To democratize e-commerce in India by making quality products affordable and accessible to everyone, while empowering small businesses and sellers to grow their reach nationwide.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;

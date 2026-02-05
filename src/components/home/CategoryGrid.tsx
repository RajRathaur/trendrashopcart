import { Link } from 'react-router-dom';
import { Smartphone, Shirt, Home, Sparkles, ShoppingBasket, Laptop, Watch, Baby } from 'lucide-react';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/scroll-reveal';

const categories = [
  { name: 'Fashion', slug: 'fashion', icon: Shirt, gradient: 'from-pink-500 to-rose-500', bg: 'bg-pink-50' },
  { name: 'Electronics', slug: 'electronics', icon: Smartphone, gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50' },
  { name: 'Home & Kitchen', slug: 'home-kitchen', icon: Home, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
  { name: 'Beauty', slug: 'beauty', icon: Sparkles, gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-50' },
  { name: 'Grocery', slug: 'grocery', icon: ShoppingBasket, gradient: 'from-green-500 to-emerald-500', bg: 'bg-green-50' },
  { name: 'Laptops', slug: 'laptops', icon: Laptop, gradient: 'from-slate-500 to-gray-600', bg: 'bg-slate-50' },
  { name: 'Watches', slug: 'watches', icon: Watch, gradient: 'from-orange-500 to-red-500', bg: 'bg-orange-50' },
  { name: 'Kids', slug: 'kids', icon: Baby, gradient: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-50' },
];

export const CategoryGrid = () => {
  return (
    <section className="py-8">
      <ScrollReveal variant="fadeUp">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">Shop by Category</h2>
          <Link to="/products" className="text-sm font-medium text-primary hover:underline">
            View All
          </Link>
        </div>
      </ScrollReveal>
      <StaggerContainer className="grid grid-cols-4 md:grid-cols-8 gap-4" staggerDelay={0.08}>
        {categories.map((category) => (
          <StaggerItem key={category.slug}>
            <Link
              to={`/products?category=${category.slug}`}
              className="category-card group"
            >
              <div className={`p-4 rounded-2xl ${category.bg} mb-3 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
                <div className={`p-2 rounded-xl bg-gradient-to-br ${category.gradient} shadow-md`}>
                  <category.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <span className="text-xs font-semibold text-foreground text-center group-hover:text-primary transition-colors duration-300">
                {category.name}
              </span>
            </Link>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
};

import { Link } from 'react-router-dom';
import { Smartphone, Shirt, Home, Sparkles, ShoppingBasket, Laptop, Watch, Baby } from 'lucide-react';

const categories = [
  { name: 'Fashion', slug: 'fashion', icon: Shirt, color: 'bg-pink-100 text-pink-600' },
  { name: 'Electronics', slug: 'electronics', icon: Smartphone, color: 'bg-blue-100 text-blue-600' },
  { name: 'Home & Kitchen', slug: 'home-kitchen', icon: Home, color: 'bg-amber-100 text-amber-600' },
  { name: 'Beauty', slug: 'beauty', icon: Sparkles, color: 'bg-purple-100 text-purple-600' },
  { name: 'Grocery', slug: 'grocery', icon: ShoppingBasket, color: 'bg-green-100 text-green-600' },
  { name: 'Laptops', slug: 'laptops', icon: Laptop, color: 'bg-slate-100 text-slate-600' },
  { name: 'Watches', slug: 'watches', icon: Watch, color: 'bg-orange-100 text-orange-600' },
  { name: 'Kids', slug: 'kids', icon: Baby, color: 'bg-cyan-100 text-cyan-600' },
];

export const CategoryGrid = () => {
  return (
    <section className="py-6">
      <h2 className="section-title mb-4">Shop by Category</h2>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
        {categories.map((category) => (
          <Link
            key={category.slug}
            to={`/products?category=${category.slug}`}
            className="category-card"
          >
            <div className={`p-3 rounded-full ${category.color} mb-2`}>
              <category.icon className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium text-foreground text-center">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

import { Link } from 'react-router-dom';
import { Store, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-primary-foreground mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Store className="h-6 w-6" />
              <span className="text-lg font-bold">ShopKart</span>
            </div>
            <p className="text-sm text-primary-foreground/70 mb-4">
              India's favorite online shopping destination. Shop for fashion, electronics, home & more.
            </p>
            <div className="flex gap-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook className="h-5 w-5 cursor-pointer hover:text-primary transition-colors" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <Twitter className="h-5 w-5 cursor-pointer hover:text-primary transition-colors" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram className="h-5 w-5 cursor-pointer hover:text-primary transition-colors" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <Youtube className="h-5 w-5 cursor-pointer hover:text-primary transition-colors" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/about" className="hover:text-primary-foreground transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary-foreground transition-colors">Contact Us</Link></li>
              <li><Link to="/become-seller" className="hover:text-primary-foreground transition-colors">Sell on ShopKart</Link></li>
              <li><Link to="/about" className="hover:text-primary-foreground transition-colors">Careers</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/help" className="hover:text-primary-foreground transition-colors">Help Center</Link></li>
              <li><Link to="/orders" className="hover:text-primary-foreground transition-colors">Track Order</Link></li>
              <li><Link to="/help" className="hover:text-primary-foreground transition-colors">Returns & Refunds</Link></li>
              <li><Link to="/help" className="hover:text-primary-foreground transition-colors">Shipping Info</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                1800-123-4567
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                support@shopkart.in
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>ShopKart India Pvt. Ltd.<br />Bengaluru, Karnataka 560001</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment & Trust */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-primary-foreground/70">Payment:</span>
              <div className="cod-badge bg-primary-foreground/10 border-primary-foreground/30">
                💵 Cash on Delivery (COD)
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-primary-foreground/70">
              <span>🔒 100% Secure</span>
              <span>📦 Easy Returns</span>
              <span>🚚 Free Shipping*</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-6 text-center">
          <p className="text-sm text-primary-foreground/50">
            © {currentYear} ShopKart India Pvt. Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

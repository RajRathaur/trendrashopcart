import { Link } from 'react-router-dom';
import { Store, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, MessageCircle, CreditCard, Shield, Truck, RotateCcw } from 'lucide-react';
import { ADMIN_CONFIG, getWhatsAppLink } from '@/config/admin';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto" style={{ background: 'hsl(220, 18%, 18%)' }}>
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 text-white/80">
          {/* About */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">About</h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">Press</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">Help</h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/help" className="hover:text-white transition-colors">Payments</Link></li>
              <li><Link to="/help" className="hover:text-white transition-colors">Shipping</Link></li>
              <li><Link to="/help" className="hover:text-white transition-colors">Cancellation & Returns</Link></li>
              <li><Link to="/help" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Policy */}
          <div>
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">Policy</h3>
            <ul className="space-y-2 text-xs">
              <li><Link to="/refund-policy" className="hover:text-white transition-colors">Return Policy</Link></li>
              <li><Link to="/help" className="hover:text-white transition-colors">Terms of Use</Link></li>
              <li><Link to="/help" className="hover:text-white transition-colors">Security</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link></li>
              <li><Link to="/shipping-policy" className="hover:text-white transition-colors">Shipping</Link></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">Social</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a href={ADMIN_CONFIG.social.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Facebook className="h-3.5 w-3.5" /> Facebook
                </a>
              </li>
              <li>
                <a href={ADMIN_CONFIG.social.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Twitter className="h-3.5 w-3.5" /> Twitter
                </a>
              </li>
              <li>
                <a href={ADMIN_CONFIG.social.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Instagram className="h-3.5 w-3.5" /> Instagram
                </a>
              </li>
              <li>
                <a href={ADMIN_CONFIG.social.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Youtube className="h-3.5 w-3.5" /> YouTube
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 md:col-span-2 lg:col-span-2">
            <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">Contact Us</h3>
            <ul className="space-y-3 text-xs">
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {ADMIN_CONFIG.phone.mobile}
              </li>
              <li>
                <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-green-400 transition-colors">
                  <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                  WhatsApp: {ADMIN_CONFIG.whatsapp.displayNumber}
                </a>
              </li>
              <li>
                <a href={`mailto:${ADMIN_CONFIG.email.primary}`} className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  &nbsp;EMAIL - {ADMIN_CONFIG.email.primary}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{ADMIN_CONFIG.address.company}, {ADMIN_CONFIG.address.city}, {ADMIN_CONFIG.address.state} {ADMIN_CONFIG.address.pincode}</span>
              </li>
            </ul>

            {/* Seller link */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <Link to="/become-seller" className="text-xs text-yellow-400 hover:text-yellow-300 font-semibold transition-colors">
                Become a Seller on Trendra →
              </Link>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-white/10 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-6 text-xs text-white/60">
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4" /> 100% Original
              </span>
              <span className="flex items-center gap-1.5">
                <RotateCcw className="h-4 w-4" /> Easy Returns
              </span>
              <span className="flex items-center gap-1.5">
                <Truck className="h-4 w-4" /> Free Shipping*
              </span>
              <span className="flex items-center gap-1.5">
                <CreditCard className="h-4 w-4" /> COD Available
              </span>
            </div>

            {/* Copyright */}
            <p className="text-[11px] text-white/40">
              © {currentYear} Trendra India Pvt. Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { BottomNav } from './BottomNav';

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export const Layout = ({ children, hideFooter = false }: LayoutProps) => {
  const { pathname } = useLocation();
  const showAiFab = !pathname.startsWith('/assistant') && !pathname.startsWith('/admin');
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      {!hideFooter && <Footer />}
      <BottomNav />
      {showAiFab && (
        <Link
          to="/assistant"
          aria-label="Open AI shopping assistant"
          className="fixed bottom-20 md:bottom-6 right-4 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        >
          <Sparkles className="h-5 w-5" />
        </Link>
      )}
    </div>
  );
};


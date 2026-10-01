// Global Admin Contact Configuration
// Update these values to change contact details across the entire application

export const ADMIN_CONFIG = {
  email: {
    primary: 'trendra.care.ac.in@gmail.com',
    support: 'trendra.care.ac.in@gmail.com',
  },
  address: {
    company: 'Trendra',
    street: 'Kalpi',
    city: 'Jalaun',
    state: 'Uttar Pradesh',
    pincode: '285204',
    country: 'India',
  },
  businessHours: {
    days: 'Monday - Saturday',
    time: '9:00 AM - 8:00 PM IST',
  },
  social: {
    facebook: 'https://www.facebook.com/share/1D1EDDmpQY/',
    twitter: 'https://x.com/trendrastore',
    instagram: 'https://instagram.com/trendrastore',
    youtube: 'https://youtube.com/@Trendrastore',
  },
  // Admin emails with full access
  adminEmails: [
    'aksahuakhil@gmail.com',
    'rambaburathour133@gmail.com',
    'trendra.care.ac.in@gmail.com',
  ],
} as const;

// Interface for order WhatsApp message
export interface OrderWhatsAppData {
  orderId: string;
  productName: string;
  productId: string;
  quantity: number;
  price: number;
  customerName: string;
  customerMobile: string;
  deliveryAddress: string;
}

// Helper function to open WhatsApp (works on both mobile and desktop)
export const openWhatsApp = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

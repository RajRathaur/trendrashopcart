// Global Admin Contact Configuration
// Update these values to change contact details across the entire application

export const ADMIN_CONFIG = {
  // Contact Details
  whatsapp: {
    number: '+919125442370',
    displayNumber: '+91 9125442370',
    link: 'https://wa.me/919125442370',
  },
  email: {
    primary: 'trendra.care.ac.in@gmail.com',
    support: 'trendra.care.ac.in@gmail.com',
  },
  phone: {
    tollFree: '1800-123-4567',
    mobile: '+91 9125442370',
  },
  address: {
    company: 'Trendra India Pvt. Ltd.',
    street: '123 Commerce Street',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    country: 'India',
  },
  businessHours: {
    days: 'Monday - Saturday',
    time: '9:00 AM - 8:00 PM IST',
  },
  social: {
    facebook: 'https://facebook.com/trendra',
    twitter: 'https://twitter.com/trendra',
    instagram: 'https://instagram.com/trendra',
    youtube: 'https://youtube.com/trendra',
  },
  // Admin emails with full access
  adminEmails: [
    'aksahuakhil@gmail.com',
    'rambaburathour133@gmail.com',
    'trendra.care.ac.in@gmail.com',
  ],
} as const;

// Helper function to get WhatsApp message link
export const getWhatsAppLink = (message?: string) => {
  const baseUrl = `https://wa.me/${ADMIN_CONFIG.whatsapp.number.replace(/\+/g, '')}`;
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
};

// Helper function to get order inquiry WhatsApp link
export const getOrderWhatsAppLink = (orderNumber: string) => {
  return getWhatsAppLink(`Hi! I have a query about my order #${orderNumber}`);
};

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

// Helper function to generate order confirmation WhatsApp message
export const getOrderConfirmationWhatsAppLink = (data: OrderWhatsAppData) => {
  const message = `Hello, I have placed an order.

Order ID: ${data.orderId}
Product Name: ${data.productName}
Product ID: ${data.productId}
Quantity: ${data.quantity}
Price: ₹${data.price.toLocaleString('en-IN')}
Customer Name: ${data.customerName}
Customer Mobile: ${data.customerMobile}
Delivery Address: ${data.deliveryAddress}`;

  return getWhatsAppLink(message);
};

// Helper function to open WhatsApp (works on both mobile and desktop)
export const openWhatsApp = (url: string) => {
  // Use window.open for both mobile and desktop compatibility
  window.open(url, '_blank', 'noopener,noreferrer');
};

// Global Admin Contact Configuration
// Update these values to change contact details across the entire application

export const ADMIN_CONFIG = {
  // Contact Details
  whatsapp: {
    number: '+9125442370',
    displayNumber: '+91 25442370',
    link: 'https://wa.me/9125442370',
  },
  email: {
    primary: 'admin@trendra.com',
    support: 'support@trendra.com',
  },
  phone: {
    tollFree: '1800-123-4567',
    mobile: '+91 25442370',
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

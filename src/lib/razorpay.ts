declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const RAZORPAY_SCRIPT_ID = 'razorpay-checkout-js';
const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

export const loadRazorpay = async () => {
  if (window.Razorpay) return window.Razorpay;

  const existing = document.getElementById(RAZORPAY_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    await new Promise<void>((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Razorpay could not load')), { once: true });
    });
    if (window.Razorpay) return window.Razorpay;
    throw new Error('Razorpay could not load');
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = RAZORPAY_SCRIPT_ID;
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Razorpay could not load'));
    document.body.appendChild(script);
  });

  if (!window.Razorpay) throw new Error('Razorpay could not load');
  return window.Razorpay;
};
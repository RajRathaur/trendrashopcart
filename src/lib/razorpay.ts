declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const RAZORPAY_SCRIPT_ID = 'razorpay-checkout-js';
const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
const LOAD_TIMEOUT_MS = 15000;

const removeScript = () => {
  document.getElementById(RAZORPAY_SCRIPT_ID)?.remove();
};

const injectScript = () =>
  new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = RAZORPAY_SCRIPT_ID;
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;

    const timer = window.setTimeout(() => {
      cleanup();
      removeScript();
      reject(new Error('Razorpay could not load'));
    }, LOAD_TIMEOUT_MS);

    const cleanup = () => {
      window.clearTimeout(timer);
      script.onload = null;
      script.onerror = null;
    };

    script.onload = () => {
      cleanup();
      resolve();
    };
    script.onerror = () => {
      cleanup();
      removeScript();
      reject(new Error('Razorpay could not load'));
    };

    document.body.appendChild(script);
  });

export const loadRazorpay = async () => {
  if (window.Razorpay) return window.Razorpay;

  // A leftover tag from a failed/timed-out attempt can never fire events
  // again — drop it and inject a fresh one so retries always work.
  removeScript();
  await injectScript();

  if (!window.Razorpay) {
    removeScript();
    throw new Error('Razorpay could not load');
  }
  return window.Razorpay;
};

import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type BazaarListing = Tables<'bazaar_listings'>;
export type BazaarConversation = Tables<'bazaar_conversations'>;
export type BazaarMessage = Tables<'bazaar_messages'>;

export const BAZAAR_CATEGORIES = [
  { value: 'mobiles', label: 'Mobiles', emoji: '📱' },
  { value: 'electronics', label: 'Electronics', emoji: '💻' },
  { value: 'vehicles', label: 'Bikes & Cars', emoji: '🏍️' },
  { value: 'furniture', label: 'Furniture', emoji: '🛋️' },
  { value: 'fashion', label: 'Fashion', emoji: '👕' },
  { value: 'appliances', label: 'Home Appliances', emoji: '🧺' },
  { value: 'books', label: 'Books', emoji: '📚' },
  { value: 'sports', label: 'Sports & Hobbies', emoji: '🏏' },
  { value: 'kids', label: 'Kids & Toys', emoji: '🧸' },
  { value: 'other', label: 'Other', emoji: '📦' },
] as const;

export const BAZAAR_CONDITIONS = [
  { value: 'new', label: 'Bilkul naya (seal pack)' },
  { value: 'like_new', label: 'Naye jaisa' },
  { value: 'good', label: 'Achha' },
  { value: 'fair', label: 'Theek-thaak' },
] as const;

export const MAX_BAZAAR_PHOTOS = 8;
export const MAX_BAZAAR_PRICE = 10_000_000;

type CategoryValue = (typeof BAZAAR_CATEGORIES)[number]['value'];
type ConditionValue = (typeof BAZAAR_CONDITIONS)[number]['value'];

const categoryValues = BAZAAR_CATEGORIES.map((c) => c.value) as [CategoryValue, ...CategoryValue[]];
const conditionValues = BAZAAR_CONDITIONS.map((c) => c.value) as [ConditionValue, ...ConditionValue[]];

export const bazaarListingSchema = z.object({
  title: z.string().trim().min(3, 'Title kam se kam 3 akshar ka ho').max(100, 'Title 100 akshar se chhota rakhein'),
  description: z.string().trim().max(2000, 'Description 2000 akshar se chhota rakhein'),
  price: z
    .number({ error: 'Sahi price likhein' })
    .int('Price poore rupaye me likhein')
    .min(0, 'Price 0 se kam nahi ho sakta')
    .max(MAX_BAZAAR_PRICE, 'Price ₹1 crore se zyada nahi ho sakta'),
  category: z.enum(categoryValues, { error: 'Category chunein' }),
  condition: z.enum(conditionValues, { error: 'Haalat chunein' }),
  city: z.string().trim().min(2, 'Shehar ka naam likhein').max(60, 'Shehar ka naam chhota rakhein'),
  state: z.string().trim().max(60).optional().or(z.literal('')),
  images: z
    .array(z.string().url())
    .min(1, 'Kam se kam 1 photo lagayein')
    .max(MAX_BAZAAR_PHOTOS, `Zyada se zyada ${MAX_BAZAAR_PHOTOS} photos`),
});

export type BazaarListingInput = z.infer<typeof bazaarListingSchema>;

export const validateBazaarListing = (input: unknown) => {
  const r = bazaarListingSchema.safeParse(input);
  if (r.success) return { ok: true as const, data: r.data };
  return { ok: false as const, error: r.error.issues[0]?.message ?? 'Details check karein' };
};

export const categoryLabel = (v: string) => BAZAAR_CATEGORIES.find((c) => c.value === v)?.label ?? 'Other';
export const categoryEmoji = (v: string) => BAZAAR_CATEGORIES.find((c) => c.value === v)?.emoji ?? '📦';
export const conditionLabel = (v: string) => BAZAAR_CONDITIONS.find((c) => c.value === v)?.label ?? v;

export const formatBazaarPrice = (price: number) =>
  price === 0 ? 'Free' : `₹${Math.round(price).toLocaleString('en-IN')}`;

export const timeAgo = (iso: string, now = Date.now()) => {
  const s = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'abhi';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min pehle`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ghante pehle`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} din pehle`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/** Shrinks a photo to max 1280px JPEG before upload so ads load fast on phones. */
const compressImage = (file: File): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); reject(new Error('Photo process nahi ho payi')); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => {
        URL.revokeObjectURL(url);
        if (b) resolve(b); else reject(new Error('Photo process nahi ho payi'));
      }, 'image/jpeg', 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Ye file photo nahi lagti')); };
    img.src = url;
  });

export const uploadBazaarPhoto = async (userId: string, file: File): Promise<string> => {
  if (!file.type.startsWith('image/')) throw new Error('Sirf photo upload karein');
  if (file.size > 15 * 1024 * 1024) throw new Error('Photo 15MB se chhoti honi chahiye');
  const blob = await compressImage(file);
  const path = `bazaar/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage.from('product-images').upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) throw new Error('Photo upload nahi hui, dobara try karein');
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
};

export const BAZAAR_SAFETY_TIPS = [
  'Saaman dekhe bina advance payment mat karein.',
  'Kisi bhi bheed-bhaad wali public jagah par milein.',
  'OTP, UPI PIN ya bank details kabhi share na karein.',
];

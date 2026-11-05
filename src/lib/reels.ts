import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type SocialProfile = Tables<'social_profiles'>;
export type Reel = Tables<'reels'>;

export type FeedReel = Reel & {
  author: Pick<SocialProfile, 'user_id' | 'username' | 'display_name' | 'avatar_url'> | null;
  product: { id: string; name: string; price: number; images: string[] | null } | null;
};

export const MAX_REEL_SECONDS = 90;
export const MAX_REEL_MB = 100;
export const MAX_CAPTION = 500;
export const MAX_COMMENT = 500;

/** Columns used by the feed, profile grid and single reel page. */
export const FEED_SELECT =
  '*, author:social_profiles!reels_user_id_fkey(user_id, username, display_name, avatar_url), product:products(id, name, price, images)';

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Username kam se kam 3 akshar ka ho')
  .max(30, 'Username 30 akshar se chhota rakhein')
  .regex(/^[a-z0-9._]+$/, 'Sirf a-z, 0-9, . aur _ use karein');

export const profileSchema = z.object({
  username: usernameSchema,
  display_name: z.string().trim().max(50, 'Naam 50 akshar se chhota rakhein'),
  bio: z.string().trim().max(200, 'Bio 200 akshar se chhota rakhein'),
});

export const validateProfile = (input: unknown) => {
  const r = profileSchema.safeParse(input);
  if (r.success) return { ok: true as const, data: r.data };
  return { ok: false as const, error: r.error.issues[0]?.message ?? 'Details check karein' };
};

/** Checks a picked video before upload. Returns an error message or null. */
export const checkReelVideo = (file: { type: string; size: number }, durationSeconds: number): string | null => {
  if (!file.type.startsWith('video/')) return 'Sirf video file chunein';
  if (file.size > MAX_REEL_MB * 1024 * 1024) return `Video ${MAX_REEL_MB}MB se chhota hona chahiye`;
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return 'Ye video chal nahi pa raha, doosra try karein';
  if (durationSeconds > MAX_REEL_SECONDS + 0.5) return `Reel ${MAX_REEL_SECONDS} second tak ki hi ho sakti hai`;
  return null;
};

/** 1234 -> 1.2K, 1500000 -> 1.5M */
export const formatCount = (n: number): string => {
  if (n < 1000) return String(Math.max(0, Math.floor(n)));
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, '')}K`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
};

/** Reads duration and grabs a poster frame from a local video file. */
export const readVideo = (file: File): Promise<{ duration: number; poster: Blob | null }> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    let duration = 0;
    const done = (poster: Blob | null) => { URL.revokeObjectURL(url); resolve({ duration, poster }); };
    video.onloadedmetadata = () => {
      duration = video.duration;
      video.currentTime = Math.min(0.5, duration / 2);
    };
    video.onseeked = () => {
      try {
        const scale = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) { done(null); return; }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((b) => done(b), 'image/jpeg', 0.8);
      } catch {
        done(null);
      }
    };
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Ye video chal nahi pa raha, MP4 video try karein')); };
    video.src = url;
  });

const extOf = (file: File) => {
  const fromName = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (['mp4', 'webm', 'mov'].includes(fromName)) return fromName;
  if (file.type.includes('webm')) return 'webm';
  if (file.type.includes('quicktime')) return 'mov';
  return 'mp4';
};

const randomName = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const uploadReelFile = async (
  userId: string,
  body: Blob,
  ext: string,
  contentType: string,
): Promise<string> => {
  const path = `reels/${userId}/${randomName()}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(path, body, { contentType, upsert: false });
  if (error) throw new Error('Upload nahi hua, internet check karke dobara try karein');
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
};

export const uploadReelVideo = (userId: string, file: File) =>
  uploadReelFile(userId, file, extOf(file), file.type || 'video/mp4');

/** Returns the signed-in user's username, creating a profile the first time. */
export const ensureSocialProfile = async (): Promise<string> => {
  const { data, error } = await supabase.rpc('ensure_social_profile');
  if (error || !data) throw new Error('Profile nahi ban payi, dobara try karein');
  return data;
};

/** A few valid UID ideas built from the user's name (used as tap-to-fill chips). */
export const suggestUsernames = (name: string, seed = Date.now()): string[] => {
  const words = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  const first = words[0] ?? '';
  const joined = words.join('').slice(0, 20);
  const n = String(seed % 1000).padStart(3, '0');
  const base = joined.length >= 3 ? joined : 'trendra';
  const ideas = [
    joined,
    words.length > 1 ? words.slice(0, 2).join('.') : `${base}.style`,
    `${first.length >= 3 ? first : base}_${n}`,
    `${base}.official`,
  ];
  return [...new Set(ideas)]
    .map((s) => s.slice(0, 30))
    .filter((s) => usernameSchema.safeParse(s).success);
};

/** True when nobody else already uses this UID. */
export const isUsernameFree = async (username: string, myUserId: string): Promise<boolean> => {
  const { data } = await supabase.from('social_profiles').select('user_id').eq('username', username).maybeSingle();
  return !data || data.user_id === myUserId;
};

export const avatarLetter = (p?: { username?: string | null; display_name?: string | null } | null) =>
  ((p?.display_name || p?.username || '?').trim()[0] ?? '?').toUpperCase();

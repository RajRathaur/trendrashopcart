import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type TechVideo = Tables<'tech_videos'>;
export type CreatorBalance = { user_id: string; username: string; monetized_views: number; earned: number; paid: number; balance: number; status: string | null; upi_id: string | null; full_name: string | null };
export const VIDEO_CATEGORIES = ['Tech', 'Mobile', 'Computers', 'Coding', 'Gadgets', 'Tutorials'];
export const MAX_VIDEO_SECONDS = 1800;
export const MAX_VIDEO_MB = 500;
export const checkTechVideo = (file: { type: string; size: number }, duration: number): string | null => {
  if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)) return 'MP4, WebM ya MOV video chunein';
  if (file.size > MAX_VIDEO_MB * 1024 * 1024) return 'Video 500MB tak rakhein';
  if (!Number.isFinite(duration) || duration <= 0) return 'Video nahi chal rahi';
  if (duration > MAX_VIDEO_SECONDS) return 'Video 30 minute tak rakhein';
  return null;
};
export const searchTerm = (value: string) => value.trim().replace(/[^\p{L}\p{N} ._-]/gu, '').slice(0, 80).replace(/[%_]/g, '');
export const videoTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
export const uploadTechFile = async (userId: string, body: Blob, ext: string) => {
  const path = `videos/${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(path, body, { contentType: body.type, upsert: false });
  if (error) throw new Error('Upload nahi hua: ' + error.message);
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
};
export const removeTechFiles = async (urls: string[]) => {
  const paths = urls.map(url => url.split('/object/public/product-images/')[1]).filter((path): path is string => Boolean(path?.startsWith('videos/')));
  if (paths.length) await supabase.storage.from('product-images').remove(paths);
};/** YouTube-style "x din pehle" label. */
export const timeAgo = (iso: string | null | undefined, now = Date.now()): string => {
  if (!iso) return '';
  const s = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  const steps: [number, string][] = [[31536000, 'saal'], [2592000, 'mahine'], [604800, 'hafte'], [86400, 'din'], [3600, 'ghante'], [60, 'minute']];
  for (const [size, label] of steps) if (s >= size) return `${Math.floor(s / size)} ${label} pehle`;
  return 'abhi abhi';
};

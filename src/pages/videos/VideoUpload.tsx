import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { VideoNav } from '@/components/reels/VideoNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ensureSocialProfile, readVideo } from '@/lib/reels';
import { VIDEO_CATEGORIES, checkTechVideo, uploadTechFile, removeTechFiles } from '@/lib/techVideos';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function VideoUpload() {
  const { user } = useAuth(); const navigate = useNavigate(); const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState('');
  const [poster, setPoster] = useState<Blob | null>(null); const [duration, setDuration] = useState(0);
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [category, setCategory] = useState('Tech');
  const [busy, setBusy] = useState(false); const [checking, setChecking] = useState(false);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const pick = async (f?: File) => {
    if (!f) return; setChecking(true);
    try {
      if (f.size > 500 * 1024 * 1024 || !f.type.startsWith('video/')) throw new Error('Video file 500MB tak chunein');
      const meta = await readVideo(f); const error = checkTechVideo(f, meta.duration); if (error) throw new Error(error);
      setFile(f); setPreview(URL.createObjectURL(f)); setPoster(meta.poster); setDuration(meta.duration);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Video check nahi hui'); } finally { setChecking(false); }
  };
  const submit = async () => {
    if (!user || !file || busy) return;
    if (title.trim().length < 3) { toast.error('Title kam se kam 3 akshar ka rakhein'); return; }
    setBusy(true); const urls: string[] = []; let saved = false;
    try {
      await ensureSocialProfile();
      const url = await uploadTechFile(user.id, file, file.type.includes('webm') ? 'webm' : file.type.includes('quicktime') ? 'mov' : 'mp4'); urls.push(url);
      const thumb = poster ? await uploadTechFile(user.id, poster, 'jpg') : null; if (thumb) urls.push(thumb);
      const { error } = await supabase.from('tech_videos').insert({ user_id: user.id, title: title.trim(), description: description.trim(), category, video_url: url, thumbnail_url: thumb, duration_seconds: duration, status: 'pending' });
      if (error) throw new Error(error.message); saved = true;
      toast.success('Video approval ke liye bhej di'); navigate('/creator/earnings');
    } catch (e) { if (!saved) await removeTechFiles(urls); toast.error(e instanceof Error ? e.message : 'Upload nahi hui'); } finally { setBusy(false); }
  };
  return <Layout><div className="container mx-auto max-w-3xl px-3 py-6"><VideoNav /><h1 className="mb-5 text-2xl font-bold">Technical video upload</h1><div className="space-y-5">
    <input ref={input} type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={e => pick(e.target.files?.[0])} />
    {preview && <video src={preview} controls playsInline className="aspect-video w-full bg-reel object-contain" />}
    <Button variant="outline" disabled={busy || checking} onClick={() => input.current?.click()}>{checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}{file ? 'Video badlein' : 'Video chunein'}</Button><p className="text-xs text-muted-foreground">MP4 / WebM / MOV · 30 min · 500MB</p>
    <div><Label htmlFor="video-title">Title</Label><Input id="video-title" maxLength={120} value={title} onChange={e => setTitle(e.target.value)} /></div>
    <div><Label htmlFor="video-description">Description</Label><Textarea id="video-description" rows={4} maxLength={3000} value={description} onChange={e => setDescription(e.target.value)} /></div>
    <div><Label>Category</Label><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{VIDEO_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
    <Button className="w-full" disabled={!file || busy || checking} onClick={submit}>{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Upload ho rahi hai…</> : 'Approval ke liye bhejein'}</Button>
  </div></div></Layout>;
}
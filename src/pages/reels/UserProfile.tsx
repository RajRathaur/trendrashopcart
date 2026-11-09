import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useReelActions } from '@/hooks/useReelActions';
import { toast } from 'sonner';
import { Camera, Clapperboard, Eye, Loader2, Plus, Trash2 } from 'lucide-react';
import { Reel, SocialProfile, avatarLetter, ensureSocialProfile, formatCount, uploadReelFile, validateProfile } from '@/lib/reels';
import { loginPath } from '@/lib/publicPaths';
import { UsernamePicker } from '@/components/reels/UsernamePicker';
import { VideoNav } from '@/components/reels/VideoNav';

type MiniProfile = Pick<SocialProfile, 'user_id' | 'username' | 'display_name' | 'avatar_url'>;

const Avatar = ({ p, size = 'h-20 w-20 text-2xl' }: { p: Partial<MiniProfile> | null; size?: string }) =>
  p?.avatar_url ? (
    <img src={p.avatar_url} alt="" className={`${size} shrink-0 rounded-full object-cover`} />
  ) : (
    <span className={`${size} flex shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground`}>
      {avatarLetter(p)}
    </span>
  );

const UserProfile = () => {
  const { username = '' } = useParams();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [listOpen, setListOpen] = useState<null | 'followers' | 'following'>(null);
  const [editOpen, setEditOpen] = useState(false);
  const { following, toggleFollow } = useReelActions([]);

  // /u/me -> own profile (created on first visit)
  useEffect(() => {
    if (username !== 'me' || isLoading) return;
    if (!user) { navigate(loginPath('/u/me'), { replace: true }); return; }
    ensureSocialProfile()
      .then((u) => navigate(`/u/${u}`, { replace: true }))
      .catch((e) => toast.error(e.message));
  }, [username, user, isLoading, navigate]);

  const load = useCallback(async () => {
    if (username === 'me') return;
    setLoading(true);
    const { data: p } = await supabase.from('social_profiles').select('*').eq('username', username.toLowerCase()).maybeSingle();
    if (!p) { setNotFound(true); setLoading(false); return; }
    setNotFound(false);
    setProfile(p);
    const { data: r } = await supabase.from('reels').select('*').eq('user_id', p.user_id).order('created_at', { ascending: false }).limit(120);
    setReels(r ?? []);
    setLoading(false);
  }, [username]);

  useEffect(() => { load(); }, [load]);

  const isOwn = Boolean(user && profile && user.id === profile.user_id);
  const isFollowing = profile ? following.has(profile.user_id) : false;
  const approvedCount = reels.filter((r) => r.status === 'approved').length;

  const onFollow = async () => {
    if (!profile) return;
    const d = await toggleFollow(profile.user_id);
    if (d) setProfile((p) => (p ? { ...p, followers_count: Math.max(0, p.followers_count + d) } : p));
  };

  const deleteReel = async (r: Reel) => {
    if (!window.confirm('Ye reel hamesha ke liye delete karein?')) return;
    const { error } = await supabase.from('reels').delete().eq('id', r.id);
    if (error) { toast.error('Delete nahi hui'); return; }
    setReels((list) => list.filter((x) => x.id !== r.id));
    toast.success('Reel delete ho gayi');
  };

  if (username === 'me' || loading) {
    return <Layout><div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></Layout>;
  }

  if (notFound || !profile) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="text-lg font-semibold">Ye profile nahi mili</p>
          <Link to="/reels" className="mt-3 inline-block text-primary underline">Reels dekhein</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo
        title={`${profile.display_name || profile.username} (@${profile.username}) — Trendra Reels`}
        description={profile.bio || `@${profile.username} ki reels Trendra par dekhein.`}
        path={`/u/${profile.username}`}
      />
      <div className="container mx-auto max-w-3xl px-3 py-5">
        <VideoNav />
        {isOwn && !profile.username_set && <div className="mb-6 border-b pb-5"><UsernamePicker profile={profile} onSaved={p => { setProfile(p); navigate(`/u/${p.username}`, { replace: true }); }} /></div>}
        <div className="flex items-center gap-5">
          <Avatar p={profile} />
          <div className="grid flex-1 grid-cols-3 text-center">
            <div><p className="text-lg font-bold">{formatCount(approvedCount)}</p><p className="text-xs text-muted-foreground">Reels</p></div>
            <button type="button" onClick={() => setListOpen('followers')}>
              <p className="text-lg font-bold">{formatCount(profile.followers_count)}</p><p className="text-xs text-muted-foreground">Followers</p>
            </button>
            <button type="button" onClick={() => setListOpen('following')}>
              <p className="text-lg font-bold">{formatCount(profile.following_count)}</p><p className="text-xs text-muted-foreground">Following</p>
            </button>
          </div>
        </div>

        <div className="mt-3">
          {profile.display_name && <p className="font-semibold">{profile.display_name}</p>}
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          {profile.bio && <p className="mt-1 whitespace-pre-wrap text-sm">{profile.bio}</p>}
        </div>

        <div className="mt-4 flex gap-2">
          {isOwn ? (
            <>
              <Button variant="secondary" className="flex-1" onClick={() => setEditOpen(true)}>Profile badlein</Button>
              <Button className="flex-1" onClick={() => navigate('/reels/upload')}><Plus className="mr-1 h-4 w-4" />Reel daalein</Button>
            </>
          ) : (
            <Button className="flex-1" variant={isFollowing ? 'secondary' : 'default'} onClick={onFollow}>
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
        </div>
        <Button variant="outline" className="mt-3" asChild><Link to={`/videos?user=${profile.user_id}`}>Technical videos</Link></Button>

        <div className="mt-6 border-t pt-1">
          {reels.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <Clapperboard className="h-10 w-10" />
              <p className="text-sm">Abhi koi reel nahi</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {reels.map((r) => (
                <div key={r.id} className="relative aspect-[9/16] overflow-hidden bg-muted">
                  <Link to={`/reels/${r.id}`} className="block h-full w-full" aria-label="Reel dekhein">
                    {r.thumbnail_url ? (
                      <img src={r.thumbnail_url} alt={r.caption.slice(0, 60) || 'Reel'} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <span className="flex h-full items-center justify-center"><Clapperboard className="h-6 w-6 text-muted-foreground" /></span>
                    )}
                  </Link>
                  {r.status === 'approved' ? (
                    <span className="pointer-events-none absolute bottom-1 left-1 flex items-center gap-1 rounded bg-reel/50 px-1 text-[11px] font-semibold text-reel-foreground">
                      <Eye className="h-3 w-3" />{formatCount(r.view_count)}
                    </span>
                  ) : (
                    <Badge variant={r.status === 'rejected' ? 'destructive' : 'secondary'} className="pointer-events-none absolute left-1 top-1 text-[10px]">
                      {r.status === 'pending' ? 'Approval baaki' : 'Reject'}
                    </Badge>
                  )}
                  {isOwn && (
                    <button type="button" onClick={() => deleteReel(r)} className="absolute right-1 top-1 rounded-full bg-background/90 p-1" aria-label="Reel delete karein">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {isOwn && r.status === 'rejected' && r.admin_note && (
                    <p className="absolute inset-x-0 bottom-0 bg-destructive/90 p-1 text-[10px] leading-tight text-destructive-foreground">{r.admin_note}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FollowList userId={profile.user_id} mode={listOpen} onClose={() => setListOpen(null)} />
      {isOwn && (
        <EditProfile
          open={editOpen}
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSaved={(p) => { setProfile(p); if (p.username !== username) navigate(`/u/${p.username}`, { replace: true }); }}
        />
      )}
    </Layout>
  );
};

const FollowList = ({ userId, mode, onClose }: { userId: string; mode: null | 'followers' | 'following'; onClose: () => void }) => {
  const [people, setPeople] = useState<MiniProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mode) return;
    setLoading(true);
    const q = mode === 'followers'
      ? supabase.from('user_follows').select('p:social_profiles!user_follows_follower_id_fkey(user_id, username, display_name, avatar_url)').eq('following_id', userId)
      : supabase.from('user_follows').select('p:social_profiles!user_follows_following_id_fkey(user_id, username, display_name, avatar_url)').eq('follower_id', userId);
    q.order('created_at', { ascending: false }).limit(200).then(({ data }) => {
      setPeople(((data ?? []) as unknown as { p: MiniProfile | null }[]).map((r) => r.p).filter(Boolean) as MiniProfile[]);
      setLoading(false);
    });
  }, [mode, userId]);

  return (
    <Dialog open={Boolean(mode)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[80svh] overflow-y-auto">
        <DialogHeader><DialogTitle>{mode === 'followers' ? 'Followers' : 'Following'}</DialogTitle></DialogHeader>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : people.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Abhi koi nahi</p>
        ) : (
          <ul className="space-y-3">
            {people.map((p) => (
              <li key={p.user_id}>
                <Link to={`/u/${p.username}`} onClick={onClose} className="flex items-center gap-3">
                  <Avatar p={p} size="h-10 w-10 text-sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">@{p.username}</span>
                    {p.display_name && <span className="block truncate text-xs text-muted-foreground">{p.display_name}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
};

const EditProfile = ({ open, profile, onClose, onSaved }: {
  open: boolean; profile: SocialProfile; onClose: () => void; onSaved: (p: SocialProfile) => void;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ username: profile.username, display_name: profile.display_name, bio: profile.bio });
  const [avatar, setAvatar] = useState<string | null>(profile.avatar_url);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) { setForm({ username: profile.username, display_name: profile.display_name, bio: profile.bio }); setAvatar(profile.avatar_url); }
  }, [open, profile]);

  const onPhoto = async (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast.error('Sirf photo chunein'); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error('Photo 5MB se chhoti ho'); return; }
    setBusy(true);
    try {
      const ext = f.type.includes('png') ? 'png' : f.type.includes('webp') ? 'webp' : 'jpg';
      setAvatar(await uploadReelFile(profile.user_id, f, ext, f.type));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Photo upload nahi hui');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const save = async () => {
    const r = validateProfile(form);
    if (!r.ok) { toast.error(r.error); return; }
    setBusy(true);
    const { data, error } = await supabase.from('social_profiles')
      .update({ ...r.data, avatar_url: avatar, username_set: true })
      .eq('user_id', profile.user_id).select('*').single();
    setBusy(false);
    if (error) {
      toast.error(error.code === '23505' ? 'Ye username pehle se kisi ka hai, doosra chunein' : 'Profile save nahi hui');
      return;
    }
    toast.success('Profile save ho gayi');
    onSaved(data);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Profile badlein</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar p={{ ...profile, avatar_url: avatar }} />
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
            <div className="flex flex-col gap-1">
              <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
                <Camera className="mr-1 h-4 w-4" />Photo badlein
              </Button>
              {avatar && <Button type="button" variant="ghost" size="sm" onClick={() => setAvatar(null)}>Photo hatayein</Button>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="un">Username</Label>
            <Input id="un" value={form.username} maxLength={30} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase() }))} />
            <p className="text-xs text-muted-foreground">Sirf a-z, 0-9, . aur _ · aapka link: trendra.store/u/{form.username || '…'}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dn">Naam</Label>
            <Input id="dn" value={form.display_name} maxLength={50} onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={form.bio} maxLength={200} rows={3} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
          </div>
          <Button className="w-full" disabled={busy} onClick={save}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save karein'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfile;

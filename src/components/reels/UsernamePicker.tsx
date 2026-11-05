import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AtSign, Check, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SocialProfile, isUsernameFree, suggestUsernames, usernameSchema } from '@/lib/reels';

type Status = 'idle' | 'checking' | 'free' | 'taken' | 'invalid';

/** Lets a user choose their own Trendra UID (username) with a live availability check. */
export const UsernamePicker = ({ profile, onSaved, submitLabel = 'UID save karein' }: {
  profile: SocialProfile;
  onSaved: (p: SocialProfile) => void;
  submitLabel?: string;
}) => {
  const [value, setValue] = useState(profile.username_set ? profile.username : '');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [ideas] = useState(() => suggestUsernames(profile.display_name || profile.username));

  useEffect(() => {
    const v = value.trim().toLowerCase();
    if (!v) { setStatus('idle'); setError(''); return; }
    const r = usernameSchema.safeParse(v);
    if (!r.success) { setStatus('invalid'); setError(r.error.issues[0]?.message ?? 'UID sahi nahi hai'); return; }
    setError('');
    setStatus('checking');
    let live = true;
    const t = window.setTimeout(async () => {
      const free = await isUsernameFree(r.data, profile.user_id);
      if (live) setStatus(free ? 'free' : 'taken');
    }, 350);
    return () => { live = false; window.clearTimeout(t); };
  }, [value, profile.user_id]);

  const save = async () => {
    const r = usernameSchema.safeParse(value);
    if (!r.success || status !== 'free') return;
    setSaving(true);
    const { data, error: e } = await supabase.from('social_profiles')
      .update({ username: r.data, username_set: true })
      .eq('user_id', profile.user_id).select('*').single();
    setSaving(false);
    if (e) {
      if (e.code === '23505') { setStatus('taken'); return; }
      toast.error('UID save nahi hui, dobara try karein');
      return;
    }
    toast.success(`Aapki UID @${data.username} ban gayi`);
    onSaved(data);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="uid">Apni UID (username)</Label>
        <div className="relative">
          <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="uid"
            value={value}
            maxLength={30}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="jaise rahul.style"
            className="pl-9 pr-9"
            onChange={(e) => setValue(e.target.value.toLowerCase().replace(/\s/g, ''))}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {status === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {status === 'free' && <Check className="h-4 w-4 text-success" />}
            {(status === 'taken' || status === 'invalid') && <X className="h-4 w-4 text-destructive" />}
          </span>
        </div>
        <p className={cn('text-xs', status === 'free' ? 'text-success' : status === 'taken' || status === 'invalid' ? 'text-destructive' : 'text-muted-foreground')}>
          {status === 'free' && 'Ye UID khaali hai'}
          {status === 'taken' && 'Ye UID pehle se kisi ki hai, doosri try karein'}
          {status === 'invalid' && error}
          {(status === 'idle' || status === 'checking') && '3–30 akshar · sirf a-z, 0-9, . aur _'}
        </p>
        <p className="text-xs text-muted-foreground">Aapka link: trendra.store/u/{value || '…'}</p>
      </div>

      {ideas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {ideas.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setValue(s)}
              className="rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium hover:bg-muted"
            >
              @{s}
            </button>
          ))}
        </div>
      )}

      <Button className="w-full" disabled={status !== 'free' || saving} onClick={save}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : submitLabel}
      </Button>
    </div>
  );
};

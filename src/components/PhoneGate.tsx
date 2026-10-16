import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Compulsory phone gate: every logged-in user must have a phone number on
 * their profile. Shows a non-dismissible dialog for accounts created via
 * Google or OTP login (no phone collected at signup), and for older accounts.
 */
export const PhoneGate = () => {
  const { user, profile, isLoading, refreshProfile } = useAuth();
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const show = !!user && !isLoading && !!profile && !profile.phone;

  const handleSave = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error('Sahi 10-digit mobile number daaliye');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ phone }).eq('user_id', user!.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Number save ho gaya!');
    } catch (err: any) {
      toast.error(err?.message || 'Number save nahi hua');
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <Dialog open onOpenChange={() => { /* forced — cannot dismiss */ }}>
      <DialogContent
        className="sm:max-w-sm"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" />
            Mobile number zaroori hai
          </DialogTitle>
          <DialogDescription>
            Aapka mobile number admin ko dikhega — order aur delivery updates ke liye. Bina number aage nahi badh sakte.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="gate-phone">Mobile Number</Label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="gate-phone"
                type="tel"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                className="pl-10"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                autoFocus
              />
            </div>
          </div>
          <Button type="button" className="w-full btn-primary-gradient" disabled={saving} onClick={handleSave}>
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
            ) : (
              'Save & Continue'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

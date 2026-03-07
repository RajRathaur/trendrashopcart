import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Plus, Pencil, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Banner {
  id: string;
  image_url: string;
  title: string | null;
  link_url: string | null;
  is_active: boolean | null;
  sort_order: number | null;
}

const AdminBanners = () => {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    link_url: '',
    image_url: '',
    is_active: true,
    sort_order: '0',
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate('/login?redirect=/admin/banners', { replace: true });
      else if (!isAdmin) navigate('/', { replace: true });
    }
  }, [user, authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) fetchBanners();
  }, [isAdmin]);

  const fetchBanners = async () => {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) toast.error('Failed to load banners');
    else setBanners(data || []);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      setFormData(f => ({ ...f, image_url: publicUrl }));
      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
      setPreview('');
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) { toast.error('Please upload a banner image'); return; }

    try {
      const payload = {
        title: formData.title || null,
        link_url: formData.link_url || null,
        image_url: formData.image_url,
        is_active: formData.is_active,
        sort_order: parseInt(formData.sort_order) || 0,
      };

      if (editingBanner) {
        const { error } = await supabase.from('banners').update(payload).eq('id', editingBanner.id);
        if (error) throw error;
        toast.success('Banner updated');
      } else {
        const { error } = await supabase.from('banners').insert(payload);
        if (error) throw error;
        toast.success('Banner added');
      }
      resetForm();
      fetchBanners();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save banner');
    }
  };

  const resetForm = () => {
    setDialogOpen(false);
    setEditingBanner(null);
    setPreview('');
    setFormData({ title: '', link_url: '', image_url: '', is_active: true, sort_order: '0' });
  };

  const handleEdit = (b: Banner) => {
    setEditingBanner(b);
    setFormData({
      title: b.title || '',
      link_url: b.link_url || '',
      image_url: b.image_url,
      is_active: b.is_active ?? true,
      sort_order: String(b.sort_order ?? 0),
    });
    setPreview(b.image_url);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Banner deleted'); fetchBanners(); }
  };

  if (authLoading || !isAdmin) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Banners</h1>
          <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetForm(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" /> Add Banner
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBanner ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Banner Image *</Label>
                  {preview ? (
                    <div className="relative w-full aspect-[16/5] rounded-lg overflow-hidden border bg-muted">
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => { setPreview(''); setFormData(f => ({ ...f, image_url: '' })); }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground">
                        <X className="h-4 w-4" />
                      </button>
                      {uploading && <div className="absolute inset-0 flex items-center justify-center bg-background/80"><Loader2 className="h-6 w-6 animate-spin" /></div>}
                    </div>
                  ) : (
                    <div onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-[16/5] rounded-lg border-2 border-dashed bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                      <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">Click to upload banner</span>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </div>
                <div>
                  <Label htmlFor="title">Title (optional)</Label>
                  <Input id="title" value={formData.title} onChange={e => setFormData(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="link_url">Link URL (optional)</Label>
                  <Input id="link_url" value={formData.link_url} onChange={e => setFormData(f => ({ ...f, link_url: e.target.value }))} placeholder="https://..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sort_order">Sort Order</Label>
                    <Input id="sort_order" type="number" value={formData.sort_order} onChange={e => setFormData(f => ({ ...f, sort_order: e.target.value }))} />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch checked={formData.is_active} onCheckedChange={c => setFormData(f => ({ ...f, is_active: c }))} />
                    <Label>Active</Label>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={uploading}>
                  {editingBanner ? 'Update Banner' : 'Add Banner'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : banners.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">No banners yet</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {banners.map(b => (
              <div key={b.id} className="border rounded-lg overflow-hidden bg-card">
                <div className="aspect-[16/5] bg-muted">
                  <img src={b.image_url} alt={b.title || ''} className="w-full h-full object-cover" />
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{b.title || 'Untitled'}</p>
                    <p className="text-xs text-muted-foreground">Order: {b.sort_order} • {b.is_active ? '✅ Active' : '❌ Inactive'}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(b)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBanners;

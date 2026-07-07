import { useEffect, useState } from 'react';
import { SellerLayout } from '@/components/seller/SellerLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProductImageUpload } from '@/components/admin/ProductImageUpload';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  mrp: number;
  stock: number;
  is_active: boolean;
  slug: string;
  images: string[];
  category_id: string | null;
  description: string | null;
}

interface Category { id: string; name: string; slug: string; }

const SellerProducts = () => {
  const { seller } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [form, setForm] = useState({
    name: '', price: '', mrp: '', stock: '', description: '', imageUrl: '', categoryId: '',
    deliveryCharge: '', freeDelivery: false,
  });

  const load = async () => {
    if (!seller?.id) return;
    setLoading(true);
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('id,name,price,mrp,stock,is_active,slug,images,category_id,description').eq('seller_id', seller.id).order('created_at', { ascending: false }),
      supabase.from('categories').select('id,name,slug').order('name'),
    ]);
    setProducts((prods as Product[]) || []);
    setCategories((cats as Category[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [seller?.id]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', price: '', mrp: '', stock: '', description: '', imageUrl: '', categoryId: categories[0]?.id || '' });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, price: String(p.price), mrp: String(p.mrp), stock: String(p.stock),
      description: p.description || '', imageUrl: p.images?.[0] || '', categoryId: p.category_id || '',
    });
    setDialogOpen(true);
  };

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const save = async () => {
    if (!seller?.id) return;
    if (!form.name.trim() || !form.price || !form.mrp) {
      toast.error('Name, price and MRP are required');
      return;
    }
    setSaving(true);
    const price = parseFloat(form.price);
    const mrp = parseFloat(form.mrp);
    const discount = mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;
    const payload = {
      name: form.name.trim(),
      slug: slugify(form.name) + '-' + Date.now().toString(36),
      price, mrp, discount_percent: discount,
      stock: parseInt(form.stock || '0'),
      description: form.description,
      images: form.imageUrl ? [form.imageUrl] : [],
      category_id: form.categoryId || null,
      seller_id: seller.id,
    };
    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Product updated');
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Product added');
    }
    setSaving(false);
    setDialogOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    load();
  };

  const filtered = filterCategory === 'all' ? products : products.filter((p) => p.category_id === filterCategory);

  return (
    <SellerLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Products</h1>
        <div className="flex gap-2 items-center">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add Product</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Price *</Label>
                    <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  </div>
                  <div>
                    <Label>MRP *</Label>
                    <Input type="number" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} />
                  </div>
                  <div>
                    <Label>Stock</Label>
                    <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <ProductImageUpload imageUrl={form.imageUrl} onImageChange={(url) => setForm({ ...form, imageUrl: url })} />
                <Button onClick={save} disabled={saving} className="w-full">
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editing ? 'Update' : 'Add'} Product
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No products yet. Add your first product!</TableCell></TableRow>
              ) : filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-12 h-12 object-cover rounded" /> : <div className="w-12 h-12 bg-muted rounded" />}
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>₹{p.price}</TableCell>
                  <TableCell>{p.stock}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </SellerLayout>
  );
};

export default SellerProducts;

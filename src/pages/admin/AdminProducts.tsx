import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ProductImageUpload } from '@/components/admin/ProductImageUpload';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Plus, Pencil, Trash2, Flame, X } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  mrp: number;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  slug: string;
  seller_id: string;
  images: string[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

// Suggested size presets per category type (admin can still add custom ones)
const FOOTWEAR_PRESETS = ['5', '6', '7', '8', '9', '10', '11', '12'];
const APPAREL_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const NUMERIC_APPAREL_PRESETS = ['28', '30', '32', '34', '36', '38', '40', '42'];

function detectCategoryKind(slug: string): 'footwear' | 'apparel' | 'pants' | 'none' {
  const s = (slug || '').toLowerCase();
  if (s.includes('footwear') || s.includes('shoe') || s.includes('sneaker') || s.includes('sandal')) return 'footwear';
  if (s.includes('pant') || s.includes('jean') || s.includes('trouser')) return 'pants';
  if (s.includes('shirt') || s.includes('tshirt') || s.includes('t-shirt') || s.includes('kurta') || s.includes('dress') || s.includes('top')) return 'apparel';
  return 'none';
}

const AdminProducts = () => {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sizeInput, setSizeInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    mrp: '',
    stock: '',
    description: '',
    imageUrl: '',
    isFeatured: false,
    categoryId: '',
    sizes: [] as string[],
    colors: [] as string[],
    deliveryCharge: '',
    freeDelivery: false,
  });

  const emptyForm = {
    name: '', price: '', mrp: '', stock: '', description: '', imageUrl: '',
    isFeatured: false, categoryId: '', sizes: [] as string[], colors: [] as string[],
    deliveryCharge: '', freeDelivery: false,
  };

  const selectedCategory = categories.find((c) => c.id === formData.categoryId);
  const categoryKind = selectedCategory ? detectCategoryKind(selectedCategory.slug) : 'none';
  const sizePresets =
    categoryKind === 'footwear' ? FOOTWEAR_PRESETS :
    categoryKind === 'pants' ? NUMERIC_APPAREL_PRESETS :
    categoryKind === 'apparel' ? APPAREL_PRESETS : [];
  const sizeLabel =
    categoryKind === 'footwear' ? 'Shoe Sizes (UK/IND)' :
    categoryKind === 'pants' ? 'Waist Sizes (inches)' :
    categoryKind === 'apparel' ? 'Clothing Sizes' :
    'Sizes';

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login?redirect=/admin/products', { replace: true });
      } else if (!isAdmin) {
        navigate('/', { replace: true });
      }
    }
  }, [user, authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
      fetchCategories();
    }
  }, [isAdmin]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name');
    setCategories((data as Category[]) || []);
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const addSize = (val: string) => {
    const v = val.trim();
    if (!v) return;
    if (formData.sizes.includes(v)) return;
    setFormData({ ...formData, sizes: [...formData.sizes, v] });
    setSizeInput('');
  };
  const removeSize = (val: string) =>
    setFormData({ ...formData, sizes: formData.sizes.filter((s) => s !== val) });

  const addColor = (val: string) => {
    const v = val.trim();
    if (!v) return;
    if (formData.colors.includes(v)) return;
    setFormData({ ...formData, colors: [...formData.colors, v] });
    setColorInput('');
  };
  const removeColor = (val: string) =>
    setFormData({ ...formData, colors: formData.colors.filter((c) => c !== val) });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const slug = formData.name.toLowerCase().replace(/\s+/g, '-');
      const images = formData.imageUrl ? [formData.imageUrl] : [];

      const payload: any = {
        name: formData.name,
        price: parseFloat(formData.price),
        mrp: parseFloat(formData.mrp),
        stock: parseInt(formData.stock),
        slug,
        images,
        is_featured: formData.isFeatured,
        category_id: formData.categoryId || null,
        product_type: selectedCategory?.name || null,
        sizes: formData.sizes.length ? formData.sizes : null,
        colors: formData.colors.length ? formData.colors : null,
        free_delivery: formData.freeDelivery,
        delivery_charge: formData.freeDelivery
          ? 0
          : (formData.deliveryCharge.trim() !== '' ? parseFloat(formData.deliveryCharge) : null),
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);
        if (error) throw error;
        toast.success('Product updated successfully');
      } else {
        const { data: sellers } = await supabase
          .from('sellers')
          .select('id')
          .limit(1)
          .single();

        if (!sellers) {
          toast.error('No seller found. Please create a seller first.');
          return;
        }

        const { error } = await supabase.from('products').insert({
          ...payload,
          seller_id: sellers.id,
          description: formData.description,
        });
        if (error) throw error;
        toast.success('Product created successfully');
      }

      setDialogOpen(false);
      setEditingProduct(null);
      setFormData(emptyForm);
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product');
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      mrp: product.mrp.toString(),
      stock: product.stock.toString(),
      description: '',
      imageUrl: product.images?.[0] || '',
      isFeatured: product.is_featured || false,
      categoryId: product.category_id || '',
      sizes: product.sizes || [],
      colors: product.colors || [],
      deliveryCharge: product.delivery_charge != null ? String(product.delivery_charge) : '',
      freeDelivery: !!product.free_delivery,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleDeleteAll = async () => {
    if (products.length === 0) return;
    const confirmation = prompt(
      `This will permanently delete ALL ${products.length} products and their reviews/wishlist/cart entries. Type DELETE to confirm.`
    );
    if (confirmation !== 'DELETE') return;
    try {
      await supabase.from('product_reviews').delete().not('id', 'is', null);
      await supabase.from('wishlist_items').delete().not('id', 'is', null);
      await supabase.from('cart_items').delete().not('id', 'is', null);
      const { error } = await supabase.from('products').delete().not('id', 'is', null);
      if (error) throw error;
      toast.success('All products deleted');
      fetchProducts();
    } catch (err: any) {
      console.error('Bulk delete failed:', err);
      toast.error(err?.message || 'Failed to delete all products');
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-3xl font-bold">Products</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/categories')}
            >
              Manage Categories
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={products.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingProduct(null);
                setFormData(emptyForm);
                setSizeInput('');
                setColorInput('');
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <ProductImageUpload
                  imageUrl={formData.imageUrl}
                  onImageChange={(url) => setFormData({ ...formData, imageUrl: url })}
                />

                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Product Type / Category *</Label>
                  <select
                    id="category"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value, sizes: [] })}
                    className="flex h-10 w-full border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select category…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      No categories yet. Add them in Manage Categories.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input id="price" type="number" value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                  </div>
                  <div>
                    <Label htmlFor="mrp">MRP (₹)</Label>
                    <Input id="mrp" type="number" value={formData.mrp}
                      onChange={(e) => setFormData({ ...formData, mrp: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="stock">Stock</Label>
                  <Input id="stock" type="number" value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })} required />
                </div>

                {/* Sizes — chip input, enabled once a category is picked */}
                {formData.categoryId && categoryKind !== 'none' && (
                  <div>
                    <Label>{sizeLabel}</Label>
                    {sizePresets.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
                        {sizePresets.map((s) => (
                          <button
                            type="button"
                            key={s}
                            onClick={() => addSize(s)}
                            disabled={formData.sizes.includes(s)}
                            className="px-2.5 py-1 text-xs border border-input disabled:opacity-40 hover:bg-accent"
                          >
                            + {s}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add custom size and press Enter"
                        value={sizeInput}
                        onChange={(e) => setSizeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSize(sizeInput);
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={() => addSize(sizeInput)}>
                        Add
                      </Button>
                    </div>
                    {formData.sizes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {formData.sizes.map((s) => (
                          <span key={s} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary text-primary-foreground">
                            {s}
                            <button type="button" onClick={() => removeSize(s)}>
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Colors — chip input */}
                <div>
                  <Label>Colors</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a color and press Enter (e.g. Black)"
                      value={colorInput}
                      onChange={(e) => setColorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addColor(colorInput);
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={() => addColor(colorInput)}>
                      Add
                    </Button>
                  </div>
                  {formData.colors.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {formData.colors.map((c) => (
                        <span key={c} className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-input">
                          {c}
                          <button type="button" onClick={() => removeColor(c)}>
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {!editingProduct && (
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2 py-2">
                  <Checkbox
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isFeatured: checked === true })
                    }
                  />
                  <Label htmlFor="isFeatured" className="flex items-center gap-2 cursor-pointer font-normal">
                    <Flame className="h-4 w-4 text-destructive" />
                    Mark as High Discount / Sale
                  </Label>
                </div>

                <Button type="submit" className="w-full">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>MRP</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="w-12 h-12 rounded overflow-hidden bg-muted">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                              No img
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {product.name}
                          {product.is_featured && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-destructive text-destructive-foreground">
                              <Flame className="h-3 w-3" />
                              SALE
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>₹{product.price}</TableCell>
                      <TableCell>₹{product.mrp}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          product.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;

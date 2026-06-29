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
import { Loader2, Plus, Pencil, Trash2, Flame } from 'lucide-react';
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

const AdminProducts = () => {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    mrp: '',
    stock: '',
    description: '',
    imageUrl: '',
    isFeatured: false,
    productType: '',
    sizes: '',
    colors: '',
  });

  const PRODUCT_TYPES = [
    'Shirt', 'T-Shirt', 'Pant', 'Jeans', 'Kurta', 'Dress', 'Top',
    'Shoes', 'Sneakers', 'Sandals', 'Accessory', 'Electronics', 'Home', 'Beauty', 'Other',
  ];
  const emptyForm = {
    name: '', price: '', mrp: '', stock: '', description: '', imageUrl: '',
    isFeatured: false, productType: '', sizes: '', colors: '',
  };

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
    }
  }, [isAdmin]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const slug = formData.name.toLowerCase().replace(/\s+/g, '-');
      const images = formData.imageUrl ? [formData.imageUrl] : [];
      const sizesArr = formData.sizes
        .split(',').map((s) => s.trim()).filter(Boolean);
      const colorsArr = formData.colors
        .split(',').map((s) => s.trim()).filter(Boolean);

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update({
            name: formData.name,
            price: parseFloat(formData.price),
            mrp: parseFloat(formData.mrp),
            stock: parseInt(formData.stock),
            slug,
            images,
            is_featured: formData.isFeatured,
            product_type: formData.productType || null,
            sizes: sizesArr.length ? sizesArr : null,
            colors: colorsArr.length ? colorsArr : null,
          })
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
          name: formData.name,
          price: parseFloat(formData.price),
          mrp: parseFloat(formData.mrp),
          stock: parseInt(formData.stock),
          slug,
          seller_id: sellers.id,
          description: formData.description,
          images,
          is_featured: formData.isFeatured,
          product_type: formData.productType || null,
          sizes: sizesArr.length ? sizesArr : null,
          colors: colorsArr.length ? colorsArr : null,
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
      productType: product.product_type || '',
      sizes: (product.sizes || []).join(', '),
      colors: (product.colors || []).join(', '),
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
      // Best-effort: remove dependents first (ignore errors if cascade exists)
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
                setFormData({ name: '', price: '', mrp: '', stock: '', description: '', imageUrl: '', isFeatured: false });
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
                {/* Image Upload */}
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="mrp">MRP (₹)</Label>
                    <Input
                      id="mrp"
                      type="number"
                      value={formData.mrp}
                      onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                  />
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

                {/* High Discount / Sale Checkbox */}
                <div className="flex items-center space-x-2 py-2">
                  <Checkbox
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, isFeatured: checked === true })
                    }
                  />
                  <Label 
                    htmlFor="isFeatured" 
                    className="flex items-center gap-2 cursor-pointer font-normal"
                  >
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                        >
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

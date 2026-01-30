export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  category_id?: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  mrp: number;
  discount_percent: number;
  stock: number;
  images: string[];
  sizes: string[];
  colors: string[];
  specifications: Record<string, string>;
  rating: number;
  review_count: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  seller?: Seller;
}

export interface Seller {
  id: string;
  user_id: string;
  business_name: string;
  business_email?: string;
  business_phone?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  is_approved: boolean;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  size?: string;
  color?: string;
  created_at: string;
  product?: Product;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  shipping_phone: string;
  payment_method: string;
  cod_confirmed: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  seller_id?: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
  created_at: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title?: string;
  comment?: string;
  images: string[];
  is_verified_purchase: boolean;
  created_at: string;
  profile?: Profile;
}

export interface DeliveryPincode {
  id: string;
  pincode: string;
  city?: string;
  state?: string;
  delivery_days: number;
  is_cod_available: boolean;
  is_active: boolean;
  created_at: string;
}

export interface Banner {
  id: string;
  title?: string;
  image_url: string;
  link_url?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'seller' | 'user';
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  NOVA commerce — domain models.                                     */
/*  Every entity carries a `store_id` (tenant key) so one installation */
/*  can host many isolated stores. A real backend can replace the      */
/*  localStorage adapter in src/lib/store.tsx without touching pages.  */
/* ------------------------------------------------------------------ */

export type ID = string;

export interface Store {
  id: ID;
  name: string;
  plan: 'Starter' | 'Growth' | 'Scale';
  createdAt: string;
}

export interface Category {
  id: ID;
  store_id: ID;
  name: string;
  slug: string;
  description: string;
  image: string;
  parent_id: ID | null; // subcategory support
  active: boolean;
}

export interface ProductVariant {
  id: ID;
  label: string;   // e.g. "Colour", "Size"
  value: string;   // e.g. "Graphite", "10.5"
  priceDelta: number;
  stock: number;
  hue?: number;    // CSS hue-rotate used to derive the visual variant
}

export interface Product {
  id: ID;
  store_id: ID;
  name: string;
  slug: string;
  sku: string;
  description: string;
  image: string;
  hue?: number;
  category_id: ID;
  price: number;
  sale_price: number | null;
  stock: number;
  lowStockThreshold: number;
  tags: string[];
  active: boolean;
  featured: boolean;
  isNew: boolean;
  sold: number;
  rating: number;
  ratingCount: number;
  variants: ProductVariant[];
  createdAt: string;
}

export interface Address {
  id: ID;
  label: string;
  line1: string;
  city: string;
  country: string;
  zip: string;
}

export interface Customer {
  id: ID;
  store_id: ID;
  name: string;
  email: string;
  phone: string;
  password: string;
  active: boolean;
  createdAt: string;
  addresses: Address[];
}

export interface OrderItem {
  product_id: ID;
  name: string;
  image: string;
  hue?: number;
  variant?: string;
  sku: string;
  qty: number;
  price: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Order {
  id: ID;
  store_id: ID;
  number: string;
  customer_id: ID | null;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  coupon: string | null;
  shippingMethod: string;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  payment: PaymentStatus;
  createdAt: string;
}

export interface Discount {
  id: ID;
  store_id: ID;
  code: string;
  type: 'percent' | 'fixed' | 'shipping';
  value: number;
  active: boolean;
  startDate: string;
  endDate: string;
  minOrder: number;
  usageLimit: number;
  used: number;
  scope: 'all' | 'category' | 'product';
  scopeIds: ID[];
}

export interface Review {
  id: ID;
  store_id: ID;
  product_id: ID;
  customer: string;
  rating: number;
  text: string;
  date: string;
  status: 'approved' | 'pending' | 'hidden';
}

export type NoticeType = 'order' | 'stock' | 'customer' | 'review' | 'payment';

export interface Notice {
  id: ID;
  store_id: ID;
  type: NoticeType;
  title: string;
  body: string;
  date: string;
  read: boolean;
}

export interface ShippingMethod {
  id: ID;
  name: string;
  fee: number;
  eta: string;
  freeOver: number | null;
  enabled: boolean;
}

export interface PaymentMethodDef {
  id: ID;
  name: string;
  description: string;
  enabled: boolean;
}

export interface StoreSettings {
  storeName: string;
  currency: 'USD' | 'EUR' | 'GBP';
  email: string;
  phone: string;
  address: string;
  freeShipThreshold: number;
  shipping: ShippingMethod[];
  payments: PaymentMethodDef[];
}

export interface WebsiteSettings {
  storeName: string;
  logoText: string;
  tagline: string;
  accent: string;
  announcement: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  heroCta: string;
  promoTitle: string;
  promoBody: string;
  promoCode: string;
  showCategories: boolean;
  showOffers: boolean;
  showReviews: boolean;
  showNewsletter: boolean;
  featuredIds: ID[];
  aboutTitle: string;
  aboutBody: string;
  footerText: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  instagram: string;
  twitter: string;
  facebook: string;
}

export interface Admin {
  id: ID;
  store_id: ID;
  name: string;
  email: string;
  role: string;
  notifyOrders: boolean;
  notifyStock: boolean;
  notifyReviews: boolean;
}

export interface DB {
  stores: Store[];
  categories: Category[];
  products: Product[];
  customers: Customer[];
  orders: Order[];
  discounts: Discount[];
  reviews: Review[];
  notices: Notice[];
  settings: Record<ID, StoreSettings>;
  website: Record<ID, WebsiteSettings>;
  admins: Admin[];
}

export interface CartItem {
  key: string;
  productId: ID;
  variantId?: ID;
  qty: number;
}

export interface CartLine {
  item: CartItem;
  product: Product;
  variant?: ProductVariant;
  unit: number;
  line: number;
}

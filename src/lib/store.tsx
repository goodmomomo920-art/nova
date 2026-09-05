import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  Admin, CartItem, CartLine, Category, Customer, DB, Discount, Notice, NoticeType,
  Order, Product, Review, Store, StoreSettings, WebsiteSettings,
} from './types';
import { seedDB } from './data';
import { money, uid } from './utils';

const LS_DB = 'nova.db.v1';
const LS_UI = 'nova.ui.v1';

interface ToastMsg { id: string; msg: string; kind: 'ok' | 'err' | 'info'; }

export interface CheckoutInput {
  name: string; email: string; phone: string; address: string; city: string; country: string;
  shippingId: string; paymentId: string; coupon: string | null;
}

interface CouponResult { ok: boolean; error?: string; amount?: number; kind?: 'order' | 'shipping'; code?: string; }

type Coll = 'products' | 'categories' | 'customers' | 'orders' | 'discounts' | 'reviews' | 'notices' | 'admins';

interface AppCtx {
  db: DB;
  storeId: string;
  setStoreId: (id: string) => void;
  stores: Store[];
  settings: StoreSettings;
  website: WebsiteSettings;
  admin: Admin;
  products: Product[];
  categories: Category[];
  orders: Order[];
  customers: Customer[];
  discounts: Discount[];
  reviews: Review[];
  notices: Notice[];
  unread: number;
  cart: CartItem[];
  cartLines: CartLine[];
  cartCount: number;
  cartSubtotal: number;
  addToCart: (productId: string, qty?: number, variantId?: string) => void;
  setCartQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  wishlist: string[];
  toggleWish: (id: string) => void;
  customer: Customer | null;
  login: (email: string, password: string) => string | null;
  signup: (name: string, email: string, password: string) => string | null;
  logout: () => void;
  applyCoupon: (code: string, subtotal: number) => CouponResult;
  placeOrder: (input: CheckoutInput) => Order;
  upsert: (col: Coll, row: unknown) => void;
  del: (col: Coll, id: string) => void;
  patch: (fn: (db: DB) => DB) => void;
  notify: (type: NoticeType, title: string, body: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  toast: (msg: string, kind?: ToastMsg['kind']) => void;
  toasts: ToastMsg[];
  dismissToast: (id: string) => void;
  fmt: (n: number) => string;
  resetDemo: () => void;
}

const Ctx = createContext<AppCtx | null>(null);

function loadDB(): DB {
  try {
    const raw = localStorage.getItem(LS_DB);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed && Array.isArray(parsed.stores) && parsed.stores.length) return parsed;
    }
  } catch { /* corrupted storage falls back to seed */ }
  return seedDB();
}

function loadUI(): { storeId: string; cart: CartItem[]; wishlist: string[]; customerId: string | null } {
  try {
    const raw = localStorage.getItem(LS_UI);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { storeId: 'nova', cart: [], wishlist: [], customerId: null };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(loadDB);
  const [ui, setUi] = useState(loadUI);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  useEffect(() => { localStorage.setItem(LS_DB, JSON.stringify(db)); }, [db]);
  useEffect(() => { localStorage.setItem(LS_UI, JSON.stringify(ui)); }, [ui]);

  const { storeId } = ui;

  const toast = useCallback((msg: string, kind: ToastMsg['kind'] = 'ok') => {
    const id = uid();
    setToasts((t) => [...t.slice(-3), { id, msg, kind }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const dismissToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  /* ---------- tenant-scoped selectors ---------- */
  const scoped = useMemo(() => {
    const inStore = <T extends { store_id: string }>(arr: T[]) => arr.filter((x) => x.store_id === storeId);
    return {
      products: inStore(db.products),
      categories: inStore(db.categories),
      orders: inStore(db.orders).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      customers: inStore(db.customers),
      discounts: inStore(db.discounts),
      reviews: inStore(db.reviews),
      notices: inStore(db.notices).sort((a, b) => b.date.localeCompare(a.date)),
    };
  }, [db, storeId]);

  const settings = db.settings[storeId];
  const website = db.website[storeId];
  const admin = db.admins.find((a) => a.store_id === storeId) ?? db.admins[0];

  const fmt = useCallback((n: number) => money(n, settings?.currency ?? 'USD'), [settings]);

  /* ---------- cart ---------- */
  const cartLines = useMemo<CartLine[]>(() => {
    return ui.cart.flatMap((item) => {
      const product = db.products.find((p) => p.id === item.productId);
      if (!product) return [];
      const variant = item.variantId ? product.variants.find((v) => v.id === item.variantId) : undefined;
      const unit = (product.sale_price ?? product.price) + (variant?.priceDelta ?? 0);
      return [{ item, product, variant, unit, line: unit * item.qty }];
    });
  }, [ui.cart, db.products]);

  const cartCount = cartLines.reduce((a, l) => a + l.item.qty, 0);
  const cartSubtotal = cartLines.reduce((a, l) => a + l.line, 0);

  const addToCart = useCallback((productId: string, qty = 1, variantId?: string) => {
    const product = db.products.find((p) => p.id === productId);
    if (!product) return;
    if (product.stock <= 0) { toast('This product is out of stock', 'err'); return; }
    const key = variantId ? `${productId}::${variantId}` : productId;
    setUi((u) => {
      const existing = u.cart.find((c) => c.key === key);
      const nextQty = Math.min((existing?.qty ?? 0) + qty, product.stock);
      const cart = existing
        ? u.cart.map((c) => (c.key === key ? { ...c, qty: nextQty } : c))
        : [...u.cart, { key, productId, variantId, qty: Math.min(qty, product.stock) }];
      return { ...u, cart };
    });
    toast(`${product.name} added to cart`);
  }, [db.products, toast]);

  const setCartQty = useCallback((key: string, qty: number) => {
    setUi((u) => ({
      ...u,
      cart: qty <= 0 ? u.cart.filter((c) => c.key !== key) : u.cart.map((c) => (c.key === key ? { ...c, qty } : c)),
    }));
  }, []);

  const removeLine = useCallback((key: string) => {
    setUi((u) => ({ ...u, cart: u.cart.filter((c) => c.key !== key) }));
    toast('Removed from cart', 'info');
  }, [toast]);

  const clearCart = useCallback(() => setUi((u) => ({ ...u, cart: [] })), []);

  const toggleWish = useCallback((id: string) => {
    const has = ui.wishlist.includes(id);
    setUi((u) => ({ ...u, wishlist: has ? u.wishlist.filter((w) => w !== id) : [...u.wishlist, id] }));
    toast(has ? 'Removed from wishlist' : 'Saved to wishlist', 'info');
  }, [ui.wishlist, toast]);

  /* ---------- auth (demo) ---------- */
  const customer = useMemo(
    () => db.customers.find((c) => c.id === ui.customerId && c.store_id === storeId) ?? null,
    [db.customers, ui.customerId, storeId],
  );

  const login = useCallback((email: string, password: string): string | null => {
    const c = db.customers.find((x) => x.store_id === storeId && x.email.toLowerCase() === email.trim().toLowerCase());
    if (!c) return 'No account found with that email.';
    if (c.password !== password) return 'Incorrect password. Try demo1234.';
    if (!c.active) return 'This account has been deactivated. Contact support.';
    setUi((u) => ({ ...u, customerId: c.id }));
    toast(`Welcome back, ${c.name.split(' ')[0]}`);
    return null;
  }, [db.customers, storeId, toast]);

  const signup = useCallback((name: string, email: string, password: string): string | null => {
    if (db.customers.some((x) => x.store_id === storeId && x.email.toLowerCase() === email.trim().toLowerCase()))
      return 'An account with that email already exists.';
    const c: Customer = {
      id: uid(), store_id: storeId, name, email: email.trim(), phone: '', password,
      active: true, createdAt: new Date().toISOString(), addresses: [],
    };
    setDb((d) => ({ ...d, customers: [c, ...d.customers] }));
    setDb((d) => ({
      ...d,
      notices: [{ id: uid(), store_id: storeId, type: 'customer', title: 'New customer registered', body: `${name} (${email}) created an account.`, date: new Date().toISOString(), read: false }, ...d.notices],
    }));
    setUi((u) => ({ ...u, customerId: c.id }));
    toast(`Account created — welcome, ${name.split(' ')[0]}`);
    return null;
  }, [db.customers, storeId, toast]);

  const logout = useCallback(() => {
    setUi((u) => ({ ...u, customerId: null }));
    toast('Signed out', 'info');
  }, [toast]);

  /* ---------- coupons ---------- */
  const applyCoupon = useCallback((code: string, subtotal: number): CouponResult => {
    const d = scoped.discounts.find((x) => x.code.toLowerCase() === code.trim().toLowerCase());
    if (!d || !d.active) return { ok: false, error: 'That code is invalid or inactive.' };
    const now = Date.now();
    if (now < new Date(d.startDate).getTime()) return { ok: false, error: 'This code is not active yet.' };
    if (now > new Date(d.endDate).getTime()) return { ok: false, error: 'This code has expired.' };
    if (subtotal < d.minOrder) return { ok: false, error: `Requires a minimum order of ${money(d.minOrder, settings?.currency)}.` };
    if (d.used >= d.usageLimit) return { ok: false, error: 'This code has reached its usage limit.' };
    if (d.type === 'shipping') return { ok: true, amount: 0, kind: 'shipping', code: d.code };
    const amount = d.type === 'percent' ? Math.round(subtotal * d.value) / 100 : Math.min(d.value, subtotal);
    return { ok: true, amount, kind: 'order', code: d.code };
  }, [scoped.discounts, settings]);

  /* ---------- orders ---------- */
  const notify = useCallback((type: NoticeType, title: string, body: string) => {
    setDb((d) => ({
      ...d,
      notices: [{ id: uid(), store_id: storeId, type, title, body, date: new Date().toISOString(), read: false }, ...d.notices],
    }));
  }, [storeId]);

  const placeOrder = useCallback((input: CheckoutInput): Order => {
    const method = settings.shipping.find((s) => s.id === input.shippingId) ?? settings.shipping[0];
    let couponRes: CouponResult = { ok: false };
    if (input.coupon) couponRes = applyCoupon(input.coupon, cartSubtotal);
    const orderDiscount = couponRes.ok && couponRes.kind === 'order' ? couponRes.amount ?? 0 : 0;
    const freeShipCoupon = couponRes.ok && couponRes.kind === 'shipping';
    const baseFee = method.freeOver != null && cartSubtotal - orderDiscount >= method.freeOver ? 0 : method.fee;
    const shippingCost = freeShipCoupon ? 0 : baseFee;
    const total = cartSubtotal - orderDiscount + shippingCost;
    const now = new Date().toISOString();
    const order: Order = {
      id: uid(),
      store_id: storeId,
      number: `${storeId === 'nova' ? 'NV' : 'AU'}-${1240 + db.orders.filter((o) => o.store_id === storeId).length + 1}`,
      customer_id: customer?.id ?? null,
      customerName: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address,
      city: input.city,
      country: input.country,
      items: cartLines.map((l) => ({
        product_id: l.product.id,
        name: l.product.name,
        image: l.product.image,
        hue: l.product.hue,
        variant: l.variant?.value,
        sku: l.product.sku,
        qty: l.item.qty,
        price: l.unit,
      })),
      subtotal: cartSubtotal,
      discount: orderDiscount,
      coupon: couponRes.ok ? couponRes.code ?? input.coupon : null,
      shippingMethod: freeShipCoupon ? `${method.name} (code)` : method.name,
      shippingCost,
      total,
      status: 'pending',
      payment: input.paymentId === 'cod' ? 'pending' : 'paid',
      createdAt: now,
    };

    setDb((d) => {
      const products = d.products.map((p) => {
        const line = cartLines.find((l) => l.product.id === p.id);
        if (!line) return p;
        const variants = p.variants.map((v) =>
          line.item.variantId === v.id ? { ...v, stock: Math.max(0, v.stock - line.item.qty) } : v,
        );
        return { ...p, stock: Math.max(0, p.stock - line.item.qty), sold: p.sold + line.item.qty, variants };
      });
      const discounts = order.coupon
        ? d.discounts.map((x) => (x.code === order.coupon ? { ...x, used: x.used + 1 } : x))
        : d.discounts;
      const notices: Notice[] = [
        { id: uid(), store_id: storeId, type: 'order', title: `New order ${order.number}`, body: `${order.customerName} placed an order worth ${money(order.total, settings?.currency)}.`, date: now, read: false },
        ...d.notices,
      ];
      products.forEach((p) => {
        const before = d.products.find((x) => x.id === p.id);
        if (before && before.stock > before.lowStockThreshold && p.stock <= p.lowStockThreshold) {
          notices.unshift({ id: uid(), store_id: storeId, type: 'stock', title: p.stock === 0 ? `${p.name} is out of stock` : `${p.name} is low on stock`, body: `Only ${p.stock} left after order ${order.number}.`, date: now, read: false });
        }
      });
      return { ...d, products, discounts, notices, orders: [order, ...d.orders] };
    });
    clearCart();
    return order;
  }, [settings, applyCoupon, cartSubtotal, cartLines, storeId, db.orders, customer, clearCart]);

  /* ---------- generic mutations ---------- */
  const patch = useCallback((fn: (d: DB) => DB) => setDb(fn), []);

  const upsert = useCallback((col: Coll, row: unknown) => {
    const rec = row as { id: string };
    setDb((d) => {
      const arr = d[col] as Array<{ id: string }>;
      const exists = arr.some((r) => r.id === rec.id);
      const next = exists ? arr.map((r) => (r.id === rec.id ? (rec as never) : r)) : [rec as never, ...arr];
      return { ...d, [col]: next } as DB;
    });
  }, []);

  const del = useCallback((col: Coll, id: string) => {
    setDb((d) => ({ ...d, [col]: (d[col] as Array<{ id: string }>).filter((r) => r.id !== id) }) as DB);
  }, []);

  const markRead = useCallback((id: string) => {
    setDb((d) => ({ ...d, notices: d.notices.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
  }, []);

  const markAllRead = useCallback(() => {
    setDb((d) => ({ ...d, notices: d.notices.map((n) => (n.store_id === storeId ? { ...n, read: true } : n)) }));
  }, [storeId]);

  const resetDemo = useCallback(() => {
    setDb(seedDB());
    setUi((u) => ({ ...u, cart: [], wishlist: [], customerId: null }));
    toast('Demo data restored to its original state', 'info');
  }, [toast]);

  const value: AppCtx = {
    db,
    storeId,
    setStoreId: (id) => setUi((u) => ({ ...u, storeId: id })),
    stores: db.stores,
    settings,
    website,
    admin,
    ...scoped,
    unread: scoped.notices.filter((n) => !n.read).length,
    cart: ui.cart,
    cartLines,
    cartCount,
    cartSubtotal,
    addToCart,
    setCartQty,
    removeLine,
    clearCart,
    wishlist: ui.wishlist,
    toggleWish,
    customer,
    login,
    signup,
    logout,
    applyCoupon,
    placeOrder,
    upsert,
    del,
    patch,
    notify,
    markRead,
    markAllRead,
    toast,
    toasts,
    dismissToast,
    fmt,
    resetDemo,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

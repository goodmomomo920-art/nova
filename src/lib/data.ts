import type {
  Admin, Category, Customer, DB, Discount, Notice, Order, OrderItem, OrderStatus,
  PaymentStatus, Product, Review, Store, StoreSettings, WebsiteSettings,
} from './types';
import { iso, mulberry, slugify } from './utils';

/* Remote CDN imagery generated for the demo catalog */
export const IMG = {
  hero: 'https://image.qwenlm.ai/generated-images/0b160f80-68e0-46be-afc5-e7764679646b/_result.png',
  about: 'https://image.qwenlm.ai/generated-images/513ae32b-eba2-4c14-af2c-ed5ced20f306/_result.png',
  headphones: 'https://image.qwenlm.ai/generated-images/65e1b344-c54a-4552-8e67-d1ef656dc5bd/_result.png',
  watch: 'https://image.qwenlm.ai/generated-images/8ef0b06d-bea0-488c-80c1-9e400ba1527b/_result.png',
  sneaker: 'https://image.qwenlm.ai/generated-images/66d34e81-93d9-4438-a90f-1f115c7a123b/_result.png',
  backpack: 'https://image.qwenlm.ai/generated-images/8a311c58-ed3f-42cc-bcc8-b763e28805fe/_result.png',
  lamp: 'https://image.qwenlm.ai/generated-images/84b0e95d-2009-4512-84dd-d7dc976d63e3/_result.png',
  chair: 'https://image.qwenlm.ai/generated-images/43d379cd-7df3-43c2-b005-37322997cf31/_result.png',
  speaker: 'https://image.qwenlm.ai/generated-images/9d8c9e79-644c-483e-8e51-d1aad7ba7cbf/_result.png',
  sunglasses: 'https://image.qwenlm.ai/generated-images/4175a303-d45d-400f-b130-ea6460dccb93/_result.png',
};

export const ACCENTS = [
  { name: 'Moss', value: '#1e6b4e', soft: '#e0ede4' },
  { name: 'Cobalt', value: '#2b4bc0', soft: '#e2e8f8' },
  { name: 'Oxblood', value: '#8c3a2b', soft: '#f3e3de' },
  { name: 'Espresso', value: '#5f4a33', soft: '#ece4d8' },
  { name: 'Slate', value: '#3d4a5c', soft: '#e3e8ee' },
];

export const HERO_IMAGES = [
  { name: 'Living corner', value: IMG.hero },
  { name: 'Packing desk', value: IMG.about },
  { name: 'Lounge chair', value: IMG.chair },
  { name: 'Headphones', value: IMG.headphones },
];

/* ------------------------------------------------------------------ */
/*  Shared catalog blueprint (instantiated per tenant)                 */
/* ------------------------------------------------------------------ */

const CATS = [
  { slug: 'audio', name: 'Audio', image: IMG.headphones, desc: 'Headphones and speakers tuned for warmth.' },
  { slug: 'headphones', name: 'Headphones', image: IMG.headphones, desc: 'Over-ear, on-ear and ANC.', parent: 'audio' },
  { slug: 'speakers', name: 'Speakers', image: IMG.speaker, desc: 'Portable and home speakers.', parent: 'audio' },
  { slug: 'wearables', name: 'Wearables', image: IMG.watch, desc: 'Watches and straps for every day.' },
  { slug: 'footwear', name: 'Footwear', image: IMG.sneaker, desc: 'Runners and court classics.' },
  { slug: 'bags', name: 'Bags', image: IMG.backpack, desc: 'Carry built from waxed canvas and leather.' },
  { slug: 'lighting', name: 'Lighting', image: IMG.lamp, desc: 'Warm light, sculptural form.' },
  { slug: 'furniture', name: 'Furniture', image: IMG.chair, desc: 'Small-space furniture in walnut and leather.' },
  { slug: 'seating', name: 'Seating', image: IMG.chair, desc: 'Lounge and desk seating.', parent: 'furniture' },
  { slug: 'accessories', name: 'Accessories', image: IMG.sunglasses, desc: 'Finishing touches in metal and acetate.' },
];

interface Blueprint {
  name: string; cat: string; price: number; sale?: number; img: string; hue?: number;
  tags: string[]; desc: string; variants: [string, string, number, number, number?][];
  stock?: number; threshold?: number; created: number;
}

const CATALOG: Blueprint[] = [
  { name: 'Aria ANC Headphones', cat: 'headphones', price: 249, sale: 199, img: IMG.headphones, tags: ['anc', 'wireless', 'bestseller'], created: 96, desc: 'Forty hours of adaptive noise cancelling wrapped in memory-foam comfort. The Aria tunes itself to your ear shape and the room around you, with a transparency mode that actually sounds natural.', variants: [['Colour', 'Graphite', 0, 24], ['Colour', 'Sand', 0, 14, 48]] },
  { name: 'Pulse Smartwatch', cat: 'wearables', price: 219, sale: 179, img: IMG.watch, tags: ['fitness', 'gps', 'bestseller'], created: 82, desc: 'A matte aluminium case, a week of battery, and health sensors that stay out of the way until you need them. Syncs with every major platform.', variants: [['Case', '40 mm', 0, 18], ['Case', '44 mm', 20, 12]] },
  { name: 'Stride Runner', cat: 'footwear', price: 139, img: IMG.sneaker, tags: ['running', 'new'], created: 12, desc: 'Cushioned where it counts, featherweight everywhere else. The Stride’s recycled knit upper breathes through long summer miles.', variants: [['Size', 'US 9', 0, 11], ['Size', 'US 10', 0, 16], ['Size', 'US 11', 0, 9]] },
  { name: 'Metro Backpack', cat: 'bags', price: 119, sale: 95, img: IMG.backpack, tags: ['carry', 'commute', 'bestseller'], created: 118, desc: 'Waxed olive canvas, brass hardware, and a suspended 16-inch laptop sleeve. The Metro breaks in like a good boot.', variants: [['Volume', '18 L', 0, 22], ['Volume', '24 L', 15, 13]] },
  { name: 'Halo Table Lamp', cat: 'lighting', price: 89, img: IMG.lamp, tags: ['ceramic', 'new'], created: 9, desc: 'A hand-glazed ceramic mushroom that throws a pool of warm, dimmable light. Touch-sensitive stem, zero visible switches.', variants: [['Finish', 'Cream', 0, 6], ['Finish', 'Sage', 0, 8, 140]] },
  { name: 'Halo Floor Lamp', cat: 'lighting', price: 179, sale: 149, img: IMG.lamp, hue: 30, tags: ['ceramic', 'living-room'], created: 64, desc: 'The Halo scaled to reading height. Weighted steel base, linen-wrapped cord, and the same touch dimming as its smaller sibling.', variants: [['Finish', 'Terracotta', 0, 12], ['Finish', 'Cream', 0, 7]] },
  { name: 'Nook Lounge Chair', cat: 'seating', price: 449, sale: 379, img: IMG.chair, tags: ['walnut', 'leather', 'bestseller'], created: 132, desc: 'Steam-bent walnut and vegetable-tanned leather that patinas for decades. Flat-packs in twenty minutes, no visible fasteners.', variants: [['Leather', 'Caramel', 0, 6], ['Leather', 'Cognac', 0, 4, 20]] },
  { name: 'Orbit Speaker', cat: 'speakers', price: 129, img: IMG.speaker, tags: ['bluetooth', 'portable', 'new'], created: 15, desc: '360-degree sound from a fabric-wrapped cylinder that fits in a tote. Twenty hours per charge, IP67 against dust and water.', variants: [['Colour', 'Pine', 0, 26], ['Colour', 'Fog', 0, 18, 200]] },
  { name: 'Orbit Micro', cat: 'speakers', price: 79, sale: 59, img: IMG.speaker, hue: 160, tags: ['bluetooth', 'travel'], created: 48, desc: 'Pocketable sound with a shockingly deep low end. Clip it to a bag, pair two for stereo, forget it exists until you need it.', variants: [['Colour', 'Moss', 0, 32], ['Colour', 'Clay', 0, 21, 30]] },
  { name: 'Vista Sunglasses', cat: 'accessories', price: 95, img: IMG.sunglasses, tags: ['gold', 'uv400'], created: 71, desc: 'Hand-finished gold frames with CR-39 lenses in deep green. Five-barrel hinges rated for a decade of daily use.', variants: [['Lens', 'Green', 0, 19], ['Lens', 'Grey', 0, 14]] },
  { name: 'Vista Round Amber', cat: 'accessories', price: 115, img: IMG.sunglasses, hue: 40, tags: ['limited', 'uv400'], created: 26, desc: 'The Vista in warm amber acetate with rose-gold hardware. A numbered run of five hundred pairs.', variants: [['Size', 'Standard', 0, 0]] },
  { name: 'Aria Sport ANC', cat: 'headphones', price: 279, img: IMG.headphones, hue: 200, tags: ['anc', 'sport', 'new'], created: 6, desc: 'Everything the Aria does, sealed against sweat and rain, with a secure-fit headband for interval days.', variants: [['Colour', 'Storm', 0, 17], ['Colour', 'Ember', 0, 11, 20]] },
  { name: 'Stride Court', cat: 'footwear', price: 125, sale: 109, img: IMG.sneaker, hue: 210, tags: ['court', 'classic'], created: 55, desc: 'A seventies court silhouette rebuilt on a modern last. Cupsole construction, terry lining, zero break-in time.', variants: [['Size', 'US 9', 0, 8], ['Size', 'US 10', 0, 14], ['Size', 'US 11', 0, 12]] },
  { name: 'Metro Day Tote', cat: 'bags', price: 99, img: IMG.backpack, hue: 30, tags: ['carry', 'everyday'], created: 38, desc: 'The Metro’s DNA in an open-top tote. Magnetic closure, internal zip pocket, and a sleeve that slides over luggage handles.', variants: [['Colour', 'Tan', 0, 4], ['Colour', 'Olive', 0, 9]] },
  { name: 'Pulse Strap Set', cat: 'wearables', price: 39, img: IMG.watch, hue: 90, tags: ['straps', 'essential'], created: 20, desc: 'Three fluoroelastomer straps in pine, sand and slate. Quick-release pins, no tools, swaps in seconds.', variants: [['Width', '40 mm', 0, 41], ['Width', '44 mm', 0, 27]] },
];

/* ------------------------------------------------------------------ */
/*  Builders                                                           */
/* ------------------------------------------------------------------ */

function buildCategories(storeId: string): Category[] {
  return CATS.map((c) => ({
    id: `${storeId}-c-${c.slug}`,
    store_id: storeId,
    name: c.name,
    slug: c.slug,
    description: c.desc,
    image: c.image,
    parent_id: c.parent ? `${storeId}-c-${c.parent}` : null,
    active: true,
  }));
}

function buildProducts(storeId: string, rand: () => number, prefix: string): Product[] {
  return CATALOG.map((b, i) => {
    const cat = b.cat;
    const sold = Math.floor(20 + rand() * 240);
    const ratingCount = 8 + Math.floor(rand() * 190);
    const rating = Math.round((4.1 + rand() * 0.8) * 10) / 10;
    return {
      id: `${storeId}-p${i + 1}`,
      store_id: storeId,
      name: b.name,
      slug: slugify(b.name),
      sku: `${prefix}-${cat.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(2, '0')}`,
      description: b.desc,
      image: b.img,
      hue: b.hue,
      category_id: `${storeId}-c-${cat}`,
      price: b.price,
      sale_price: b.sale ?? null,
      stock: b.stock ?? b.variants.reduce((a, v) => a + v[3], 0),
      lowStockThreshold: b.threshold ?? 8,
      tags: b.tags,
      active: true,
      featured: i === 0 || i === 2 || i === 6 || i === 7,
      isNew: b.created <= 21,
      sold,
      rating,
      ratingCount,
      variants: b.variants.map((v, vi) => ({
        id: `${storeId}-p${i + 1}-v${vi + 1}`,
        label: v[0],
        value: v[1],
        priceDelta: v[2],
        stock: v[3],
        hue: v[4],
      })),
      createdAt: iso(b.created),
    };
  });
}

const NAMES = ['Maya Chen', 'Liam Okafor', 'Sofia Reyes', 'Noah Lindqvist', 'Ava Patel', 'Ethan Brooks', 'Isla Nakamura', 'Lucas Moreau', 'Zara Haddad', 'Owen Fitzgerald', 'Nora Vestergaard', 'Kai Tanaka'];
const CITIES = ['Portland', 'Austin', 'Brooklyn', 'Seattle', 'Chicago', 'Denver', 'Toronto', 'London'];
const STREETS = ['Alder Street 14', 'Mercer Ave 208', 'Huron Road 51', 'Juniper Lane 7', 'Castor Blvd 930', 'Willow Court 3'];

function buildCustomers(storeId: string, rand: () => number, count: number): Customer[] {
  return Array.from({ length: count }, (_, i) => {
    const name = NAMES[i % NAMES.length];
    const first = name.split(' ')[0].toLowerCase();
    const last = name.split(' ')[1].toLowerCase();
    return {
      id: `${storeId}-u${i + 1}`,
      store_id: storeId,
      name,
      email: i === 0 ? 'maya@demo.com' : `${first}.${last}@example.com`,
      phone: `+1 (555) 0${Math.floor(100 + rand() * 899)}-${Math.floor(1000 + rand() * 8999)}`,
      password: 'demo1234',
      active: i !== count - 1,
      createdAt: iso(Math.floor(rand() * 120) + 2),
      addresses: [
        { id: `${storeId}-u${i + 1}-a1`, label: 'Home', line1: STREETS[i % STREETS.length], city: CITIES[i % CITIES.length], country: 'United States', zip: String(10000 + Math.floor(rand() * 89999)) },
        ...(i % 3 === 0 ? [{ id: `${storeId}-u${i + 1}-a2`, label: 'Office', line1: STREETS[(i + 2) % STREETS.length], city: CITIES[(i + 3) % CITIES.length], country: 'United States', zip: String(10000 + Math.floor(rand() * 89999)) }] : []),
      ],
    };
  });
}

const REVIEW_TEXTS = [
  'The build quality is genuinely a step above anything else I own in this category. Worth every dollar.',
  'Ordered on a Tuesday, unboxed on Friday. Packaging was beautiful and the product itself is even better in person.',
  'Three weeks in and it has become the thing I reach for every single day. Zero regrets.',
  'Great product, though shipping took a day longer than expected. Support answered within the hour though.',
  'You can feel the thought that went into the details — the materials, the weight, the way it folds flat.',
  'Bought one as a gift, came back and bought a second for myself the same week.',
  'Exactly as photographed. The colour is richer in real life and it feels substantially more premium than the price suggests.',
  'Solid four stars. It does everything promised; I would just love one more colourway.',
];

function buildReviews(storeId: string, products: Product[], rand: () => number, count: number): Review[] {
  return Array.from({ length: count }, (_, i) => {
    const p = products[Math.floor(rand() * products.length)];
    const status: Review['status'] = i === count - 1 ? 'hidden' : i >= count - 3 ? 'pending' : 'approved';
    return {
      id: `${storeId}-r${i + 1}`,
      store_id: storeId,
      product_id: p.id,
      customer: NAMES[(i + 4) % NAMES.length],
      rating: 3 + Math.floor(rand() * 3),
      text: REVIEW_TEXTS[i % REVIEW_TEXTS.length],
      date: iso(Math.floor(rand() * 40)),
      status,
    };
  });
}

function buildDiscounts(storeId: string): Discount[] {
  const base = [
    { code: 'NOVA10', type: 'percent' as const, value: 10, minOrder: 0, usageLimit: 500, used: 34, scope: 'all' as const },
    { code: 'WELCOME15', type: 'percent' as const, value: 15, minOrder: 100, usageLimit: 200, used: 12, scope: 'all' as const },
    { code: 'SAVE20', type: 'fixed' as const, value: 20, minOrder: 150, usageLimit: 150, used: 8, scope: 'all' as const },
    { code: 'FREESHIP', type: 'shipping' as const, value: 0, minOrder: 50, usageLimit: 999, used: 57, scope: 'all' as const },
  ];
  return base.map((d, i) => ({
    id: `${storeId}-d${i + 1}`,
    store_id: storeId,
    ...d,
    active: true,
    startDate: iso(30),
    endDate: iso(-60),
    scopeIds: [],
  }));
}

function orderStatusFor(daysAgo: number, rand: () => number): { status: OrderStatus; payment: PaymentStatus } {
  const r = rand();
  if (daysAgo <= 1) {
    const status: OrderStatus = r < 0.5 ? 'pending' : r < 0.8 ? 'confirmed' : 'processing';
    return { status, payment: r < 0.35 ? 'pending' : 'paid' };
  }
  if (daysAgo <= 5) {
    const status: OrderStatus = r < 0.25 ? 'confirmed' : r < 0.75 ? 'processing' : 'shipped';
    return { status, payment: r > 0.92 ? 'pending' : 'paid' };
  }
  if (daysAgo <= 14) {
    if (r > 0.93) return { status: 'cancelled', payment: 'refunded' };
    const status: OrderStatus = r < 0.45 ? 'shipped' : 'delivered';
    return { status, payment: 'paid' };
  }
  if (r > 0.96) return { status: 'cancelled', payment: 'failed' };
  return { status: 'delivered', payment: 'paid' };
}

function buildOrders(storeId: string, products: Product[], customers: Customer[], rand: () => number, count: number, prefix: string): Order[] {
  const out: Order[] = [];
  for (let i = 0; i < count; i++) {
    let daysAgo = Math.floor(Math.pow(rand(), 1.7) * 88);
    if (i < 3) daysAgo = 0;          // guarantee today's revenue
    else if (i === 3) daysAgo = 1;
    const { status, payment } = orderStatusFor(daysAgo, rand);
    const cust = rand() < 0.82 ? customers[Math.floor(rand() * customers.length)] : null;
    const guestName = NAMES[Math.floor(rand() * NAMES.length)];
    const itemCount = 1 + Math.floor(rand() * 3);
    const picked = new Set<number>();
    const items: OrderItem[] = [];
    for (let k = 0; k < itemCount; k++) {
      let pi = Math.floor(rand() * products.length);
      if (picked.has(pi)) pi = (pi + 3) % products.length;
      picked.add(pi);
      const p = products[pi];
      const qty = rand() < 0.8 ? 1 : 2;
      items.push({
        product_id: p.id,
        name: p.name,
        image: p.image,
        hue: p.hue,
        variant: p.variants.length ? p.variants[Math.floor(rand() * p.variants.length)].value : undefined,
        sku: p.sku,
        qty,
        price: p.sale_price ?? p.price,
      });
    }
    const subtotal = items.reduce((a, it) => a + it.price * it.qty, 0);
    const discount = subtotal > 120 && rand() < 0.3 ? Math.round(subtotal * 0.1) : 0;
    const shippingCost = status === 'cancelled' ? 0 : subtotal - discount >= 150 ? 0 : rand() < 0.8 ? 9 : 19;
    const city = CITIES[Math.floor(rand() * CITIES.length)];
    out.push({
      id: `${storeId}-o${i + 1}`,
      store_id: storeId,
      number: `${prefix}-${1240 + i}`,
      customer_id: cust?.id ?? null,
      customerName: cust?.name ?? guestName,
      email: cust?.email ?? `${guestName.split(' ')[0].toLowerCase()}@mail.com`,
      phone: cust?.phone ?? '+1 (555) 014-2231',
      address: STREETS[Math.floor(rand() * STREETS.length)],
      city,
      country: 'United States',
      items,
      subtotal,
      discount,
      coupon: discount ? 'NOVA10' : null,
      shippingMethod: shippingCost === 19 ? 'Express' : shippingCost === 0 && subtotal - discount >= 150 ? 'Standard (free)' : 'Standard',
      shippingCost,
      total: subtotal - discount + shippingCost,
      status,
      payment,
      createdAt: iso(daysAgo, 8 + Math.floor(rand() * 11), Math.floor(rand() * 59)),
    });
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function buildNotices(storeId: string, orders: Order[], products: Product[], reviews: Review[], customers: Customer[]): Notice[] {
  const out: Notice[] = [];
  const push = (type: Notice['type'], title: string, body: string, date: string, read: boolean) =>
    out.push({ id: `${storeId}-n${out.length + 1}`, store_id: storeId, type, title, body, date, read });
  const recent = orders.slice(0, 3);
  recent.forEach((o, i) => push('order', `New order ${o.number}`, `${o.customerName} placed an order worth $${o.total.toFixed(0)} — ${o.items.length} item${o.items.length > 1 ? 's' : ''}.`, o.createdAt, i > 0));
  products.filter((p) => p.stock <= p.lowStockThreshold).slice(0, 2)
    .forEach((p) => push('stock', p.stock === 0 ? `${p.name} is out of stock` : `${p.name} is low on stock`, `Only ${p.stock} unit${p.stock === 1 ? '' : 's'} left (threshold ${p.lowStockThreshold}). Consider restocking.`, iso(1), false));
  const paid = orders.find((o) => o.payment === 'paid' && o.status !== 'cancelled');
  if (paid) push('payment', `Payment captured — ${paid.number}`, `$${paid.total.toFixed(2)} settled to your account.`, paid.createdAt, true);
  const pendingReview = reviews.find((r) => r.status === 'pending');
  if (pendingReview) push('review', 'New review awaiting approval', `${pendingReview.customer} left ${pendingReview.rating} stars on a product.`, pendingReview.date, false);
  const newCust = [...customers].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  if (newCust) push('customer', 'New customer registered', `${newCust.name} (${newCust.email}) created an account.`, newCust.createdAt, false);
  return out;
}

function buildSettings(storeId: string, name: string, currency: StoreSettings['currency'], freeOver: number): StoreSettings {
  return {
    storeName: name,
    currency,
    email: `hello@${name.split(' ')[0].toLowerCase()}.store`,
    phone: '+1 (555) 014-8890',
    address: '2210 Alder Street, Portland, OR',
    freeShipThreshold: freeOver,
    shipping: [
      { id: `${storeId}-s1`, name: 'Standard', fee: 9, eta: '3–5 business days', freeOver, enabled: true },
      { id: `${storeId}-s2`, name: 'Express', fee: 19, eta: '1–2 business days', freeOver: null, enabled: true },
      { id: `${storeId}-s3`, name: 'Store pickup', fee: 0, eta: 'Ready in 2 hours', freeOver: 0, enabled: true },
    ],
    payments: [
      { id: 'card', name: 'Credit / Debit card', description: 'Visa, Mastercard, Amex', enabled: true },
      { id: 'paypal', name: 'PayPal', description: 'Pay with your PayPal balance', enabled: true },
      { id: 'applepay', name: 'Apple Pay', description: 'One-tap checkout on Apple devices', enabled: true },
      { id: 'cod', name: 'Cash on delivery', description: 'Collect payment at the door', enabled: false },
    ],
  };
}

function buildWebsite(storeId: string, opts: { name: string; logo: string; accent: string; soft: string; tagline: string; heroTitle: string; heroSubtitle: string; featured: string[] }): WebsiteSettings {
  return {
    storeName: opts.name,
    logoText: opts.logo,
    tagline: opts.tagline,
    accent: opts.accent,
    announcement: 'Free carbon-neutral shipping on orders over $150 · Code NOVA10 for 10% off',
    heroTitle: opts.heroTitle,
    heroSubtitle: opts.heroSubtitle,
    heroImage: IMG.hero,
    heroCta: 'Shop the collection',
    promoTitle: 'The Winter Edit — up to 20% off',
    promoBody: 'Lighting, audio and carry favourites marked down for the season. Stack code NOVA10 at checkout.',
    promoCode: 'NOVA10',
    showCategories: true,
    showOffers: true,
    showReviews: true,
    showNewsletter: true,
    featuredIds: opts.featured,
    aboutTitle: 'Built slow, made to last',
    aboutBody: 'We started the store in a garage in Portland with one rule: only sell things we would keep for ten years. Every product is tested by our team for at least a season before it earns a shelf. When something breaks, we repair it — for free, forever.',
    footerText: 'Considered objects for the spaces you actually live in.',
    contactEmail: `hello@${opts.logo.toLowerCase().replace(/[^a-z]/g, '')}.store`,
    contactPhone: '+1 (555) 014-8890',
    contactAddress: '2210 Alder Street, Portland, OR 97204',
    instagram: '@' + opts.logo.toLowerCase().replace(/[^a-z]/g, ''),
    twitter: '@' + opts.logo.toLowerCase().replace(/[^a-z]/g, ''),
    facebook: '/' + opts.logo.toLowerCase().replace(/[^a-z]/g, ''),
  };
}

/* ------------------------------------------------------------------ */
/*  Tenant factory — one isolated dataset per store                    */
/* ------------------------------------------------------------------ */

function buildTenant(storeId: string, name: string, seedNum: number, prefix: string, opts: {
  accent: string; soft: string; logo: string; tagline: string; heroTitle: string; heroSubtitle: string;
  currency: StoreSettings['currency']; freeOver: number; orders: number; customers: number; reviews: number; plan: Store['plan'];
}): { categories: Category[]; products: Product[]; customers: Customer[]; orders: Order[]; reviews: Review[]; discounts: Discount[]; notices: Notice[]; settings: StoreSettings; website: WebsiteSettings; store: Store; admin: Admin } {
  const rand = mulberry(seedNum);
  const categories = buildCategories(storeId);
  const products = buildProducts(storeId, rand, prefix);
  const customers = buildCustomers(storeId, rand, opts.customers);
  const orders = buildOrders(storeId, products, customers, rand, opts.orders, prefix);
  const reviews = buildReviews(storeId, products, rand, opts.reviews);
  const discounts = buildDiscounts(storeId);
  const notices = buildNotices(storeId, orders, products, reviews, customers);
  const settings = buildSettings(storeId, name, opts.currency, opts.freeOver);
  const website = buildWebsite(storeId, {
    name, logo: opts.logo, accent: opts.accent, soft: opts.soft, tagline: opts.tagline,
    heroTitle: opts.heroTitle, heroSubtitle: opts.heroSubtitle,
    featured: [`${storeId}-p1`, `${storeId}-p3`, `${storeId}-p7`, `${storeId}-p8`],
  });
  const store: Store = { id: storeId, name, plan: opts.plan, createdAt: iso(140) };
  const admin: Admin = {
    id: `${storeId}-adm1`,
    store_id: storeId,
    name: storeId === 'nova' ? 'Olivia Mercer' : 'Jonas Weber',
    email: storeId === 'nova' ? 'owner@nova.store' : 'owner@aurora.home',
    role: 'Owner',
    notifyOrders: true,
    notifyStock: true,
    notifyReviews: false,
  };
  return { categories, products, customers, orders, reviews, discounts, notices, settings, website, store, admin };
}

export function seedDB(): DB {
  const nova = buildTenant('nova', 'NOVA STORE', 11, 'NV', {
    accent: '#1e6b4e', soft: '#e0ede4', logo: 'NOVA', tagline: 'Objects for modern living',
    heroTitle: 'Objects for modern living',
    heroSubtitle: 'Considered design for the spaces you inhabit — audio, light, furniture and everyday carry, tested for a decade of daily use.',
    currency: 'USD', freeOver: 150, orders: 46, customers: 12, reviews: 14, plan: 'Scale',
  });
  const aurora = buildTenant('aurora', 'AURORA HOME', 47, 'AU', {
    accent: '#2b4bc0', soft: '#e2e8f8', logo: 'AURORA', tagline: 'Quiet things for loud lives',
    heroTitle: 'Quiet things for loud lives',
    heroSubtitle: 'A smaller catalogue, chosen slowly. Home objects that earn their place and keep it.',
    currency: 'EUR', freeOver: 120, orders: 16, customers: 6, reviews: 6, plan: 'Starter',
  });
  return {
    stores: [nova.store, aurora.store],
    categories: [...nova.categories, ...aurora.categories],
    products: [...nova.products, ...aurora.products],
    customers: [...nova.customers, ...aurora.customers],
    orders: [...nova.orders, ...aurora.orders],
    reviews: [...nova.reviews, ...aurora.reviews],
    discounts: [...nova.discounts, ...aurora.discounts],
    notices: [...nova.notices, ...aurora.notices],
    settings: { nova: nova.settings, aurora: aurora.settings },
    website: { nova: nova.website, aurora: aurora.website },
    admins: [nova.admin, aurora.admin],
  };
}

import { useMemo, useState } from 'react';
import { AlertTriangle, Boxes, Copy, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useApp } from '../../lib/store';
import { Card } from './AdminLayout';
import { PImg } from '../../components/bits';
import { Badge, Btn, Confirm, Field, IconBtn, Modal, SearchInput, Tgl } from '../../components/ui';
import { IMG } from '../../lib/data';
import type { Category, Product } from '../../lib/types';
import { cn, slugify, uid } from '../../lib/utils';

/* ---------------- shared image picker ---------------- */

const PRESETS = Object.values(IMG);

function ImgPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {PRESETS.map((src) => (
          <button key={src} type="button" onClick={() => onChange(src)}
            className={cn('aspect-square overflow-hidden rounded-lg border-2 transition-all cursor-pointer', value === src ? 'border-acc ring-2 ring-acc/30' : 'border-line hover:border-line2')}>
            <PImg src={src} alt="preset" />
          </button>
        ))}
      </div>
      <input value={PRESETS.includes(value) ? '' : value} onChange={(e) => onChange(e.target.value)} placeholder="…or paste an image URL" className="inp mt-2 text-[13px]" />
    </div>
  );
}

function StockChip({ p }: { p: Product }) {
  if (p.stock <= 0) return <Badge className="bg-danger-soft text-danger">Out of stock</Badge>;
  if (p.stock <= p.lowStockThreshold) return <Badge className="bg-warn-soft text-warn">Low · {p.stock} left</Badge>;
  return <Badge className="bg-moss-100 text-moss-700">In stock · {p.stock}</Badge>;
}

/* ============================== PRODUCTS ============================== */

interface VRow { id: string; label: string; value: string; priceDelta: string; stock: string; hue?: number; }

const emptyForm = (storeId: string, skuPrefix: string): {
  name: string; sku: string; category_id: string; price: string; sale_price: string; stock: string;
  lowStockThreshold: string; image: string; description: string; tags: string; active: boolean;
  featured: boolean; isNew: boolean; variants: VRow[];
} => ({
  name: '', sku: `${skuPrefix}-NEW-${Math.floor(Math.random() * 90 + 10)}`, category_id: '', price: '', sale_price: '',
  stock: '20', lowStockThreshold: '8', image: PRESETS[2], description: '', tags: '', active: true, featured: false, isNew: true, variants: [],
});

export function ProductsPage() {
  const { products, categories, upsert, del, toast, fmt, storeId } = useApp();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [status, setStatus] = useState('all');
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ReturnType<typeof emptyForm>>(emptyForm(storeId, 'NV'));
  const [confirmDel, setConfirmDel] = useState<Product | null>(null);

  const skuPrefix = storeId === 'nova' ? 'NV' : 'AU';

  const list = useMemo(() => {
    let l = products;
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter((p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || p.tags.some((t) => t.includes(s)));
    }
    if (cat) l = l.filter((p) => p.category_id === cat);
    if (status === 'active') l = l.filter((p) => p.active);
    if (status === 'inactive') l = l.filter((p) => !p.active);
    if (status === 'low') l = l.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold);
    if (status === 'out') l = l.filter((p) => p.stock <= 0);
    return l;
  }, [products, q, cat, status]);

  const openCreate = () => { setForm(emptyForm(storeId, skuPrefix)); setEditing(null); setCreating(true); };
  const openEdit = (p: Product) => {
    setForm({
      name: p.name, sku: p.sku, category_id: p.category_id, price: String(p.price),
      sale_price: p.sale_price != null ? String(p.sale_price) : '', stock: String(p.stock),
      lowStockThreshold: String(p.lowStockThreshold), image: p.image, description: p.description,
      tags: p.tags.join(', '), active: p.active, featured: p.featured, isNew: p.isNew,
      variants: p.variants.map((v) => ({ id: v.id, label: v.label, value: v.value, priceDelta: String(v.priceDelta), stock: String(v.stock), hue: v.hue })),
    });
    setEditing(p); setCreating(true);
  };

  const save = () => {
    const num = (s: string) => Math.max(0, parseFloat(s) || 0);
    if (!form.name.trim()) { toast('Product name is required', 'err'); return; }
    if (num(form.price) <= 0) { toast('Set a price greater than zero', 'err'); return; }
    let slug = slugify(form.name);
    if (products.some((p) => p.slug === slug && p.id !== editing?.id)) slug = `${slug}-${Math.floor(Math.random() * 900 + 100)}`;
    const variants = form.variants
      .filter((v) => v.value.trim())
      .map((v) => ({ id: v.id || uid(), label: v.label.trim() || 'Option', value: v.value.trim(), priceDelta: num(v.priceDelta), stock: Math.round(num(v.stock)), hue: v.hue }));
    const base: Product = {
      id: editing?.id ?? uid(),
      store_id: storeId,
      name: form.name.trim(),
      slug,
      sku: form.sku.trim() || `${skuPrefix}-${uid().slice(0, 5).toUpperCase()}`,
      description: form.description.trim() || 'A new arrival in the catalogue — full story coming soon.',
      image: form.image || PRESETS[0],
      hue: editing?.hue,
      category_id: form.category_id || categories[0]?.id || '',
      price: num(form.price),
      sale_price: form.sale_price.trim() ? num(form.sale_price) : null,
      stock: Math.round(num(form.stock)),
      lowStockThreshold: Math.round(num(form.lowStockThreshold)),
      tags: form.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
      active: form.active,
      featured: form.featured,
      isNew: form.isNew,
      sold: editing?.sold ?? 0,
      rating: editing?.rating ?? 0,
      ratingCount: editing?.ratingCount ?? 0,
      variants,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    };
    upsert('products', base);
    toast(editing ? `${base.name} updated` : `${base.name} added to the store`);
    setCreating(false);
  };

  const duplicate = (p: Product) => {
    const copy: Product = {
      ...p, id: uid(), name: `${p.name} (Copy)`, slug: `${p.slug}-copy-${uid().slice(0, 4)}`,
      sku: `${p.sku}-C`, active: false, sold: 0, rating: 0, ratingCount: 0,
      variants: p.variants.map((v) => ({ ...v, id: uid() })),
      createdAt: new Date().toISOString(),
    };
    upsert('products', copy);
    toast(`Duplicated as “${copy.name}” — inactive until you're ready`);
  };

  const setVariant = (i: number, k: keyof VRow, v: string | number | undefined) =>
    setForm((f) => ({ ...f, variants: f.variants.map((x, xi) => (xi === i ? { ...x, [k]: v } : x)) }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Search name, SKU, tag…" className="w-full sm:w-72" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="inp w-auto cursor-pointer">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.parent_id ? '↳ ' : ''}{c.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="inp w-auto cursor-pointer">
          {[['all', 'Any status'], ['active', 'Active'], ['inactive', 'Inactive'], ['low', 'Low stock'], ['out', 'Out of stock']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div className="ml-auto"><Btn onClick={openCreate}><Plus size={16} /> Add product</Btn></div>
      </div>

      <Card pad={false} title={`Products (${list.length})`} sub="Everything in this store's catalogue">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wider text-ink3">
                {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((h) => <th key={h} className="px-5 py-3 font-extrabold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const c = categories.find((x) => x.id === p.category_id);
                return (
                  <tr key={p.id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-paper/70">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-11 shrink-0 overflow-hidden rounded-lg border border-line"><PImg src={p.image} hue={p.hue} alt={p.name} /></div>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-extrabold">{p.name}
                            {p.featured && <Badge className="bg-lime text-pine-900">Featured</Badge>}
                            {p.isNew && <Badge className="bg-acc-soft text-acc">New</Badge>}
                          </p>
                          <p className="text-[11px] font-bold text-ink3">{p.sku} · {p.variants.length} variant{p.variants.length === 1 ? '' : 's'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-semibold text-ink2">{c?.name ?? '—'}</td>
                    <td className="px-5 py-3">
                      {p.sale_price != null
                        ? <><span className="font-extrabold text-acc">{fmt(p.sale_price)}</span> <span className="text-[11px] text-ink3 line-through">{fmt(p.price)}</span></>
                        : <span className="font-extrabold">{fmt(p.price)}</span>}
                    </td>
                    <td className="px-5 py-3"><StockChip p={p} /></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Tgl on={p.active} label={`Toggle ${p.name}`} onChange={(v) => { upsert('products', { ...p, active: v }); toast(v ? `${p.name} is live in the store` : `${p.name} hidden from the store`, 'info'); }} />
                        <span className={cn('text-[12px] font-bold', p.active ? 'text-moss-700' : 'text-ink3')}>{p.active ? 'Active' : 'Hidden'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-0.5">
                        <IconBtn label="Edit" onClick={() => openEdit(p)}><Pencil size={15} /></IconBtn>
                        <IconBtn label="Duplicate" onClick={() => duplicate(p)}><Copy size={15} /></IconBtn>
                        <IconBtn label="Delete" className="hover:text-danger" onClick={() => setConfirmDel(p)}><Trash2 size={15} /></IconBtn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.length === 0 && (
            <p className="px-5 py-12 text-center text-[13px] font-semibold text-ink3">No products match these filters.</p>
          )}
        </div>
      </Card>

      <Modal open={creating} onClose={() => setCreating(false)} wide title={editing ? `Edit — ${editing.name}` : 'Add product'}
        footer={<><Btn variant="outline" size="sm" onClick={() => setCreating(false)}>Cancel</Btn><Btn size="sm" onClick={save}>{editing ? 'Save changes' : 'Create product'}</Btn></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product name" className="sm:col-span-2"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="inp" placeholder="Aria ANC Headphones" /></Field>
          <Field label="Category">
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="inp cursor-pointer">
              <option value="">Select…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.parent_id ? '↳ ' : ''}{c.name}</option>)}
            </select>
          </Field>
          <Field label="SKU"><input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })} className="inp font-mono" /></Field>
          <Field label="Price"><input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="inp" inputMode="decimal" placeholder="249" /></Field>
          <Field label="Sale price" hint="optional"><input value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} className="inp" inputMode="decimal" placeholder="199" /></Field>
          <Field label="Stock quantity"><input value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="inp" inputMode="numeric" /></Field>
          <Field label="Low-stock alert at"><input value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} className="inp" inputMode="numeric" /></Field>
          <Field label="Image" className="sm:col-span-2"><ImgPicker value={form.image} onChange={(v) => setForm({ ...form, image: v })} /></Field>
          <Field label="Tags" hint="comma separated" className="sm:col-span-2"><input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="inp" placeholder="audio, wireless, bestseller" /></Field>
          <Field label="Description" className="sm:col-span-2"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="inp resize-none" /></Field>
          <div className="flex flex-wrap gap-x-8 gap-y-3 sm:col-span-2">
            {([['Active in store', 'active'], ['Featured on homepage', 'featured'], ['Mark as new arrival', 'isNew']] as const).map(([label, key]) => (
              <div key={key} className="flex items-center gap-2.5">
                <Tgl on={form[key]} onChange={(v) => setForm({ ...form, [key]: v })} label={label} />
                <span className="text-[13px] font-bold text-ink2">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-line bg-paper/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display text-[13px] font-bold">Variants</p>
            <Btn variant="outline" size="xs" onClick={() => setForm({ ...form, variants: [...form.variants, { id: '', label: form.variants[0]?.label ?? 'Colour', value: '', priceDelta: '0', stock: '10' }] })}>
              <Plus size={13} /> Add variant
            </Btn>
          </div>
          {form.variants.length === 0 && <p className="py-2 text-[12px] font-semibold text-ink3">No variants — the product sells as a single option.</p>}
          <div className="space-y-2">
            {form.variants.map((v, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_90px_80px_36px] items-center gap-2">
                <input value={v.label} onChange={(e) => setVariant(i, 'label', e.target.value)} className="inp py-1.5 text-[12.5px]" placeholder="Label" />
                <input value={v.value} onChange={(e) => setVariant(i, 'value', e.target.value)} className="inp py-1.5 text-[12.5px]" placeholder="Value" />
                <input value={v.priceDelta} onChange={(e) => setVariant(i, 'priceDelta', e.target.value)} className="inp py-1.5 text-[12.5px]" placeholder="+$" inputMode="decimal" />
                <input value={v.stock} onChange={(e) => setVariant(i, 'stock', e.target.value)} className="inp py-1.5 text-[12.5px]" placeholder="Stock" inputMode="numeric" />
                <IconBtn label="Remove variant" className="hover:text-danger" onClick={() => setForm({ ...form, variants: form.variants.filter((_, xi) => xi !== i) })}><Trash2 size={14} /></IconBtn>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Confirm open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Delete product"
        body={`“${confirmDel?.name}” will be removed from the store, search and all collections. Past orders keep their line items. This can't be undone.`}
        onConfirm={() => { if (confirmDel) { del('products', confirmDel.id); toast(`${confirmDel.name} deleted`, 'info'); } }} />
    </div>
  );
}

/* ============================= CATEGORIES ============================= */

export function CategoriesPage() {
  const { categories, products, upsert, del, toast, storeId } = useApp();
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', parent_id: '', image: PRESETS[0], active: true });
  const [confirmDel, setConfirmDel] = useState<Category | null>(null);

  const countFor = (c: Category) => products.filter((p) => p.category_id === c.id).length;
  const tops = categories.filter((c) => !c.parent_id);

  const openCreate = () => { setForm({ name: '', description: '', parent_id: '', image: PRESETS[0], active: true }); setEditing(null); setOpen(true); };
  const openEdit = (c: Category) => { setForm({ name: c.name, description: c.description, parent_id: c.parent_id ?? '', image: c.image, active: c.active }); setEditing(c); setOpen(true); };

  const save = () => {
    if (!form.name.trim()) { toast('Category name is required', 'err'); return; }
    const base: Category = {
      id: editing?.id ?? uid(), store_id: storeId, name: form.name.trim(),
      slug: editing?.slug ?? slugify(form.name), description: form.description.trim(),
      image: form.image, parent_id: form.parent_id || null, active: form.active,
    };
    upsert('categories', base);
    toast(editing ? 'Category updated' : `Category “${base.name}” created`);
    setOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-ink2">{categories.length} categories · {tops.length} top-level</p>
        <Btn onClick={openCreate}><Plus size={16} /> New category</Btn>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((c) => {
          const parent = categories.find((x) => x.id === c.parent_id);
          const count = countFor(c);
          return (
            <div key={c.id} className={cn('overflow-hidden rounded-xl border border-line bg-card transition-shadow hover:shadow-md', !c.active && 'opacity-60')}>
              <div className="flex">
                <div className="w-28 shrink-0"><PImg src={c.image} alt={c.name} /></div>
                <div className="flex min-w-0 flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display text-[14px] font-bold">{parent && <span className="mr-1 text-ink3">↳</span>}{c.name}</p>
                      <p className="text-[11px] font-bold text-ink3">/{c.slug} · {count} product{count === 1 ? '' : 's'}</p>
                    </div>
                    <Tgl on={c.active} label={`Toggle ${c.name}`} onChange={(v) => { upsert('categories', { ...c, active: v }); toast(v ? `${c.name} visible in store` : `${c.name} hidden from store`, 'info'); }} />
                  </div>
                  <p className="mt-1.5 line-clamp-2 flex-1 text-[12px] font-medium leading-relaxed text-ink2">{c.description}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <IconBtn label="Edit" onClick={() => openEdit(c)}><Pencil size={14} /></IconBtn>
                    <IconBtn label="Delete" className="hover:text-danger" onClick={() => setConfirmDel(c)}><Trash2 size={14} /></IconBtn>
                    <span className={cn('ml-auto text-[11px] font-extrabold uppercase tracking-wider', c.active ? 'text-moss-700' : 'text-ink3')}>{c.active ? 'Live' : 'Hidden'}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit — ${editing.name}` : 'New category'}
        footer={<><Btn variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Btn><Btn size="sm" onClick={save}>{editing ? 'Save changes' : 'Create category'}</Btn></>}>
        <div className="space-y-4">
          <Field label="Name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="inp" placeholder="Lighting" /></Field>
          <Field label="Parent category" hint="blank = top-level">
            <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} className="inp cursor-pointer">
              <option value="">None</option>
              {tops.filter((t) => t.id !== editing?.id).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="Description"><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="inp resize-none" /></Field>
          <Field label="Image"><ImgPicker value={form.image} onChange={(v) => setForm({ ...form, image: v })} /></Field>
          <div className="flex items-center gap-2.5">
            <Tgl on={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Active" />
            <span className="text-[13px] font-bold text-ink2">Visible in the public store</span>
          </div>
        </div>
      </Modal>

      <Confirm open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Delete category"
        body={`Delete “${confirmDel?.name}”? ${confirmDel ? countFor(confirmDel) : 0} product(s) currently use it — they'll show as uncategorized. Subcategories become top-level.`}
        onConfirm={() => {
          if (!confirmDel) return;
          del('categories', confirmDel.id);
          // children move up one level
          const kids = categories.filter((c) => c.parent_id === confirmDel.id);
          kids.forEach((k) => upsert('categories', { ...k, parent_id: confirmDel.parent_id }));
          toast(`${confirmDel.name} deleted`, 'info');
        }} />
    </div>
  );
}

/* ============================== INVENTORY ============================== */

export function InventoryPage() {
  const { products, patch, toast, storeId } = useApp();
  const [filter, setFilter] = useState<'all' | 'low' | 'out' | 'ok'>('all');

  const active = products.filter((p) => p.active);
  const low = active.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold);
  const out = active.filter((p) => p.stock <= 0);
  const list = filter === 'low' ? low : filter === 'out' ? out : filter === 'ok' ? active.filter((p) => p.stock > p.lowStockThreshold) : active;

  const setStock = (p: Product, next: number) => {
    const stock = Math.max(0, next);
    const delta = stock - p.stock;
    patch((d) => ({
      ...d,
      products: d.products.map((x) => x.id === p.id
        ? { ...x, stock, variants: x.variants.map((v) => ({ ...v, stock: Math.max(0, v.stock + delta) })) }
        : x),
    }));
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <button onClick={() => setFilter('all')} className={cn('rounded-xl border p-4 text-left transition-all cursor-pointer', filter === 'all' ? 'border-acc bg-acc-soft' : 'border-line bg-card hover:border-line2')}>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink3">Tracked products</p>
          <p className="mt-1 font-display text-2xl font-bold">{active.length}</p>
        </button>
        <button onClick={() => setFilter('low')} className={cn('rounded-xl border p-4 text-left transition-all cursor-pointer', filter === 'low' ? 'border-warn bg-warn-soft' : 'border-line bg-card hover:border-line2')}>
          <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-warn"><AlertTriangle size={12} /> Low stock</p>
          <p className="mt-1 font-display text-2xl font-bold">{low.length}</p>
        </button>
        <button onClick={() => setFilter('out')} className={cn('rounded-xl border p-4 text-left transition-all cursor-pointer', filter === 'out' ? 'border-danger bg-danger-soft' : 'border-line bg-card hover:border-line2')}>
          <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-danger"><Boxes size={12} /> Out of stock</p>
          <p className="mt-1 font-display text-2xl font-bold">{out.length}</p>
        </button>
      </div>

      <Card pad={false} title={`Inventory — ${list.length} products`} sub="Adjust stock levels; variant stock moves in step">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wider text-ink3">
                {['Product', 'SKU', 'Current stock', 'Low-stock threshold', 'Status', ''].map((h, i) => <th key={i} className="px-5 py-3 font-extrabold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-paper/70">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 shrink-0 overflow-hidden rounded-lg border border-line"><PImg src={p.image} hue={p.hue} alt={p.name} /></div>
                      <p className="font-extrabold">{p.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-[12px] font-bold text-ink2">{p.sku}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setStock(p, p.stock - 1)} className="flex size-7 items-center justify-center rounded-md border border-line2 font-bold text-ink2 hover:border-acc hover:text-acc cursor-pointer">−</button>
                      <input
                        value={p.stock}
                        onChange={(e) => setStock(p, parseInt(e.target.value, 10) || 0)}
                        className="inp w-16 py-1 text-center text-[13px] font-extrabold"
                        inputMode="numeric"
                      />
                      <button onClick={() => setStock(p, p.stock + 1)} className="flex size-7 items-center justify-center rounded-md border border-line2 font-bold text-ink2 hover:border-acc hover:text-acc cursor-pointer">+</button>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <input
                      value={p.lowStockThreshold}
                      onChange={(e) => patch((d) => ({ ...d, products: d.products.map((x) => (x.id === p.id ? { ...x, lowStockThreshold: Math.max(0, parseInt(e.target.value, 10) || 0) } : x)) }))}
                      className="inp w-16 py-1 text-center text-[13px] font-bold"
                      inputMode="numeric"
                    />
                  </td>
                  <td className="px-5 py-3"><StockChip p={p} /></td>
                  <td className="px-5 py-3 text-right">
                    <Btn variant="outline" size="xs" onClick={() => { setStock(p, p.stock + 25); toast(`Restocked ${p.name} +25 units`); }}>
                      <RotateCcw size={12} /> Restock +25
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <p className="px-5 py-12 text-center text-[13px] font-semibold text-ink3">No products in this state. Inventory is healthy.</p>}
        </div>
      </Card>
    </div>
  );
}

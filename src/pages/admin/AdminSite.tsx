import { useMemo, useState } from 'react';
import { Bell, Boxes, CheckCheck, CreditCard, Lock, MessageSquare, Palette, Plus, RotateCcw, Save, ShoppingBag, Trash2, Users } from 'lucide-react';
import { useApp } from '../../lib/store';
import { Card } from './AdminLayout';
import { PImg } from '../../components/bits';
import { Badge, Btn, Confirm, Field, IconBtn, Modal, Tabs, Tgl } from '../../components/ui';
import { ACCENTS, HERO_IMAGES } from '../../lib/data';
import type { Discount, Notice, StoreSettings, WebsiteSettings } from '../../lib/types';
import { cn, fmtDate, timeAgo, uid } from '../../lib/utils';

/* ============================== DISCOUNTS ============================== */

const emptyDiscount = (storeId: string): Discount => ({
  id: uid(), store_id: storeId, code: '', type: 'percent', value: 10, active: true,
  startDate: new Date().toISOString(), endDate: new Date(Date.now() + 60 * 86400000).toISOString(),
  minOrder: 0, usageLimit: 100, used: 0, scope: 'all', scopeIds: [],
});

export function DiscountsPage() {
  const { discounts, upsert, del, toast, fmt, storeId, products, categories } = useApp();
  const [editing, setEditing] = useState<Discount | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Discount>(emptyDiscount(storeId));
  const [confirmDel, setConfirmDel] = useState<Discount | null>(null);

  const openCreate = () => { setForm(emptyDiscount(storeId)); setEditing(null); setCreating(true); };
  const openEdit = (d: Discount) => { setForm({ ...d }); setEditing(d); setCreating(true); };

  const save = () => {
    if (!form.code.trim()) { toast('Coupon code is required', 'err'); return; }
    if (discounts.some((d) => d.code.toLowerCase() === form.code.trim().toLowerCase() && d.id !== editing?.id)) { toast('That code already exists', 'err'); return; }
    if (form.type !== 'shipping' && form.value <= 0) { toast('Set a discount value', 'err'); return; }
    upsert('discounts', { ...form, code: form.code.trim().toUpperCase() });
    toast(editing ? 'Discount updated' : `Coupon ${form.code.toUpperCase()} is live`);
    setCreating(false);
  };

  const scopeLabel = (d: Discount) => {
    if (d.scope === 'all') return 'Store-wide';
    if (d.scope === 'category') return `${d.scopeIds.length} categories`;
    return `${d.scopeIds.length} products`;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-ink2">Codes apply automatically at checkout when valid.</p>
        <Btn onClick={openCreate}><Plus size={16} /> New discount</Btn>
      </div>

      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wider text-ink3">
                {['Code', 'Type', 'Valid', 'Min order', 'Usage', 'Applies to', 'Status', ''].map((h, i) => <th key={i} className="px-5 py-3 font-extrabold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {discounts.map((d) => (
                <tr key={d.id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-paper/70">
                  <td className="px-5 py-3.5"><span className="rounded-md border border-dashed border-acc bg-acc-soft px-2.5 py-1 font-mono text-[12.5px] font-extrabold text-acc">{d.code}</span></td>
                  <td className="px-5 py-3.5 font-extrabold">
                    {d.type === 'percent' ? `${d.value}% off` : d.type === 'fixed' ? `${fmt(d.value)} off` : 'Free shipping'}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-ink2">{fmtDate(d.startDate)} → {fmtDate(d.endDate)}</td>
                  <td className="px-5 py-3.5 font-semibold text-ink2">{d.minOrder > 0 ? fmt(d.minOrder) : '—'}</td>
                  <td className="px-5 py-3.5">
                    <div className="w-28">
                      <p className="text-[11px] font-extrabold">{d.used} / {d.usageLimit}</p>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                        <div className={cn('h-full rounded-full', d.used / d.usageLimit > 0.8 ? 'bg-warn' : 'bg-moss-600')} style={{ width: `${Math.min(100, (d.used / d.usageLimit) * 100)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-ink2">{scopeLabel(d)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Tgl on={d.active} label={`Toggle ${d.code}`} onChange={(v) => { upsert('discounts', { ...d, active: v }); toast(v ? `${d.code} activated` : `${d.code} paused`, 'info'); }} />
                      <span className={cn('text-[12px] font-bold', d.active ? 'text-moss-700' : 'text-ink3')}>{d.active ? 'Live' : 'Paused'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-0.5">
                      <IconBtn label="Edit" onClick={() => openEdit(d)} className="text-ink2"><RotateCcw size={14} className="hidden" /><span className="text-[12px] font-extrabold uppercase">Edit</span></IconBtn>
                      <IconBtn label="Delete" className="hover:text-danger" onClick={() => setConfirmDel(d)}><Trash2 size={14} /></IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {discounts.length === 0 && <p className="px-5 py-14 text-center text-[13px] font-semibold text-ink3">No discounts yet. Create your first coupon.</p>}
        </div>
      </Card>

      <Modal open={creating} onClose={() => setCreating(false)} wide title={editing ? `Edit — ${editing.code}` : 'New discount'}
        footer={<><Btn variant="outline" size="sm" onClick={() => setCreating(false)}>Cancel</Btn><Btn size="sm" onClick={save}>{editing ? 'Save changes' : 'Create discount'}</Btn></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Coupon code"><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="inp font-mono font-extrabold" placeholder="SUMMER20" /></Field>
          <Field label="Type">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Discount['type'] })} className="inp cursor-pointer">
              <option value="percent">Percentage off</option>
              <option value="fixed">Fixed amount off</option>
              <option value="shipping">Free shipping</option>
            </select>
          </Field>
          {form.type !== 'shipping' && (
            <Field label={form.type === 'percent' ? 'Percent off' : 'Amount off'}><input value={String(form.value)} onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} className="inp" inputMode="decimal" /></Field>
          )}
          <Field label="Minimum order"><input value={String(form.minOrder)} onChange={(e) => setForm({ ...form, minOrder: parseFloat(e.target.value) || 0 })} className="inp" inputMode="decimal" /></Field>
          <Field label="Starts"><input type="date" value={form.startDate.slice(0, 10)} onChange={(e) => setForm({ ...form, startDate: new Date(e.target.value).toISOString() })} className="inp" /></Field>
          <Field label="Ends"><input type="date" value={form.endDate.slice(0, 10)} onChange={(e) => setForm({ ...form, endDate: new Date(e.target.value).toISOString() })} className="inp" /></Field>
          <Field label="Usage limit"><input value={String(form.usageLimit)} onChange={(e) => setForm({ ...form, usageLimit: parseInt(e.target.value, 10) || 1 })} className="inp" inputMode="numeric" /></Field>
          <Field label="Restrict to">
            <select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value as Discount['scope'], scopeIds: [] })} className="inp cursor-pointer">
              <option value="all">Entire store</option>
              <option value="category">Specific categories</option>
              <option value="product">Specific products</option>
            </select>
          </Field>
          {form.scope !== 'all' && (
            <div className="sm:col-span-2">
              <p className="mb-2 text-[12px] font-bold">Pick {form.scope === 'category' ? 'categories' : 'products'}</p>
              <div className="grid max-h-44 grid-cols-2 gap-1.5 overflow-y-auto rounded-lg border border-line bg-paper/50 p-3 sm:grid-cols-3">
                {(form.scope === 'category' ? categories : products).map((e) => {
                  const on = form.scopeIds.includes(e.id);
                  return (
                    <button key={e.id} type="button" onClick={() => setForm({ ...form, scopeIds: on ? form.scopeIds.filter((x) => x !== e.id) : [...form.scopeIds, e.id] })}
                      className={cn('rounded-lg border px-2.5 py-1.5 text-left text-[12px] font-bold transition-colors cursor-pointer', on ? 'border-acc bg-acc-soft text-acc' : 'border-line bg-card text-ink2 hover:border-line2')}>
                      {e.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2.5 sm:col-span-2">
            <Tgl on={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Active" />
            <span className="text-[13px] font-bold text-ink2">Active immediately</span>
          </div>
        </div>
      </Modal>

      <Confirm open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Delete discount"
        body={`Delete coupon ${confirmDel?.code}? Customers will no longer be able to redeem it.`}
        onConfirm={() => { if (confirmDel) { del('discounts', confirmDel.id); toast(`${confirmDel.code} deleted`, 'info'); } }} />
    </div>
  );
}

/* ============================== WEBSITE CMS ============================== */

function WebsiteInner() {
  const { website, products, patch, toast, storeId } = useApp();
  const [draft, setDraft] = useState<WebsiteSettings>({ ...website });
  const set = <K extends keyof WebsiteSettings>(k: K, v: WebsiteSettings[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const save = () => {
    patch((d) => ({ ...d, website: { ...d.website, [storeId]: draft } }));
    toast('Website settings published — live on the storefront now');
  };

  const toggleFeature = (k: 'showCategories' | 'showOffers' | 'showReviews' | 'showNewsletter', label: string) => (
    <div className="flex items-center justify-between rounded-lg border border-line bg-card px-4 py-3">
      <span className="text-[13px] font-bold text-ink2">{label}</span>
      <Tgl on={draft[k]} onChange={(v) => set(k, v)} label={label} />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-acc/30 bg-acc-soft px-5 py-4">
        <Palette size={18} className="text-acc" />
        <p className="flex-1 text-[13px] font-bold text-acc">Edits here publish straight to the public storefront for this tenant — hero copy, theme colour, sections, contact details, everything.</p>
        <Btn variant="outline" size="sm" onClick={() => { setDraft({ ...website }); toast('Draft reverted to published version', 'info'); }}>Revert</Btn>
        <Btn size="sm" onClick={save}><Save size={14} /> Publish changes</Btn>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Brand & identity" sub="Name, logo mark, accent colour">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Store name"><input value={draft.storeName} onChange={(e) => set('storeName', e.target.value)} className="inp" /></Field>
              <Field label="Logo text"><input value={draft.logoText} onChange={(e) => set('logoText', e.target.value)} className="inp" /></Field>
            </div>
            <Field label="Tagline"><input value={draft.tagline} onChange={(e) => set('tagline', e.target.value)} className="inp" /></Field>
            <div>
              <p className="mb-2 text-[12px] font-bold">Accent colour — themes buttons, links & badges store-wide</p>
              <div className="flex gap-2.5">
                {ACCENTS.map((a) => (
                  <button key={a.value} type="button" onClick={() => set('accent', a.value)} title={a.name}
                    className={cn('size-10 rounded-lg border-2 transition-transform hover:scale-105 cursor-pointer', draft.accent === a.value ? 'border-ink ring-2 ring-ink/20' : 'border-line')}
                    style={{ background: a.value }} />
                ))}
              </div>
            </div>
            <Field label="Announcement bar"><input value={draft.announcement} onChange={(e) => set('announcement', e.target.value)} className="inp" /></Field>
          </div>
        </Card>

        <Card title="Hero section" sub="First thing every visitor sees">
          <div className="space-y-4">
            <Field label="Hero title"><input value={draft.heroTitle} onChange={(e) => set('heroTitle', e.target.value)} className="inp" /></Field>
            <Field label="Hero subtitle"><textarea value={draft.heroSubtitle} onChange={(e) => set('heroSubtitle', e.target.value)} rows={3} className="inp resize-none" /></Field>
            <Field label="Primary button label"><input value={draft.heroCta} onChange={(e) => set('heroCta', e.target.value)} className="inp" /></Field>
            <div>
              <p className="mb-2 text-[12px] font-bold">Hero image</p>
              <div className="grid grid-cols-4 gap-2">
                {HERO_IMAGES.map((h) => (
                  <button key={h.value} type="button" onClick={() => set('heroImage', h.value)}
                    className={cn('aspect-[4/3] overflow-hidden rounded-lg border-2 transition-all cursor-pointer', draft.heroImage === h.value ? 'border-acc ring-2 ring-acc/30' : 'border-line hover:border-line2')}>
                    <PImg src={h.value} alt={h.name} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Promotional banner" sub="The big mid-page offer block">
          <div className="space-y-4">
            <Field label="Promo title"><input value={draft.promoTitle} onChange={(e) => set('promoTitle', e.target.value)} className="inp" /></Field>
            <Field label="Promo body"><textarea value={draft.promoBody} onChange={(e) => set('promoBody', e.target.value)} rows={2} className="inp resize-none" /></Field>
            <Field label="Coupon code shown"><input value={draft.promoCode} onChange={(e) => set('promoCode', e.target.value.toUpperCase())} className="inp font-mono font-extrabold" /></Field>
          </div>
        </Card>

        <Card title="Homepage sections" sub="Toggle what appears & pick featured products">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {toggleFeature('showCategories', 'Category showcase')}
            {toggleFeature('showOffers', 'Special offers & promo banner')}
            {toggleFeature('showReviews', 'Customer reviews')}
            {toggleFeature('showNewsletter', 'Newsletter block')}
          </div>
          <p className="mb-2 mt-5 text-[12px] font-bold">Featured products <span className="font-semibold text-ink3">({draft.featuredIds.length} selected — aim for 4)</span></p>
          <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-line bg-paper/50 p-3 sm:grid-cols-3">
            {products.map((p) => {
              const on = draft.featuredIds.includes(p.id);
              return (
                <button key={p.id} type="button"
                  onClick={() => set('featuredIds', on ? draft.featuredIds.filter((x) => x !== p.id) : [...draft.featuredIds, p.id])}
                  className={cn('flex items-center gap-2 rounded-lg border p-1.5 text-left transition-colors cursor-pointer', on ? 'border-acc bg-acc-soft' : 'border-line bg-card hover:border-line2')}>
                  <div className="size-9 shrink-0 overflow-hidden rounded-md"><PImg src={p.image} hue={p.hue} alt={p.name} /></div>
                  <span className={cn('truncate text-[11.5px] font-extrabold', on ? 'text-acc' : 'text-ink2')}>{p.name}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card title="About & footer" sub="Story copy and footer line">
          <div className="space-y-4">
            <Field label="About title"><input value={draft.aboutTitle} onChange={(e) => set('aboutTitle', e.target.value)} className="inp" /></Field>
            <Field label="About body"><textarea value={draft.aboutBody} onChange={(e) => set('aboutBody', e.target.value)} rows={4} className="inp resize-none" /></Field>
            <Field label="Footer tagline"><input value={draft.footerText} onChange={(e) => set('footerText', e.target.value)} className="inp" /></Field>
          </div>
        </Card>

        <Card title="Contact & social" sub="Used on the contact page and footer">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email"><input value={draft.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} className="inp" /></Field>
              <Field label="Phone"><input value={draft.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} className="inp" /></Field>
            </div>
            <Field label="Address"><input value={draft.contactAddress} onChange={(e) => set('contactAddress', e.target.value)} className="inp" /></Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Instagram"><input value={draft.instagram} onChange={(e) => set('instagram', e.target.value)} className="inp" /></Field>
              <Field label="Twitter / X"><input value={draft.twitter} onChange={(e) => set('twitter', e.target.value)} className="inp" /></Field>
              <Field label="Facebook"><input value={draft.facebook} onChange={(e) => set('facebook', e.target.value)} className="inp" /></Field>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function WebsitePage() {
  const { storeId } = useApp();
  return <WebsiteInner key={storeId} />;
}

/* ============================ NOTIFICATIONS ============================ */

const NOTICE_META: Record<Notice['type'], { icon: typeof Bell; cls: string }> = {
  order: { icon: ShoppingBag, cls: 'bg-acc-soft text-acc' },
  stock: { icon: Boxes, cls: 'bg-warn-soft text-warn' },
  customer: { icon: Users, cls: 'bg-cobalt-soft text-cobalt' },
  review: { icon: MessageSquare, cls: 'bg-moss-100 text-moss-700' },
  payment: { icon: CreditCard, cls: 'bg-lime text-pine-900' },
};

export function NotificationsPage() {
  const { notices, markRead, markAllRead, unread } = useApp();
  const [filter, setFilter] = useState<'all' | Notice['type']>('all');
  const list = filter === 'all' ? notices : notices.filter((n) => n.type === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {(['all', 'order', 'stock', 'customer', 'review', 'payment'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn('whitespace-nowrap rounded-lg border px-3.5 py-2 text-[12.5px] font-extrabold capitalize transition-colors cursor-pointer', filter === f ? 'border-pine-900 bg-pine-900 text-paper' : 'border-line2 bg-card text-ink2 hover:text-ink')}>
              {f === 'all' ? `All (${notices.length})` : f}
            </button>
          ))}
        </div>
        <Btn variant="outline" size="sm" className="ml-auto" onClick={markAllRead} disabled={unread === 0}><CheckCheck size={14} /> Mark all read ({unread})</Btn>
      </div>

      <Card pad={false}>
        {list.length === 0 ? (
          <p className="px-5 py-16 text-center text-[13px] font-semibold text-ink3">No {filter === 'all' ? '' : filter + ' '}notifications. Quiet is good.</p>
        ) : (
          <div className="divide-y divide-line">
            {list.map((n) => {
              const M = NOTICE_META[n.type];
              return (
                <button key={n.id} onClick={() => markRead(n.id)} className={cn('flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-paper/70 cursor-pointer', !n.read && 'bg-moss-50')}>
                  <span className={cn('mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg', M.cls)}><M.icon size={17} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-[13.5px] font-extrabold">
                      {!n.read && <span className="size-2 shrink-0 rounded-full bg-acc" />}
                      {n.title}
                    </span>
                    <span className="mt-0.5 block text-[13px] font-medium leading-relaxed text-ink2">{n.body}</span>
                    <span className="mt-1 block text-[10.5px] font-extrabold uppercase tracking-wider text-ink3">{n.type} · {timeAgo(n.date)}</span>
                  </span>
                  {!n.read && <Badge className="shrink-0 bg-acc text-acc-ink">NEW</Badge>}
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

/* =============================== SETTINGS =============================== */

function SettingsInner() {
  const { settings, admin, patch, upsert, toast, storeId, resetDemo } = useApp();
  const [tab, setTab] = useState('store');
  const [draft, setDraft] = useState<StoreSettings>({ ...settings, shipping: settings.shipping.map((s) => ({ ...s })), payments: settings.payments.map((p) => ({ ...p })) });
  const [admDraft, setAdmDraft] = useState({ name: admin.name, email: admin.email, current: '', next: '', confirm: '' });
  const [confirmReset, setConfirmReset] = useState(false);

  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const saveStore = () => {
    patch((d) => ({ ...d, settings: { ...d.settings, [storeId]: draft } }));
    toast('Store settings saved');
  };

  const saveAdmin = () => {
    if (!admDraft.name.trim() || !admDraft.email.includes('@')) { toast('Name and valid email required', 'err'); return; }
    if (admDraft.next) {
      if (admDraft.current !== 'demo1234' && admDraft.current !== admin.email) { toast('Current password is incorrect (hint: demo1234)', 'err'); return; }
      if (admDraft.next.length < 6) { toast('New password must be at least 6 characters', 'err'); return; }
      if (admDraft.next !== admDraft.confirm) { toast('New passwords do not match', 'err'); return; }
    }
    upsert('admins', { ...admin, name: admDraft.name.trim(), email: admDraft.email.trim() });
    setAdmDraft((a) => ({ ...a, current: '', next: '', confirm: '' }));
    toast('Admin profile updated');
  };

  return (
    <div className="space-y-5">
      <Tabs active={tab} onChange={setTab} tabs={[
        { id: 'store', label: 'Store' },
        { id: 'shipping', label: 'Shipping' },
        { id: 'payments', label: 'Payments' },
        { id: 'admin', label: 'Admin' },
      ]} />

      {tab === 'store' && (
        <Card title="Store settings" sub="Identity, currency and contact details" action={<Btn size="sm" onClick={saveStore}><Save size={14} /> Save</Btn>}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Store name"><input value={draft.storeName} onChange={(e) => set('storeName', e.target.value)} className="inp" /></Field>
            <Field label="Currency">
              <select value={draft.currency} onChange={(e) => set('currency', e.target.value as StoreSettings['currency'])} className="inp cursor-pointer">
                <option value="USD">USD — US Dollar</option><option value="EUR">EUR — Euro</option><option value="GBP">GBP — British Pound</option>
              </select>
            </Field>
            <Field label="Support email"><input value={draft.email} onChange={(e) => set('email', e.target.value)} className="inp" /></Field>
            <Field label="Support phone"><input value={draft.phone} onChange={(e) => set('phone', e.target.value)} className="inp" /></Field>
            <Field label="Business address" className="sm:col-span-2"><input value={draft.address} onChange={(e) => set('address', e.target.value)} className="inp" /></Field>
          </div>
        </Card>
      )}

      {tab === 'shipping' && (
        <Card title="Shipping methods" sub="Fees shown at checkout · free-over thresholds per method"
          action={<div className="flex gap-2"><Btn variant="outline" size="sm" onClick={() => set('shipping', [...draft.shipping, { id: uid(), name: 'New method', fee: 5, eta: '2–4 days', freeOver: null, enabled: true }])}><Plus size={14} /> Add method</Btn><Btn size="sm" onClick={saveStore}><Save size={14} /> Save</Btn></div>}>
          <div className="space-y-3">
            {draft.shipping.map((s, i) => (
              <div key={s.id} className="grid grid-cols-2 items-end gap-3 rounded-xl border border-line bg-paper/50 p-4 sm:grid-cols-[1.3fr_100px_140px_1fr_auto_auto]">
                <Field label="Name"><input value={s.name} onChange={(e) => set('shipping', draft.shipping.map((x, xi) => (xi === i ? { ...x, name: e.target.value } : x)))} className="inp" /></Field>
                <Field label="Fee"><input value={String(s.fee)} onChange={(e) => set('shipping', draft.shipping.map((x, xi) => (xi === i ? { ...x, fee: parseFloat(e.target.value) || 0 } : x)))} className="inp" inputMode="decimal" /></Field>
                <Field label="Free over" hint="blank = never">
                  <input value={s.freeOver ?? ''} onChange={(e) => set('shipping', draft.shipping.map((x, xi) => (xi === i ? { ...x, freeOver: e.target.value === '' ? null : parseFloat(e.target.value) || 0 } : x)))} className="inp" inputMode="decimal" placeholder="—" />
                </Field>
                <Field label="ETA label"><input value={s.eta} onChange={(e) => set('shipping', draft.shipping.map((x, xi) => (xi === i ? { ...x, eta: e.target.value } : x)))} className="inp" /></Field>
                <div className="flex items-center gap-2 pb-1.5"><Tgl on={s.enabled} onChange={(v) => set('shipping', draft.shipping.map((x, xi) => (xi === i ? { ...x, enabled: v } : x)))} label={`Toggle ${s.name}`} /></div>
                <IconBtn label="Remove method" className="mb-1 hover:text-danger" onClick={() => set('shipping', draft.shipping.filter((_, xi) => xi !== i))}><Trash2 size={15} /></IconBtn>
              </div>
            ))}
            <p className="text-[12px] font-semibold text-ink3">Storewide free-shipping banner threshold follows the Standard method.</p>
          </div>
        </Card>
      )}

      {tab === 'payments' && (
        <Card title="Payment methods" sub="Provider-agnostic structure — connect Stripe, PayPal or any gateway later" action={<Btn size="sm" onClick={saveStore}><Save size={14} /> Save</Btn>}>
          <div className="grid gap-3 sm:grid-cols-2">
            {draft.payments.map((p, i) => (
              <div key={p.id} className={cn('rounded-xl border p-4 transition-colors', p.enabled ? 'border-acc/40 bg-acc-soft/40' : 'border-line bg-paper/50')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={cn('flex size-9 items-center justify-center rounded-lg', p.enabled ? 'bg-acc text-acc-ink' : 'bg-line text-ink3')}><CreditCard size={16} /></span>
                    <div>
                      <p className="text-[13.5px] font-extrabold">{p.name}</p>
                      <p className="text-[11px] font-semibold text-ink3">{p.description}</p>
                    </div>
                  </div>
                  <Tgl on={p.enabled} onChange={(v) => set('payments', draft.payments.map((x, xi) => (xi === i ? { ...x, enabled: v } : x)))} label={`Toggle ${p.name}`} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-lg bg-warn-soft px-4 py-3 text-[12px] font-bold text-warn">Demo checkout simulates payments. Wire a real provider by implementing the payment adapter in src/lib — no UI changes needed.</p>
        </Card>
      )}

      {tab === 'admin' && (
        <div className="grid gap-5 xl:grid-cols-2">
          <Card title="Admin profile" sub="Owner account for this store" action={<Btn size="sm" onClick={saveAdmin}><Save size={14} /> Save</Btn>}>
            <div className="space-y-4">
              <Field label="Name"><input value={admDraft.name} onChange={(e) => setAdmDraft({ ...admDraft, name: e.target.value })} className="inp" /></Field>
              <Field label="Email"><input value={admDraft.email} onChange={(e) => setAdmDraft({ ...admDraft, email: e.target.value })} className="inp" /></Field>
              <div className="border-t border-line pt-4">
                <p className="mb-3 flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wider text-ink3"><Lock size={12} /> Change password</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Current"><input type="password" value={admDraft.current} onChange={(e) => setAdmDraft({ ...admDraft, current: e.target.value })} className="inp" placeholder="demo1234" /></Field>
                  <Field label="New"><input type="password" value={admDraft.next} onChange={(e) => setAdmDraft({ ...admDraft, next: e.target.value })} className="inp" /></Field>
                  <Field label="Confirm"><input type="password" value={admDraft.confirm} onChange={(e) => setAdmDraft({ ...admDraft, confirm: e.target.value })} className="inp" /></Field>
                </div>
              </div>
            </div>
          </Card>
          <div className="space-y-5">
            <Card title="Notification preferences" sub="What lands in your notification center">
              <div className="space-y-3">
                {([['notifyOrders', 'New orders'], ['notifyStock', 'Low stock alerts'], ['notifyReviews', 'New reviews']] as const).map(([k, label]) => (
                  <div key={k} className="flex items-center justify-between rounded-lg border border-line bg-paper/50 px-4 py-3">
                    <span className="text-[13px] font-bold text-ink2">{label}</span>
                    <Tgl on={admin[k]} onChange={(v) => { upsert('admins', { ...admin, [k]: v }); toast(`${label} ${v ? 'enabled' : 'muted'}`, 'info'); }} label={label} />
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Demo data" sub="Restore the original seed for every tenant">
              <p className="text-[13px] font-semibold leading-relaxed text-ink2">Products, orders, customers, reviews and settings return to their initial state. The storefront keeps working throughout.</p>
              <Btn variant="danger" size="sm" className="mt-4" onClick={() => setConfirmReset(true)}><RotateCcw size={14} /> Reset demo data</Btn>
            </Card>
          </div>
        </div>
      )}

      <Confirm open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset demo data" confirmLabel="Reset everything"
        body="All changes across every store tenant will be discarded and the original demo dataset restored. This can't be undone."
        onConfirm={resetDemo} />
    </div>
  );
}

export function SettingsPage() {
  const { storeId } = useApp();
  return <SettingsInner key={storeId} />;
}

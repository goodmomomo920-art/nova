import { useMemo, useState } from 'react';
import { Check, EyeOff, MapPin, Pencil, Phone, Trash2, UserCheck, UserX } from 'lucide-react';
import { useApp } from '../../lib/store';
import { Card } from './AdminLayout';
import { PImg, Stars } from '../../components/bits';
import { Badge, Btn, Confirm, Drawer, Empty, Field, Modal, SearchInput, StatusBadge } from '../../components/ui';
import type { Customer, Review } from '../../lib/types';
import { cn, fmtDate, timeAgo } from '../../lib/utils';

/* ============================== CUSTOMERS ============================== */

export function CustomersPage() {
  const { customers, orders, upsert, toast, fmt } = useApp();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [confirmOff, setConfirmOff] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  const spendOf = (c: Customer) => orders.filter((o) => o.customer_id === c.id && o.status !== 'cancelled').reduce((a, o) => a + o.total, 0);
  const ordersOf = (c: Customer) => orders.filter((o) => o.customer_id === c.id || o.email.toLowerCase() === c.email.toLowerCase());

  const list = useMemo(() => {
    let l = [...customers].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (filter === 'active') l = l.filter((c) => c.active);
    if (filter === 'inactive') l = l.filter((c) => !c.active);
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter((c) => c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s) || c.phone.includes(s));
    }
    return l;
  }, [customers, q, filter]);

  const profile = customers.find((c) => c.id === profileId) ?? null;

  const openEdit = (c: Customer) => { setForm({ name: c.name, email: c.email, phone: c.phone }); setEditing(c); };
  const saveEdit = () => {
    if (!editing) return;
    if (!form.name.trim() || !form.email.includes('@')) { toast('Name and a valid email are required', 'err'); return; }
    upsert('customers', { ...editing, name: form.name.trim(), email: form.email.trim(), phone: form.phone });
    toast('Customer updated');
    setEditing(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Search name, email, phone…" className="w-full sm:w-80" />
        <div className="flex rounded-lg border border-line2 bg-card p-1">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn('rounded-md px-3.5 py-1.5 text-[12.5px] font-extrabold capitalize transition-colors cursor-pointer', filter === f ? 'bg-pine-900 text-paper' : 'text-ink2 hover:text-ink')}>{f}</button>
          ))}
        </div>
        <p className="ml-auto text-[12px] font-bold text-ink3">{list.length} customers</p>
      </div>

      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wider text-ink3">
                {['Customer', 'Phone', 'Registered', 'Orders', 'Lifetime spend', 'Status', ''].map((h, i) => <th key={i} className="px-5 py-3 font-extrabold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {list.map((c) => {
                const os = ordersOf(c);
                return (
                  <tr key={c.id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-paper/70">
                    <td className="px-5 py-3.5">
                      <button onClick={() => setProfileId(c.id)} className="flex items-center gap-3 text-left cursor-pointer">
                        <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full font-display text-[12px] font-bold', c.active ? 'bg-acc-soft text-acc' : 'bg-line text-ink3')}>
                          {c.name.split(' ').map((w) => w[0]).join('')}
                        </span>
                        <span>
                          <span className="block font-extrabold hover:text-acc">{c.name}</span>
                          <span className="block text-[11px] font-semibold text-ink3">{c.email}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-ink2">{c.phone || '—'}</td>
                    <td className="px-5 py-3.5 font-semibold text-ink2">{fmtDate(c.createdAt)}</td>
                    <td className="px-5 py-3.5 font-extrabold">{os.length}</td>
                    <td className="px-5 py-3.5 font-extrabold">{fmt(spendOf(c))}</td>
                    <td className="px-5 py-3.5">{c.active ? <Badge className="bg-moss-100 text-moss-700">Active</Badge> : <Badge className="bg-danger-soft text-danger">Deactivated</Badge>}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-0.5">
                        <Btn variant="outline" size="xs" onClick={() => setProfileId(c.id)}>Profile</Btn>
                        <button title="Edit" onClick={() => openEdit(c)} className="rounded-lg p-2 text-ink2 hover:bg-ink/5 hover:text-ink cursor-pointer"><Pencil size={14} /></button>
                        {c.active ? (
                          <button title="Deactivate" onClick={() => setConfirmOff(c)} className="rounded-lg p-2 text-ink2 hover:bg-danger-soft hover:text-danger cursor-pointer"><UserX size={14} /></button>
                        ) : (
                          <button title="Reactivate" onClick={() => { upsert('customers', { ...c, active: true }); toast(`${c.name} reactivated`); }} className="rounded-lg p-2 text-ink2 hover:bg-moss-100 hover:text-moss-700 cursor-pointer"><UserCheck size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.length === 0 && <p className="px-5 py-14 text-center text-[13px] font-semibold text-ink3">No customers match. They'll appear here after signing up or ordering.</p>}
        </div>
      </Card>

      {/* profile drawer */}
      <Drawer open={!!profile} onClose={() => setProfileId(null)} title={profile?.name ?? ''}
        footer={profile ? (
          <>
            <Btn variant="outline" size="sm" onClick={() => { openEdit(profile); setProfileId(null); }}><Pencil size={14} /> Edit</Btn>
            {profile.active
              ? <Btn variant="danger" size="sm" onClick={() => { setConfirmOff(profile); setProfileId(null); }}><UserX size={14} /> Deactivate</Btn>
              : <Btn size="sm" onClick={() => { upsert('customers', { ...profile, active: true }); toast(`${profile.name} reactivated`); setProfileId(null); }}><UserCheck size={14} /> Reactivate</Btn>}
          </>
        ) : undefined}>
        {profile && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <span className="flex size-14 items-center justify-center rounded-full bg-acc-soft font-display text-lg font-bold text-acc">{profile.name.split(' ').map((w) => w[0]).join('')}</span>
              <div>
                <p className="font-display text-[16px] font-bold">{profile.name}</p>
                <p className="text-[12px] font-semibold text-ink3">{profile.email}</p>
                <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink3"><Phone size={11} /> {profile.phone || 'no phone'} · joined {fmtDate(profile.createdAt)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[['Orders', String(ordersOf(profile).length)], ['Spent', fmt(spendOf(profile))], ['Avg order', fmt(ordersOf(profile).length ? Math.round(spendOf(profile) / ordersOf(profile).length) : 0)]].map(([l, v]) => (
                <div key={l} className="rounded-lg border border-line bg-paper/60 p-3 text-center">
                  <p className="font-display text-[15px] font-bold">{v}</p>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-ink3">{l}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-ink3">Addresses</p>
              {profile.addresses.length === 0 ? <p className="text-[13px] font-semibold text-ink3">No saved addresses.</p> : (
                <div className="space-y-2">
                  {profile.addresses.map((a) => (
                    <div key={a.id} className="flex items-start gap-2.5 rounded-lg border border-line p-3">
                      <MapPin size={15} className="mt-0.5 shrink-0 text-acc" />
                      <div>
                        <p className="text-[13px] font-extrabold">{a.label}</p>
                        <p className="text-[12px] font-semibold text-ink2">{a.line1}, {a.city}, {a.country} {a.zip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-ink3">Order history</p>
              {ordersOf(profile).length === 0 ? <p className="text-[13px] font-semibold text-ink3">No orders yet.</p> : (
                <div className="space-y-2">
                  {ordersOf(profile).map((o) => (
                    <div key={o.id} className="flex items-center gap-3 rounded-lg border border-line p-3">
                      <div className="flex -space-x-2">
                        {o.items.slice(0, 2).map((it, i) => (
                          <div key={i} className="size-9 overflow-hidden rounded-md border-2 border-card"><PImg src={it.image} hue={it.hue} alt={it.name} /></div>
                        ))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-extrabold">{o.number} · {fmt(o.total)}</p>
                        <p className="text-[11px] font-semibold text-ink3">{fmtDate(o.createdAt)}</p>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Edit — ${editing?.name}`}
        footer={<><Btn variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Btn><Btn size="sm" onClick={saveEdit}>Save</Btn></>}>
        <div className="space-y-4">
          <Field label="Full name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="inp" /></Field>
          <Field label="Email"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="inp" /></Field>
          <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="inp" /></Field>
        </div>
      </Modal>

      <Confirm open={!!confirmOff} onClose={() => setConfirmOff(null)} title="Deactivate customer" confirmLabel="Deactivate"
        body={`${confirmOff?.name} will no longer be able to sign in or check out. Their order history is preserved. You can reactivate them anytime.`}
        onConfirm={() => { if (confirmOff) { upsert('customers', { ...confirmOff, active: false }); toast(`${confirmOff.name} deactivated`, 'info'); } }} />
    </div>
  );
}

/* =============================== REVIEWS =============================== */

const REVIEW_TABS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'hidden', label: 'Hidden' },
] as const;

export function ReviewsPage() {
  const { reviews, products, upsert, del, toast } = useApp();
  const [tab, setTab] = useState<(typeof REVIEW_TABS)[number]['id']>('all');
  const [prodFilter, setProdFilter] = useState('');
  const [confirmDel, setConfirmDel] = useState<Review | null>(null);

  const list = useMemo(() => {
    let l = [...reviews].sort((a, b) => b.date.localeCompare(a.date));
    if (tab !== 'all') l = l.filter((r) => r.status === tab);
    if (prodFilter) l = l.filter((r) => r.product_id === prodFilter);
    return l;
  }, [reviews, tab, prodFilter]);

  const setStatus = (r: Review, status: Review['status']) => {
    upsert('reviews', { ...r, status });
    toast(status === 'approved' ? 'Review approved — now live on the product page' : status === 'hidden' ? 'Review hidden from the store' : 'Review restored to pending', status === 'approved' ? 'ok' : 'info');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-line2 bg-card p-1">
          {REVIEW_TABS.map((t) => {
            const count = t.id === 'all' ? reviews.length : reviews.filter((r) => r.status === t.id).length;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={cn('rounded-md px-3.5 py-1.5 text-[12.5px] font-extrabold transition-colors cursor-pointer', tab === t.id ? 'bg-pine-900 text-paper' : 'text-ink2 hover:text-ink')}>
                {t.label} ({count})
              </button>
            );
          })}
        </div>
        <select value={prodFilter} onChange={(e) => setProdFilter(e.target.value)} className="inp w-auto cursor-pointer">
          <option value="">All products</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {list.length === 0 ? (
        <Empty title="No reviews here" body={tab === 'pending' ? 'New customer reviews land here for moderation before going live.' : 'Reviews matching this view will appear here.'} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((r) => {
            const p = products.find((x) => x.id === r.product_id);
            return (
              <div key={r.id} className={cn('rounded-xl border bg-card p-5 transition-shadow hover:shadow-md', r.status === 'pending' ? 'border-warn/50' : 'border-line')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-acc-soft font-display text-[12px] font-bold text-acc">{r.customer.split(' ').map((w) => w[0]).join('')}</span>
                    <div>
                      <p className="text-[13px] font-extrabold">{r.customer}</p>
                      <p className="text-[11px] font-semibold text-ink3">{timeAgo(r.date)}</p>
                    </div>
                  </div>
                  <Badge className={r.status === 'approved' ? 'bg-moss-100 text-moss-700' : r.status === 'pending' ? 'bg-warn-soft text-warn' : 'bg-line text-ink3'}>
                    {r.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-2"><Stars rating={r.rating} /> <span className="text-[12px] font-bold text-ink3">{r.rating}.0</span></div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink2">“{r.text}”</p>
                {p && (
                  <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-paper/70 p-2.5">
                    <div className="size-9 shrink-0 overflow-hidden rounded-md"><PImg src={p.image} hue={p.hue} alt={p.name} /></div>
                    <p className="truncate text-[12px] font-extrabold">{p.name}</p>
                  </div>
                )}
                <div className="mt-4 flex items-center gap-2 border-t border-line pt-3.5">
                  {r.status !== 'approved' && <Btn variant="soft" size="xs" onClick={() => setStatus(r, 'approved')}><Check size={13} /> Approve</Btn>}
                  {r.status !== 'hidden' && <Btn variant="outline" size="xs" onClick={() => setStatus(r, 'hidden')}><EyeOff size={13} /> Hide</Btn>}
                  {r.status === 'hidden' && <Btn variant="outline" size="xs" onClick={() => setStatus(r, 'pending')}>Unhide</Btn>}
                  <button onClick={() => setConfirmDel(r)} className="ml-auto rounded-lg p-2 text-ink3 hover:bg-danger-soft hover:text-danger cursor-pointer" title="Delete review"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Confirm open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Delete review"
        body={`Permanently delete this review by ${confirmDel?.customer}? This can't be undone.`}
        onConfirm={() => { if (confirmDel) { del('reviews', confirmDel.id); toast('Review deleted', 'info'); } }} />
    </div>
  );
}

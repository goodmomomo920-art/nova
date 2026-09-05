import { useMemo, useState } from 'react';
import { Ban, Eye, Printer } from 'lucide-react';
import { useApp } from '../../lib/store';
import { Card } from './AdminLayout';
import { PImg } from '../../components/bits';
import { Btn, Confirm, Drawer, Modal, ORDER_META, PAYMENT_META, SearchInput, StatusBadge } from '../../components/ui';
import type { Order, OrderStatus, PaymentStatus } from '../../lib/types';
import { cn, fmtDate, fmtDateTime } from '../../lib/utils';

const STATUSES = Object.keys(ORDER_META) as OrderStatus[];
const PAYMENTS = Object.keys(PAYMENT_META) as PaymentStatus[];

export function OrdersPage() {
  const { orders, customers, upsert, patch, toast, fmt, website, settings, notify } = useApp();
  const [tab, setTab] = useState<'all' | OrderStatus>('all');
  const [q, setQ] = useState('');
  const [viewId, setViewId] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Order | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<Order | null>(null);

  const list = useMemo(() => {
    let l = orders;
    if (tab !== 'all') l = l.filter((o) => o.status === tab);
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter((o) => o.number.toLowerCase().includes(s) || o.customerName.toLowerCase().includes(s) || o.email.toLowerCase().includes(s));
    }
    return l;
  }, [orders, tab, q]);

  const order = orders.find((o) => o.id === viewId) ?? null;
  const orderCustomer = order ? customers.find((c) => c.id === order.customer_id || c.email.toLowerCase() === order.email.toLowerCase()) : null;

  const setStatus = (o: Order, status: OrderStatus) => {
    upsert('orders', { ...o, status });
    toast(`${o.number} → ${ORDER_META[status].label}`);
    if (status === 'cancelled' && o.status !== 'cancelled') {
      patch((d) => ({
        ...d,
        products: d.products.map((p) => {
          const it = o.items.find((i) => i.product_id === p.id);
          return it ? { ...p, stock: p.stock + it.qty, variants: p.variants.map((v, vi) => (vi === 0 ? { ...v, stock: v.stock + it.qty } : v)) } : p;
        }),
      }));
      if (o.payment === 'paid') upsert('orders', { ...o, status, payment: 'refunded' });
      notify('payment', `Refund issued — ${o.number}`, `Order cancelled and ${fmt(o.total)} refunded to ${o.customerName}.`);
    }
  };

  const setPayment = (o: Order, payment: PaymentStatus) => {
    upsert('orders', { ...o, payment });
    toast(`${o.number} payment → ${PAYMENT_META[payment].label}`);
  };

  const counts = (s: OrderStatus) => orders.filter((o) => o.status === s).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Order #, customer, email…" className="w-full sm:w-80" />
        <div className="ml-auto text-[12px] font-bold text-ink3">{list.length} of {orders.length} orders</div>
      </div>

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        <button onClick={() => setTab('all')} className={cn('whitespace-nowrap rounded-lg px-3.5 py-2 text-[12.5px] font-extrabold transition-colors cursor-pointer', tab === 'all' ? 'bg-pine-900 text-paper' : 'bg-card border border-line2 text-ink2 hover:text-ink')}>
          All ({orders.length})
        </button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setTab(s)} className={cn('whitespace-nowrap rounded-lg px-3.5 py-2 text-[12.5px] font-extrabold capitalize transition-colors cursor-pointer', tab === s ? 'bg-pine-900 text-paper' : 'bg-card border border-line2 text-ink2 hover:text-ink')}>
            {s} ({counts(s)})
          </button>
        ))}
      </div>

      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wider text-ink3">
                {['Order', 'Customer', 'Date', 'Items', 'Total', 'Payment', 'Status', ''].map((h, i) => <th key={i} className="px-5 py-3 font-extrabold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-paper/70">
                  <td className="px-5 py-3.5 font-extrabold">{o.number}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-bold">{o.customerName}</p>
                    <p className="text-[11px] font-semibold text-ink3">{o.email}</p>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-ink2">{fmtDate(o.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        {o.items.slice(0, 3).map((it, i) => (
                          <div key={i} className="size-8 overflow-hidden rounded-md border-2 border-card"><PImg src={it.image} hue={it.hue} alt={it.name} /></div>
                        ))}
                      </div>
                      <span className="ml-2.5 text-[12px] font-bold text-ink3">×{o.items.reduce((a, i) => a + i.qty, 0)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-extrabold">{fmt(o.total)}</td>
                  <td className="px-5 py-3.5"><span className={cn('rounded-md px-2 py-0.5 text-[11px] font-bold capitalize', PAYMENT_META[o.payment].cls)}>{o.payment}</span></td>
                  <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                  <td className="px-5 py-3.5 text-right">
                    <Btn variant="outline" size="xs" onClick={() => setViewId(o.id)}><Eye size={13} /> View</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && (
            <div className="px-5 py-16 text-center">
              <p className="font-display text-[15px] font-bold">No {tab !== 'all' ? tab : ''} orders</p>
              <p className="mt-1 text-[13px] font-semibold text-ink3">Orders matching this view will appear here.</p>
            </div>
          )}
        </div>
      </Card>

      {/* detail drawer */}
      <Drawer open={!!order} onClose={() => setViewId(null)} title={order ? `Order ${order.number}` : ''}
        footer={order ? (
          <>
            <Btn variant="outline" size="sm" onClick={() => setInvoice(order)}><Printer size={14} /> Invoice</Btn>
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <Btn variant="danger" size="sm" onClick={() => setConfirmCancel(order)}><Ban size={14} /> Cancel order</Btn>
            )}
          </>
        ) : undefined}>
        {order && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={order.status} />
              <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-bold capitalize', PAYMENT_META[order.payment].cls)}>{PAYMENT_META[order.payment].label}</span>
              <span className="ml-auto text-[12px] font-bold text-ink3">{fmtDateTime(order.createdAt)}</span>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-ink3">Update status</p>
              <div className="grid grid-cols-2 gap-3">
                <select value={order.status} onChange={(e) => setStatus(order, e.target.value as OrderStatus)} className="inp cursor-pointer font-bold">
                  {STATUSES.map((s) => <option key={s} value={s}>{ORDER_META[s].label}</option>)}
                </select>
                <select value={order.payment} onChange={(e) => setPayment(order, e.target.value as PaymentStatus)} className="inp cursor-pointer font-bold">
                  {PAYMENTS.map((s) => <option key={s} value={s}>{PAYMENT_META[s].label}</option>)}
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-paper/60 p-4">
              <p className="mb-3 text-[11px] font-extrabold uppercase tracking-wider text-ink3">Items</p>
              <div className="space-y-3">
                {order.items.map((it, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="size-12 shrink-0 overflow-hidden rounded-lg border border-line"><PImg src={it.image} hue={it.hue} alt={it.name} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-extrabold">{it.name}</p>
                      <p className="text-[11px] font-semibold text-ink3">{it.sku}{it.variant ? ` · ${it.variant}` : ''} · qty {it.qty}</p>
                    </div>
                    <p className="text-[13px] font-extrabold">{fmt(it.price * it.qty)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1.5 border-t border-line pt-3 text-[13px] font-semibold">
                <div className="flex justify-between text-ink2"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
                {order.discount > 0 && <div className="flex justify-between text-moss-700"><span>Discount {order.coupon}</span><span>−{fmt(order.discount)}</span></div>}
                <div className="flex justify-between text-ink2"><span>Shipping — {order.shippingMethod}</span><span>{order.shippingCost === 0 ? 'Free' : fmt(order.shippingCost)}</span></div>
                <div className="flex justify-between pt-1 text-[15px] font-extrabold"><span>Total</span><span className="font-display">{fmt(order.total)}</span></div>
              </div>
            </div>

            <div className="rounded-xl border border-line p-4">
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-ink3">Customer</p>
              <p className="text-[14px] font-extrabold">{order.customerName} {orderCustomer && <span className="ml-1 rounded bg-moss-100 px-1.5 py-0.5 text-[10px] font-extrabold text-moss-700">REGISTERED</span>}</p>
              <p className="mt-1 text-[13px] font-semibold text-ink2">{order.email} · {order.phone}</p>
              <p className="mt-2 text-[13px] font-semibold text-ink2">{order.address}, {order.city}, {order.country}</p>
              {orderCustomer && (
                <p className="mt-2 text-[11px] font-bold text-ink3">Customer since {fmtDate(orderCustomer.createdAt)} · {orders.filter((o) => o.customer_id === orderCustomer.id).length} orders lifetime</p>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* invoice */}
      <Modal open={!!invoice} onClose={() => setInvoice(null)} wide title={`Invoice — ${invoice?.number ?? ''}`}
        footer={<><Btn variant="outline" size="sm" onClick={() => setInvoice(null)}>Close</Btn><Btn size="sm" onClick={() => window.print()}><Printer size={14} /> Print / PDF</Btn></>}>
        {invoice && (
          <div className="print-area rounded-xl border border-line bg-white p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-display text-xl font-bold">{website?.storeName ?? 'NOVA STORE'}</p>
                <p className="mt-1 text-[12px] font-semibold text-ink2">{website?.contactAddress}</p>
                <p className="text-[12px] font-semibold text-ink2">{website?.contactEmail} · {website?.contactPhone}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-[15px] font-bold">INVOICE</p>
                <p className="mt-1 text-[12px] font-bold text-ink2">{invoice.number}</p>
                <p className="text-[12px] font-semibold text-ink3">{fmtDate(invoice.createdAt)}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-ink3">Billed to</p>
                <p className="mt-1.5 text-[13px] font-bold">{invoice.customerName}</p>
                <p className="text-[12px] font-semibold text-ink2">{invoice.address}</p>
                <p className="text-[12px] font-semibold text-ink2">{invoice.city}, {invoice.country}</p>
                <p className="text-[12px] font-semibold text-ink2">{invoice.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-ink3">Details</p>
                <p className="mt-1.5 text-[12px] font-semibold text-ink2">Shipping: {invoice.shippingMethod}</p>
                <p className="text-[12px] font-semibold text-ink2">Payment: {PAYMENT_META[invoice.payment].label}</p>
                <p className="text-[12px] font-semibold text-ink2">Status: {ORDER_META[invoice.status].label}</p>
              </div>
            </div>
            <table className="mt-6 w-full text-left text-[12.5px]">
              <thead>
                <tr className="border-b-2 border-ink text-[10px] uppercase tracking-wider text-ink3">
                  <th className="py-2 font-extrabold">Item</th><th className="py-2 font-extrabold">Qty</th><th className="py-2 text-right font-extrabold">Price</th><th className="py-2 text-right font-extrabold">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((it, i) => (
                  <tr key={i} className="border-b border-line">
                    <td className="py-2.5 font-bold">{it.name}{it.variant ? ` — ${it.variant}` : ''}<span className="ml-2 font-mono text-[10px] text-ink3">{it.sku}</span></td>
                    <td className="py-2.5 font-semibold">{it.qty}</td>
                    <td className="py-2.5 text-right font-semibold">{fmt(it.price)}</td>
                    <td className="py-2.5 text-right font-extrabold">{fmt(it.price * it.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 ml-auto max-w-[260px] space-y-1.5 text-[13px] font-semibold">
              <div className="flex justify-between text-ink2"><span>Subtotal</span><span>{fmt(invoice.subtotal)}</span></div>
              {invoice.discount > 0 && <div className="flex justify-between text-ink2"><span>Discount ({invoice.coupon})</span><span>−{fmt(invoice.discount)}</span></div>}
              <div className="flex justify-between text-ink2"><span>Shipping</span><span>{invoice.shippingCost === 0 ? 'Free' : fmt(invoice.shippingCost)}</span></div>
              <div className="flex justify-between border-t-2 border-ink pt-2 text-[15px] font-extrabold"><span>Total</span><span>{fmt(invoice.total)}</span></div>
            </div>
            <p className="mt-8 text-center text-[10px] font-semibold text-ink3">Thank you for shopping with {website?.storeName}. {settings?.storeName} · {settings?.currency}</p>
          </div>
        )}
      </Modal>

      <Confirm open={!!confirmCancel} onClose={() => setConfirmCancel(null)} title="Cancel order" danger
        body={`Cancel ${confirmCancel?.number}? Stock will be returned to inventory${confirmCancel?.payment === 'paid' ? ' and the payment marked as refunded' : ''}. The customer keeps their invoice.`}
        confirmLabel="Cancel order"
        onConfirm={() => { if (confirmCancel) setStatus(confirmCancel, 'cancelled'); }} />
    </div>
  );
}

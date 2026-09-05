import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Boxes, Calendar, CircleDollarSign, Package, ShoppingBag, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { useApp } from '../../lib/store';
import { Card } from './AdminLayout';
import { AreaChart, BarChart, Donut, HBars, Spark } from '../../components/charts';
import { StatusBadge, Empty } from '../../components/ui';
import { cn, dayKey, fmtDate, lastNDays, sum } from '../../lib/utils';

const fmtK = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${Math.round(n)}`);

function DeltaChip({ cur, prev }: { cur: number; prev: number }) {
  const pct = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : 100;
  const up = pct >= 0;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-extrabold', up ? 'bg-moss-100 text-moss-700' : 'bg-danger-soft text-danger')}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {up ? '+' : ''}{pct}%
    </span>
  );
}

export function DashboardPage() {
  const { orders, customers, products, categories, fmt, storeId } = useApp();
  const valid = orders.filter((o) => o.status !== 'cancelled');
  const days = lastNDays(14);

  const revByDay = days.map((d) => sum(valid.filter((o) => dayKey(o.createdAt) === d.key).map((o) => o.total)));
  const ordByDay = days.map((d) => valid.filter((o) => dayKey(o.createdAt) === d.key).length);
  const custByDay = days.map((d) => customers.filter((c) => dayKey(c.createdAt) === d.key).length);

  const totalRevenue = sum(valid.map((o) => o.total));
  const todayRev = revByDay[revByDay.length - 1];
  const yRev = revByDay[revByDay.length - 2] ?? 0;
  const pending = orders.filter((o) => o.status === 'pending');
  const delivered = orders.filter((o) => o.status === 'delivered');
  const newCust = customers.filter((c) => (Date.now() - new Date(c.createdAt).getTime()) / 86400000 < 30);
  const lowStock = products.filter((p) => p.active && p.stock <= p.lowStockThreshold);

  const catSales = useMemo(() => {
    const map = new Map<string, number>();
    valid.forEach((o) => o.items.forEach((it) => {
      const p = products.find((x) => x.id === it.product_id);
      const c = categories.find((x) => x.id === p?.category_id);
      const key = c?.name ?? 'Other';
      map.set(key, (map.get(key) ?? 0) + it.price * it.qty);
    }));
    return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [valid, products, categories]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { label: string; value: number; qty: number }>();
    valid.forEach((o) => o.items.forEach((it) => {
      const e = map.get(it.product_id) ?? { label: it.name, value: 0, qty: 0 };
      e.value += it.price * it.qty; e.qty += it.qty;
      map.set(it.product_id, e);
    }));
    return [...map.values()].sort((a, b) => b.value - a.value).slice(0, 5);
  }, [valid]);

  const stats = [
    { label: 'Total revenue', value: fmt(totalRevenue), sub: <DeltaChip cur={sum(revByDay.slice(7))} prev={sum(revByDay.slice(0, 7))} />, data: revByDay, icon: CircleDollarSign },
    { label: "Today's revenue", value: fmt(todayRev), sub: <DeltaChip cur={todayRev} prev={yRev} />, data: revByDay.slice(7), icon: Calendar },
    { label: 'Total orders', value: String(orders.length), sub: <span className="text-[11px] font-bold text-warn">{pending.length} pending · {delivered.length} delivered</span>, data: ordByDay, icon: ShoppingBag },
    { label: 'Customers', value: String(customers.length), sub: <span className="text-[11px] font-bold text-moss-700">+{newCust.length} in 30d</span>, data: custByDay, icon: Users },
    { label: 'Products', value: String(products.length), sub: <Link to="/admin/inventory" className="text-[11px] font-bold text-danger hover:underline">{lowStock.length} low stock →</Link>, data: products.slice(0, 10).map((p) => p.sold), icon: Package },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((s, i) => (
          <div key={s.label} className="pop-in rounded-xl border border-line bg-card p-4" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink3">{s.label}</p>
              <s.icon size={15} className="text-ink3" />
            </div>
            <p className="mt-2 font-display text-[22px] font-bold leading-none">{s.value}</p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div>{s.sub}</div>
              <Spark data={s.data} className="h-7 w-20 shrink-0" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        <Card className="xl:col-span-3" title="Revenue over time" sub="Last 14 days · cancelled orders excluded">
          <AreaChart data={revByDay} labels={days.map((d) => d.label)} format={(n) => fmt(n)} />
        </Card>
        <Card className="xl:col-span-2" title="Orders over time" sub="Daily order volume">
          <BarChart data={ordByDay} labels={days.map((d) => d.label)} format={(n) => `${n} orders`} />
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="Sales by category" sub="Share of revenue">
          {catSales.length ? <Donut slices={catSales} format={(n) => `$${fmtK(n)}`} /> : <Empty title="No sales yet" body="Category breakdown appears after the first order." />}
        </Card>
        <Card title="Top-selling products" sub="By revenue, all time">
          <HBars items={topProducts} format={(n) => `$${fmtK(n)}`} />
        </Card>
        <Card title="Needs attention" sub="Low stock & pending work" pad={false}>
          {lowStock.length === 0 && pending.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] font-semibold text-ink3">Everything is healthy. Nice.</p>
          ) : (
            <div className="divide-y divide-line">
              {lowStock.slice(0, 3).map((p) => (
                <Link key={p.id} to="/admin/inventory" className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-paper">
                  <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', p.stock === 0 ? 'bg-danger-soft text-danger' : 'bg-warn-soft text-warn')}><Boxes size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-extrabold">{p.name}</p>
                    <p className="text-[11px] font-bold text-ink3">{p.stock === 0 ? 'Out of stock' : `${p.stock} left · threshold ${p.lowStockThreshold}`}</p>
                  </div>
                  <ArrowRight size={14} className="text-ink3" />
                </Link>
              ))}
              {pending.slice(0, 3).map((o) => (
                <Link key={o.id} to="/admin/orders" className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-paper">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warn-soft text-warn"><ShoppingBag size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-extrabold">{o.number} — awaiting confirmation</p>
                    <p className="text-[11px] font-bold text-ink3">{o.customerName} · {fmt(o.total)}</p>
                  </div>
                  <ArrowRight size={14} className="text-ink3" />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Recent orders" sub={`Latest activity in ${storeId.toUpperCase()}`} pad={false}
        action={<Link to="/admin/orders" className="inline-flex items-center gap-1 text-[12px] font-extrabold uppercase tracking-wider text-acc hover:underline">View all <ArrowRight size={13} /></Link>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-wider text-ink3">
                {['Order', 'Customer', 'Date', 'Items', 'Total', 'Payment', 'Status'].map((h) => <th key={h} className="px-5 py-3 font-extrabold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 8).map((o) => (
                <tr key={o.id} className="border-b border-line/60 transition-colors last:border-0 hover:bg-paper/70">
                  <td className="px-5 py-3.5 font-extrabold">{o.number}</td>
                  <td className="px-5 py-3.5 font-semibold text-ink2">{o.customerName}</td>
                  <td className="px-5 py-3.5 font-semibold text-ink2">{fmtDate(o.createdAt)}</td>
                  <td className="px-5 py-3.5 font-semibold text-ink2">{o.items.reduce((a, i) => a + i.qty, 0)}</td>
                  <td className="px-5 py-3.5 font-extrabold">{fmt(o.total)}</td>
                  <td className="px-5 py-3.5"><span className={cn('rounded-md px-2 py-0.5 text-[11px] font-bold capitalize', o.payment === 'paid' ? 'bg-moss-100 text-moss-700' : o.payment === 'pending' ? 'bg-warn-soft text-warn' : 'bg-danger-soft text-danger')}>{o.payment}</span></td>
                  <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ============================== ANALYTICS ============================== */

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7', label: '7 Days' },
  { id: '30', label: '30 Days' },
  { id: '90', label: '90 Days' },
  { id: 'custom', label: 'Custom' },
];

export function AnalyticsPage() {
  const { orders, customers, products, categories, fmt } = useApp();
  const [range, setRange] = useState('30');
  const [from, setFrom] = useState(() => new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const { days, prevDays } = useMemo(() => {
    if (range === 'custom') {
      const s = new Date(from); const e = new Date(to);
      const n = Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000) + 1);
      const endOffset = Math.max(0, Math.round((Date.now() - e.getTime()) / 86400000));
      return { days: lastNDays(n + endOffset).slice(0, n), prevDays: lastNDays(n + endOffset + n).slice(0, n) };
    }
    const n = range === 'today' ? 1 : parseInt(range, 10);
    return { days: lastNDays(n), prevDays: lastNDays(n * 2).slice(0, n) };
  }, [range, from, to]);

  const inDays = <T extends { createdAt: string }>(list: T[], ds: { key: string }[]): T[] => {
    const set = new Set(ds.map((d) => d.key));
    return list.filter((o) => set.has(dayKey(o.createdAt)));
  };

  const cur = inDays(orders, days).filter((o) => o.status !== 'cancelled');
  const prev = inDays(orders, prevDays).filter((o) => o.status !== 'cancelled');
  const curAll = inDays(orders, days);

  // bucket into ≤ 20 points
  const bucketSize = Math.max(1, Math.ceil(days.length / 20));
  const buckets: { label: string; rev: number; count: number }[] = [];
  for (let i = 0; i < days.length; i += bucketSize) {
    const slice = days.slice(i, i + bucketSize);
    const keys = new Set(slice.map((d) => d.key));
    const os = cur.filter((o) => keys.has(dayKey(o.createdAt)));
    buckets.push({ label: slice[0].label, rev: sum(os.map((o) => o.total)), count: os.length });
  }

  const revenue = sum(cur.map((o) => o.total));
  const prevRevenue = sum(prev.map((o) => o.total));
  const aov = cur.length ? revenue / cur.length : 0;
  const prevAov = prev.length ? prevRevenue / prev.length : 0;
  const units = cur.reduce((a, o) => a + o.items.reduce((b, i) => b + i.qty, 0), 0);
  const keys = new Set(days.map((d) => d.key));
  const newCust = customers.filter((c) => keys.has(dayKey(c.createdAt))).length;
  const conv = customers.length ? Math.round((curAll.length / (customers.length * 6)) * 1000) / 10 : 0;

  const catSales = useMemo(() => {
    const map = new Map<string, { rev: number; orders: number }>();
    cur.forEach((o) => o.items.forEach((it) => {
      const p = products.find((x) => x.id === it.product_id);
      const c = categories.find((x) => x.id === p?.category_id);
      const key = c?.name ?? 'Other';
      const e = map.get(key) ?? { rev: 0, orders: 0 };
      e.rev += it.price * it.qty; e.orders += 1;
      map.set(key, e);
    }));
    return [...map.entries()].sort((a, b) => b[1].rev - a[1].rev);
  }, [cur, products, categories]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { label: string; value: number; qty: number }>();
    cur.forEach((o) => o.items.forEach((it) => {
      const e = map.get(it.product_id) ?? { label: it.name, value: 0, qty: 0 };
      e.value += it.price * it.qty; e.qty += it.qty;
      map.set(it.product_id, e);
    }));
    return [...map.values()].sort((a, b) => b.value - a.value).slice(0, 6);
  }, [cur]);

  const kpis = [
    { label: 'Revenue', value: fmt(revenue), cur: revenue, prev: prevRevenue },
    { label: 'Orders', value: String(cur.length), cur: cur.length, prev: prev.length },
    { label: 'Avg order value', value: fmt(Math.round(aov)), cur: aov, prev: prevAov },
    { label: 'Units sold', value: String(units), cur: units, prev: prev.reduce((a, o) => a + o.items.reduce((b, i) => b + i.qty, 0), 0) },
    { label: 'New customers', value: String(newCust), cur: newCust, prev: 0 },
    { label: 'Store conversion', value: `${conv}%`, cur: conv, prev: conv * 0.9 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-line2 bg-card p-1">
          {RANGES.map((r) => (
            <button key={r.id} onClick={() => setRange(r.id)}
              className={cn('rounded-md px-3.5 py-1.5 text-[12.5px] font-extrabold transition-colors cursor-pointer', range === r.id ? 'bg-pine-900 text-paper' : 'text-ink2 hover:text-ink')}>
              {r.label}
            </button>
          ))}
        </div>
        {range === 'custom' && (
          <div className="pop-in flex items-center gap-2">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="inp w-auto py-1.5 text-[13px]" />
            <span className="text-ink3">→</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="inp w-auto py-1.5 text-[13px]" />
          </div>
        )}
        <p className="ml-auto text-[12px] font-bold text-ink3">{days[0]?.label} — {days[days.length - 1]?.label} · vs previous period</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-line bg-card p-4">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink3">{k.label}</p>
            <p className="mt-2 font-display text-[19px] font-bold leading-none">{k.value}</p>
            <div className="mt-2"><DeltaChip cur={k.cur} prev={k.prev} /></div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        <Card className="xl:col-span-3" title="Revenue trend" sub={`${buckets.length} data points in range`}>
          {buckets.some((b) => b.rev > 0)
            ? <AreaChart data={buckets.map((b) => b.rev)} labels={buckets.map((b) => b.label)} format={(n) => fmt(n)} />
            : <Empty title="No revenue in range" body="Try widening the date range — orders will chart here." />}
        </Card>
        <Card className="xl:col-span-2" title="Order volume" sub="Orders per bucket">
          {buckets.some((b) => b.count > 0)
            ? <BarChart data={buckets.map((b) => b.count)} labels={buckets.map((b) => b.label)} format={(n) => `${n} orders`} />
            : <Empty title="No orders in range" body="Orders placed in this window chart here." />}
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card title="Best-selling products" sub="In selected range">
          {topProducts.length ? <HBars items={topProducts.map((t) => ({ label: t.label, value: t.value, hint: `${t.qty} sold` }))} format={(n) => `$${fmtK(n)}`} /> : <Empty title="Nothing sold yet" body="Product rankings appear once orders land in range." />}
        </Card>
        <Card title="Sales by category" sub="Revenue share">
          {catSales.length
            ? <Donut slices={catSales.slice(0, 5).map(([label, v]) => ({ label, value: v.rev }))} format={(n) => `$${fmtK(n)}`} />
            : <Empty title="No category data" body="Category sales appear here after orders." />}
        </Card>
        <Card title="Category performance" sub="Revenue & order contribution" pad={false}>
          {catSales.length === 0 ? <p className="px-5 py-10 text-center text-[13px] font-semibold text-ink3">No data in range.</p> : (
            <div className="divide-y divide-line">
              {catSales.map(([label, v], i) => (
                <div key={label} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="w-5 text-[12px] font-extrabold text-ink3">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-extrabold">{label}</p>
                    <p className="text-[11px] font-bold text-ink3">{v.orders} item sales</p>
                  </div>
                  <p className="font-display text-[14px] font-bold">{fmt(Math.round(v.rev))}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

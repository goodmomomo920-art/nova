import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3, Bell, Boxes, CheckCheck, ExternalLink, Globe, LayoutDashboard, Menu,
  MessageSquare, Package, Percent, Settings, ShoppingCart, Store, Tags, Users, X,
} from 'lucide-react';
import { useApp } from '../../lib/store';
import { cn, timeAgo } from '../../lib/utils';

const NAV: { group: string; items: { to: string; label: string; icon: typeof Package; end?: boolean }[] }[] = [
  {
    group: 'Overview',
    items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    group: 'Commerce',
    items: [
      { to: '/admin/products', label: 'Products', icon: Package },
      { to: '/admin/categories', label: 'Categories', icon: Tags },
      { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
      { to: '/admin/customers', label: 'Customers', icon: Users },
      { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
    ],
  },
  {
    group: 'Growth',
    items: [
      { to: '/admin/discounts', label: 'Discounts', icon: Percent },
      { to: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    group: 'Platform',
    items: [
      { to: '/admin/website', label: 'Website', icon: Globe },
      { to: '/admin/notifications', label: 'Notifications', icon: Bell },
      { to: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const TITLES: Record<string, string> = {
  '/admin': 'Dashboard', '/admin/products': 'Products', '/admin/categories': 'Categories',
  '/admin/orders': 'Orders', '/admin/customers': 'Customers', '/admin/inventory': 'Inventory',
  '/admin/discounts': 'Discounts & coupons', '/admin/reviews': 'Reviews', '/admin/analytics': 'Analytics',
  '/admin/website': 'Website editor', '/admin/notifications': 'Notifications', '/admin/settings': 'Settings',
};

export default function AdminLayout() {
  const { website, stores, storeId, setStoreId, unread, notices, markAllRead, orders, products, reviews, admin } = useApp();
  const [side, setSide] = useState(false);
  const [bell, setBell] = useState(false);
  const loc = useLocation();

  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const lowStock = products.filter((p) => p.active && p.stock <= p.lowStockThreshold).length;
  const pendingReviews = reviews.filter((r) => r.status === 'pending').length;

  const badgeFor = (to: string) =>
    to === '/admin/orders' ? pendingOrders : to === '/admin/inventory' ? lowStock : to === '/admin/notifications' ? unread : to === '/admin/reviews' ? pendingReviews : 0;

  const sidebar = (
    <div className="flex h-full flex-col bg-pine-950 text-paper">
      <div className="flex items-center justify-between px-5 py-5">
        <Link to="/admin" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-lime font-display text-sm font-extrabold text-pine-900">
            {(website?.logoText ?? 'N').slice(0, 1)}
          </span>
          <span>
            <span className="block font-display text-[14px] font-bold leading-tight">{website?.storeName ?? 'NOVA STORE'}</span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-paper/40">Admin console</span>
          </span>
        </Link>
        <button className="lg:hidden cursor-pointer" onClick={() => setSide(false)} aria-label="Close sidebar"><X size={19} /></button>
      </div>

      {/* tenant switcher */}
      <div className="mx-4 mb-4 rounded-xl border border-paper/10 bg-pine-900 p-3">
        <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-paper/40"><Store size={11} /> Store tenant</p>
        <select
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          className="w-full cursor-pointer rounded-lg border border-paper/15 bg-pine-950 px-3 py-2 text-[13px] font-bold text-paper outline-none focus:border-lime"
        >
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.plan}</option>)}
        </select>
        <p className="mt-2 text-[10px] font-semibold leading-relaxed text-paper/35">Data is fully isolated per store via store_id.</p>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {NAV.map((g) => (
          <div key={g.group} className="mb-5">
            <p className="mb-1.5 px-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-paper/30">{g.group}</p>
            {g.items.map((it) => {
              const badge = badgeFor(it.to);
              return (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.end}
                  onClick={() => setSide(false)}
                  className={({ isActive }) => cn(
                    'group relative mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-bold transition-colors',
                    isActive ? 'bg-pine-800 text-paper' : 'text-paper/55 hover:bg-pine-900 hover:text-paper',
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <span className={cn('absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-lime transition-all', isActive ? 'opacity-100' : 'opacity-0')} />
                      <it.icon size={17} className={cn(isActive ? 'text-lime' : 'text-paper/40 group-hover:text-paper/70')} />
                      <span className="flex-1">{it.label}</span>
                      {badge > 0 && <span className="rounded-md bg-lime px-1.5 py-0.5 text-[10px] font-extrabold text-pine-900">{badge}</span>}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-paper/10 p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-moss-600 font-display text-[12px] font-bold text-paper">
            {admin?.name.split(' ').map((w) => w[0]).join('')}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold">{admin?.name}</p>
            <p className="truncate text-[11px] font-semibold text-paper/40">{admin?.role} · {admin?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] lg:block">{sidebar}</aside>
      {side && (
        <div className="fixed inset-0 z-[75] bg-pine-950/60 backdrop-blur-[2px] lg:hidden" onMouseDown={() => setSide(false)}>
          <div className="pop-in h-full w-[280px]" onMouseDown={(e) => e.stopPropagation()}>{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-paper/92 px-4 backdrop-blur-md sm:px-6">
          <button className="lg:hidden cursor-pointer" onClick={() => setSide(true)} aria-label="Open sidebar"><Menu size={21} /></button>
          <div>
            <h1 className="font-display text-[16px] font-bold leading-tight">{TITLES[loc.pathname] ?? 'Admin'}</h1>
            <p className="hidden text-[11px] font-semibold text-ink3 sm:block">{website?.storeName} · {stores.find((s) => s.id === storeId)?.plan} plan</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/" className="hidden items-center gap-1.5 rounded-lg border border-line2 bg-card px-3.5 py-2 text-[12px] font-extrabold text-ink2 transition-colors hover:border-acc hover:text-acc sm:inline-flex">
              <ExternalLink size={13} /> View store
            </Link>
            <div className="relative">
              <button onClick={() => setBell((b) => !b)} aria-label="Notifications" className="relative flex size-10 items-center justify-center rounded-lg border border-line2 bg-card text-ink2 transition-colors hover:text-acc cursor-pointer">
                <Bell size={17} />
                {unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-extrabold text-white">{unread}</span>}
              </button>
              {bell && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setBell(false)} />
                  <div className="pop-in absolute right-0 z-50 mt-2 w-[340px] overflow-hidden rounded-xl border border-line bg-card shadow-2xl">
                    <div className="flex items-center justify-between border-b border-line px-4 py-3">
                      <p className="font-display text-[13px] font-bold">Notifications</p>
                      <button onClick={() => { markAllRead(); }} className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-acc cursor-pointer hover:opacity-75"><CheckCheck size={13} /> Mark all read</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notices.slice(0, 6).map((n) => (
                        <div key={n.id} className={cn('border-b border-line px-4 py-3', !n.read && 'bg-acc-soft/40')}>
                          <p className="flex items-center gap-2 text-[13px] font-extrabold">{!n.read && <span className="size-1.5 rounded-full bg-acc" />}{n.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-[12px] font-medium text-ink2">{n.body}</p>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-ink3">{timeAgo(n.date)}</p>
                        </div>
                      ))}
                      {notices.length === 0 && <p className="px-4 py-8 text-center text-[13px] font-semibold text-ink3">All quiet. No notifications.</p>}
                    </div>
                    <Link to="/admin/notifications" onClick={() => setBell(false)} className="block px-4 py-3 text-center text-[12px] font-extrabold uppercase tracking-wider text-acc hover:bg-paper">View all</Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <div className="mx-auto max-w-[1240px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export function Card({ title, sub, action, children, className, pad = true }: {
  title?: ReactNode; sub?: string; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean;
}) {
  return (
    <section className={cn('overflow-hidden rounded-xl border border-line bg-card', className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="font-display text-[14.5px] font-bold">{title}</h2>
            {sub && <p className="mt-0.5 text-[12px] font-semibold text-ink3">{sub}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={pad ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

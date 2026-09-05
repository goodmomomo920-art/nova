import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Heart, Menu, Search, ShoppingBag, User, X, ArrowUpRight, Instagram, Twitter, Facebook } from 'lucide-react';
import { useApp } from '../lib/store';
import { ACCENTS } from '../lib/data';
import { cn } from '../lib/utils';
import { Marquee } from '../components/bits';

export default function StoreLayout() {
  const { website, cartCount, wishlist, customer, categories, storeId } = useApp();
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState('');
  const nav = useNavigate();

  const accent = website?.accent ?? '#1e6b4e';
  const soft = ACCENTS.find((a) => a.value === accent)?.soft ?? '#e0ede4';

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    setMenu(false);
    nav(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : '/shop');
  };

  const navLink = ({ isActive }: { isActive: boolean }) =>
    cn('relative text-[13.5px] font-bold tracking-wide transition-colors py-1 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-[2px] after:origin-left after:scale-x-0 after:bg-acc after:transition-transform after:duration-300 hover:after:scale-x-100',
      isActive ? 'text-acc after:scale-x-100' : 'text-ink hover:text-acc');

  return (
    <div style={{ ['--acc' as string]: accent, ['--acc-soft' as string]: soft }} className="flex min-h-screen flex-col bg-paper text-ink">
      {/* announcement */}
      <div className="bg-pine-900 text-lime">
        <Marquee items={[website?.announcement ?? 'Welcome to the store', 'Free returns within 30 days', 'Lifetime repairs on everything', website?.announcement ?? 'New drop every month']} />
      </div>

      {/* header */}
      <header className="sticky top-0 z-50 border-b border-line bg-paper/92 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <button className="lg:hidden cursor-pointer" onClick={() => setMenu(true)} aria-label="Open menu"><Menu size={22} /></button>
          <Link to="/" className="font-display text-lg font-bold tracking-tight">
            {website?.logoText ?? 'NOVA'}<span className="text-acc">®</span>
          </Link>
          <nav className="ml-6 hidden items-center gap-6 lg:flex">
            <NavLink to="/shop" className={navLink}>Shop</NavLink>
            <NavLink to="/categories" className={navLink}>Categories</NavLink>
            <NavLink to="/about" className={navLink}>About</NavLink>
            <NavLink to="/contact" className={navLink}>Contact</NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <form onSubmit={submitSearch} className="relative mr-1 hidden md:block">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink3" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search products…"
                className="w-40 rounded-full border border-line bg-card py-2 pl-8 pr-3 text-[13px] font-semibold outline-none transition-all duration-300 placeholder:text-ink3 focus:w-60 focus:border-acc"
              />
            </form>
            <Link to="/shop?wish=1" aria-label="Wishlist" className="relative flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5 hover:text-acc">
              <Heart size={19} />
              {wishlist.length > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-acc px-1 text-[10px] font-extrabold text-acc-ink">{wishlist.length}</span>}
            </Link>
            <Link to={customer ? '/account' : '/login'} aria-label="Account" className="flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5 hover:text-acc">
              <User size={19} />
            </Link>
            <Link to="/cart" aria-label="Cart" className="relative flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5 hover:text-acc">
              <ShoppingBag size={19} />
              {cartCount > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-lime px-1 text-[10px] font-extrabold text-pine-900">{cartCount}</span>}
            </Link>
          </div>
        </div>
      </header>

      {/* mobile menu */}
      {menu && (
        <div className="fixed inset-0 z-[70] bg-pine-950/50 backdrop-blur-[2px] lg:hidden" onMouseDown={() => setMenu(false)}>
          <div className="pop-in absolute left-0 top-0 h-full w-[290px] border-r border-line bg-paper p-6" onMouseDown={(e) => e.stopPropagation()}>
            <div className="mb-8 flex items-center justify-between">
              <span className="font-display text-lg font-bold">{website?.logoText ?? 'NOVA'}<span className="text-acc">®</span></span>
              <button onClick={() => setMenu(false)} aria-label="Close menu" className="cursor-pointer"><X size={20} /></button>
            </div>
            <form onSubmit={submitSearch} className="relative mb-6">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="inp pl-9" />
            </form>
            <nav className="flex flex-col gap-1">
              {[['/shop', 'Shop all'], ['/categories', 'Categories'], ['/about', 'About'], ['/contact', 'Contact'], ['/account', 'My account'], ['/cart', `Cart (${cartCount})`]].map(([to, label]) => (
                <Link key={to} to={to} onClick={() => setMenu(false)} className="rounded-lg px-3 py-2.5 font-display text-[15px] font-semibold transition-colors hover:bg-acc-soft hover:text-acc">{label}</Link>
              ))}
            </nav>
            <p className="mt-10 text-[11px] font-bold uppercase tracking-[0.2em] text-ink3">Top categories</p>
            <div className="mt-3 flex flex-col gap-1">
              {categories.filter((c) => !c.parent_id && c.active).slice(0, 5).map((c) => (
                <Link key={c.id} to={`/shop?cat=${c.slug}`} onClick={() => setMenu(false)} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-ink2 hover:text-acc">
                  {c.name} <ArrowUpRight size={14} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      {/* footer */}
      <footer className="darkgrid mt-20 bg-pine-950 text-paper">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <p className="font-display text-xl font-bold">{website?.logoText ?? 'NOVA'}<span className="text-lime">®</span></p>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-paper/60">{website?.footerText}</p>
              <div className="mt-5 flex gap-2">
                {[Instagram, Twitter, Facebook].map((I, i) => (
                  <a key={i} href="#/" aria-label="Social link" className="flex size-9 items-center justify-center rounded-lg border border-paper/15 text-paper/70 transition-colors hover:border-lime hover:text-lime">
                    <I size={16} />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.22em] text-paper/40">Shop</p>
              {categories.filter((c) => !c.parent_id && c.active).slice(0, 6).map((c) => (
                <Link key={c.id} to={`/shop?cat=${c.slug}`} className="block py-1.5 text-sm font-semibold text-paper/70 transition-colors hover:text-lime">{c.name}</Link>
              ))}
            </div>
            <div>
              <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.22em] text-paper/40">Company</p>
              {[['/about', 'About us'], ['/contact', 'Contact'], ['/shop', 'All products'], ['/account', 'My account'], ['/cart', 'Cart']].map(([to, label]) => (
                <Link key={to} to={to} className="block py-1.5 text-sm font-semibold text-paper/70 transition-colors hover:text-lime">{label}</Link>
              ))}
            </div>
            <div>
              <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.22em] text-paper/40">Get in touch</p>
              <p className="py-1.5 text-sm font-semibold text-paper/70">{website?.contactEmail}</p>
              <p className="py-1.5 text-sm font-semibold text-paper/70">{website?.contactPhone}</p>
              <p className="py-1.5 text-sm font-semibold text-paper/70">{website?.contactAddress}</p>
              <Link to="/admin" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-paper/10 px-3.5 py-2 text-[12px] font-bold text-paper transition-colors hover:bg-lime hover:text-pine-900">
                Store admin <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
          <div className="pointer-events-none mt-10 select-none overflow-hidden">
            <p className="whitespace-nowrap text-center font-display text-[18vw] font-extrabold leading-[0.85] md:text-[10.5rem]" style={{ WebkitTextStroke: '1px rgba(244,242,236,.13)', color: 'transparent' }}>
              {website?.logoText ?? 'NOVA'}
            </p>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-paper/10 pt-6 text-[12px] font-semibold text-paper/45">
            <p>© {new Date().getFullYear()} {website?.storeName}. All rights reserved. Store: {storeId}</p>
            <p className="flex gap-2">
              {['VISA', 'MC', 'AMEX', 'PAYPAL'].map((p) => (
                <span key={p} className="rounded border border-paper/15 px-2 py-0.5 text-[10px] font-extrabold tracking-wider">{p}</span>
              ))}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

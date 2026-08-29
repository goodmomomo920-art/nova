import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Heart, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { useApp } from '../lib/store';
import { ProductCard, PImg, Reveal } from '../components/bits';
import { Btn, Drawer, Empty, Pagination } from '../components/ui';
import { cn } from '../lib/utils';

const PER_PAGE = 9;

const SORTS = [
  { id: 'featured', label: 'Featured' },
  { id: 'best', label: 'Best selling' },
  { id: 'newest', label: 'Newest' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'rating', label: 'Top rated' },
];

export default function Shop() {
  const { products, categories, wishlist } = useApp();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const cat = params.get('cat') ?? '';
  const wishOnly = params.get('wish') === '1';

  const [minP, setMinP] = useState('');
  const [maxP, setMaxP] = useState('');
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState('featured');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => { setPage(1); }, [q, cat, wishOnly]);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  const catList = categories.filter((c) => c.active);
  const active = products.filter((p) => p.active);

  const filtered = useMemo(() => {
    let list = active;
    if (wishOnly) list = list.filter((p) => wishlist.includes(p.id));
    if (cat) {
      const root = catList.find((c) => c.slug === cat);
      const ids = new Set(catList.filter((c) => c.slug === cat || (root && c.parent_id === root.id)).map((c) => c.id));
      list = list.filter((p) => ids.has(p.category_id));
    }
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(s) || p.tags.some((t) => t.includes(s)) ||
        p.description.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
    }
    const min = parseFloat(minP), max = parseFloat(maxP);
    if (!Number.isNaN(min)) list = list.filter((p) => (p.sale_price ?? p.price) >= min);
    if (!Number.isNaN(max)) list = list.filter((p) => (p.sale_price ?? p.price) <= max);
    if (inStock) list = list.filter((p) => p.stock > 0);
    const eff = (p: typeof list[number]) => p.sale_price ?? p.price;
    switch (sort) {
      case 'price-asc': list = [...list].sort((a, b) => eff(a) - eff(b)); break;
      case 'price-desc': list = [...list].sort((a, b) => eff(b) - eff(a)); break;
      case 'newest': list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
      case 'rating': list = [...list].sort((a, b) => b.rating - a.rating); break;
      case 'best': list = [...list].sort((a, b) => b.sold - a.sold); break;
      default: list = [...list].sort((a, b) => Number(b.featured) - Number(a.featured) || b.sold - a.sold);
    }
    return list;
  }, [active, catList, q, cat, wishOnly, wishlist, minP, maxP, inStock, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const hasFilters = !!(q || cat || minP || maxP || inStock || wishOnly);

  const clearAll = () => {
    setMinP(''); setMaxP(''); setInStock(false); setSort('featured');
    setParams(new URLSearchParams(), { replace: true });
  };

  const filterPanel = (
    <div className="space-y-7">
      <div>
        <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-ink3">Categories</p>
        <div className="space-y-1">
          <button onClick={() => setParam('cat', null)} className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2 text-[13px] font-bold transition-colors cursor-pointer', !cat ? 'bg-acc-soft text-acc' : 'text-ink2 hover:bg-ink/5')}>
            All products <span className="text-[11px] text-ink3">{active.length}</span>
          </button>
          {catList.filter((c) => !c.parent_id).map((c) => {
            const subs = catList.filter((s) => s.parent_id === c.id);
            const count = active.filter((p) => p.category_id === c.id || subs.some((s) => s.id === p.category_id)).length;
            return (
              <button key={c.id} onClick={() => setParam('cat', c.slug)} className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] font-bold transition-colors cursor-pointer', cat === c.slug ? 'bg-acc-soft text-acc' : 'text-ink2 hover:bg-ink/5')}>
                {c.name} <span className="text-[11px] text-ink3">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-ink3">Price range</p>
        <div className="flex items-center gap-2">
          <input value={minP} onChange={(e) => { setMinP(e.target.value); setPage(1); }} placeholder="Min" inputMode="numeric" className="inp w-full text-[13px]" />
          <span className="text-ink3">—</span>
          <input value={maxP} onChange={(e) => { setMaxP(e.target.value); setPage(1); }} placeholder="Max" inputMode="numeric" className="inp w-full text-[13px]" />
        </div>
      </div>
      <div className="space-y-2.5">
        {[
          { label: 'In stock only', on: inStock, set: (v: boolean) => { setInStock(v); setPage(1); } },
          { label: 'My wishlist only', on: wishOnly, set: (v: boolean) => setParam('wish', v ? '1' : null) },
        ].map((f) => (
          <button key={f.label} onClick={() => f.set(!f.on)} className="flex w-full items-center gap-3 text-[13px] font-bold text-ink2 cursor-pointer">
            <span className={cn('flex size-5 items-center justify-center rounded-md border transition-colors', f.on ? 'border-acc bg-acc text-acc-ink' : 'border-line2 bg-card')}>
              {f.on && <svg width="11" height="11" viewBox="0 0 12 12"><path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>}
            </span>
            {f.label}
          </button>
        ))}
      </div>
      {hasFilters && (
        <button onClick={clearAll} className="inline-flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wider text-danger cursor-pointer hover:opacity-75">
          <RotateCcw size={13} /> Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Reveal>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-acc">{wishOnly ? 'Saved for later' : cat ? `Department` : 'The catalogue'}</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
          {wishOnly ? 'Your wishlist' : cat ? (catList.find((c) => c.slug === cat)?.name ?? 'Category') : q ? `Results for “${q}”` : 'Shop everything'}
        </h1>
        <p className="mt-2 text-sm font-semibold text-ink3">{filtered.length} product{filtered.length === 1 ? '' : 's'}{cat && ` in ${catList.find((c) => c.slug === cat)?.name}`}</p>
      </Reveal>

      <div className="mt-8 grid gap-8 lg:grid-cols-[230px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-xl border border-line bg-card p-5">{filterPanel}</div>
        </aside>

        <div>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <button onClick={() => setFiltersOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-line2 bg-card px-4 py-2.5 text-[13px] font-bold lg:hidden cursor-pointer">
              <SlidersHorizontal size={15} /> Filters {hasFilters && <span className="size-2 rounded-full bg-acc" />}
            </button>
            <div className="ml-auto flex items-center gap-2">
              <label className="text-[12px] font-bold text-ink3">Sort</label>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="inp w-auto py-2 text-[13px] font-bold cursor-pointer">
                {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {(q || cat) && (
            <div className="mb-5 flex flex-wrap gap-2">
              {q && <button onClick={() => setParam('q', null)} className="inline-flex items-center gap-1.5 rounded-full bg-pine-900 px-3 py-1.5 text-[12px] font-bold text-paper cursor-pointer">“{q}” <X size={13} /></button>}
              {cat && <button onClick={() => setParam('cat', null)} className="inline-flex items-center gap-1.5 rounded-full bg-acc-soft px-3 py-1.5 text-[12px] font-bold text-acc cursor-pointer">{catList.find((c) => c.slug === cat)?.name} <X size={13} /></button>}
            </div>
          )}

          {pageItems.length === 0 ? (
            wishOnly && !hasFilters ? (
              <Empty icon={<Heart size={24} />} title="Nothing saved yet" body="Tap the heart on any product to build your wishlist. It lives here, ready for payday."
                action={<Link to="/shop"><Btn>Browse the shop</Btn></Link>} />
            ) : (
              <Empty title="No products match" body="Try widening the price range, clearing the category, or searching for something else."
                action={<Btn variant="outline" onClick={clearAll}>Clear filters</Btn>} />
            )
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3">
                {pageItems.map((p, i) => <Reveal key={p.id} delay={(i % 3) * 60}><ProductCard product={p} index={i} /></Reveal>)}
              </div>
              <Pagination page={page} pages={pages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            </>
          )}
        </div>
      </div>

      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters"
        footer={<Btn className="w-full" onClick={() => setFiltersOpen(false)}>Show {filtered.length} result{filtered.length === 1 ? '' : 's'}</Btn>}>
        {filterPanel}
      </Drawer>
    </div>
  );
}

export function CategoriesPage() {
  const { categories, products } = useApp();
  const cats = categories.filter((c) => c.active && !c.parent_id);
  const active = products.filter((p) => p.active);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Reveal>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-acc">Departments</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Every category, one roof.</h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink2">Small on purpose. Each department holds only the objects that earned their place.</p>
      </Reveal>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cats.map((c, i) => {
          const subs = categories.filter((s) => s.parent_id === c.id && s.active);
          const count = active.filter((p) => p.category_id === c.id || subs.some((s) => s.id === p.category_id)).length;
          return (
            <Reveal key={c.id} delay={i * 60}>
              <Link to={`/shop?cat=${c.slug}`} className="group relative block overflow-hidden rounded-xl border border-line">
                <div className="aspect-[16/11]">
                  <div className="h-full w-full transition-transform duration-700 group-hover:scale-[1.06]"><PImg src={c.image} alt={c.name} /></div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-pine-950/80 via-pine-950/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="flex items-end justify-between">
                    <div>
                      <h2 className="font-display text-xl font-bold text-paper">{c.name}</h2>
                      <p className="mt-1 line-clamp-1 max-w-[240px] text-[12px] font-semibold text-paper/60">{c.description}</p>
                      <p className="mt-2 text-[11px] font-extrabold uppercase tracking-wider text-lime">{count} products</p>
                    </div>
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lime text-pine-900 transition-transform duration-300 group-hover:rotate-45"><ArrowUpRight size={18} /></span>
                  </div>
                  {subs.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {subs.map((s) => <span key={s.id} className="rounded-full bg-paper/15 px-2.5 py-1 text-[11px] font-bold text-paper backdrop-blur">{s.name}</span>)}
                    </div>
                  )}
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

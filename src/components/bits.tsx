import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Minus, Plus, ShoppingBag, Star } from 'lucide-react';
import type { Product } from '../lib/types';
import { useApp } from '../lib/store';
import { cn, discountPct, hueFilter } from '../lib/utils';

/* ---------- scroll reveal ---------- */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn('reveal', on && 'on', className)} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}

/* ---------- product image ---------- */
export function PImg({ src, hue, alt, className, style }: { src: string; hue?: number; alt: string; className?: string; style?: CSSProperties }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-[#e7e6dd]', className)}>
      {!loaded && !failed && <div className="skeleton absolute inset-0" />}
      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <ShoppingBag size={28} className="text-ink3" />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn('h-full w-full object-cover transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0')}
          style={{ ...hueFilter(hue), ...style }}
        />
      )}
    </div>
  );
}

/* ---------- rating stars ---------- */
export function Stars({ rating, size = 13, className }: { rating: number; size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= Math.round(rating) ? 'fill-[#e0a53a] text-[#e0a53a]' : 'fill-line2 text-line2'} />
      ))}
    </span>
  );
}

/* ---------- price ---------- */
export function Price({ product, className, big }: { product: Pick<Product, 'price' | 'sale_price'>; className?: string; big?: boolean }) {
  const { fmt } = useApp();
  return (
    <span className={cn('inline-flex items-baseline gap-2', className)}>
      <span className={cn('font-display font-semibold', big ? 'text-2xl' : 'text-[15px]')}>{fmt(product.sale_price ?? product.price)}</span>
      {product.sale_price != null && (
        <span className={cn('text-ink3 line-through', big ? 'text-base' : 'text-xs')}>{fmt(product.price)}</span>
      )}
    </span>
  );
}

/* ---------- qty picker ---------- */
export function QtyPicker({ qty, onChange, max = 99, size = 'md' }: { qty: number; onChange: (q: number) => void; max?: number; size?: 'sm' | 'md' }) {
  return (
    <div className={cn('inline-flex items-center rounded-lg border border-line2 bg-card', size === 'sm' ? 'h-8' : 'h-11')}>
      <button onClick={() => onChange(Math.max(1, qty - 1))} className="flex h-full w-8 items-center justify-center text-ink2 hover:text-ink cursor-pointer disabled:opacity-40" disabled={qty <= 1} aria-label="Decrease"><Minus size={14} /></button>
      <span className={cn('text-center font-bold tabular-nums', size === 'sm' ? 'w-7 text-[13px]' : 'w-9 text-sm')}>{qty}</span>
      <button onClick={() => onChange(Math.min(max, qty + 1))} className="flex h-full w-8 items-center justify-center text-ink2 hover:text-ink cursor-pointer disabled:opacity-40" disabled={qty >= max} aria-label="Increase"><Plus size={14} /></button>
    </div>
  );
}

/* ---------- section heading ---------- */
export function SectionHead({ kicker, title, link, onDark }: { kicker: string; title: string; link?: ReactNode; onDark?: boolean }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className={cn('mb-2 text-[11px] font-extrabold uppercase tracking-[0.22em]', onDark ? 'text-lime' : 'text-acc')}>{kicker}</p>
        <h2 className={cn('font-display text-2xl font-semibold leading-tight sm:text-[32px]', onDark ? 'text-paper' : 'text-ink')}>{title}</h2>
      </div>
      {link}
    </div>
  );
}

/* ---------- marquee ---------- */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  const row = items.map((t, i) => (
    <span key={i} className="mx-6 inline-flex items-center gap-6 text-[13px] font-bold uppercase tracking-[0.18em]">
      {t}
      <svg width="10" height="10" viewBox="0 0 10 10" className="text-current opacity-60"><path d="M5 0l1.2 3.8L10 5 6.2 6.2 5 10 3.8 6.2 0 5l3.8-1.2z" fill="currentColor" /></svg>
    </span>
  ));
  return (
    <div className={cn('overflow-hidden whitespace-nowrap', className)}>
      <div className="marquee-track inline-flex w-max py-2.5">{row}{row}</div>
    </div>
  );
}

/* ---------- product card ---------- */
export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addToCart, toggleWish, wishlist, categories } = useApp();
  const wished = wishlist.includes(product.id);
  const cat = categories.find((c) => c.id === product.category_id);
  const out = product.stock <= 0;
  return (
    <div className="group relative">
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-line bg-[#e9e8df]">
          <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.06]">
            <PImg src={product.image} hue={product.hue} alt={product.name} />
          </div>
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.isNew && <span className="rounded-md bg-lime px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest text-pine-900">New</span>}
            {product.sale_price != null && <span className="rounded-md bg-acc px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest text-acc-ink">−{discountPct(product.price, product.sale_price)}%</span>}
            {out && <span className="rounded-md bg-pine-900 px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest text-paper">Sold out</span>}
          </div>
          {!out && (
            <button
              onClick={(e) => { e.preventDefault(); addToCart(product.id); }}
              className="absolute inset-x-3 bottom-3 flex translate-y-0 items-center justify-center gap-2 rounded-lg bg-pine-900/95 py-2.5 text-[13px] font-bold text-paper opacity-100 shadow-lg backdrop-blur transition-all duration-300 hover:bg-pine-800 sm:translate-y-14 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 cursor-pointer"
            >
              <ShoppingBag size={15} /> Add to cart
            </button>
          )}
        </div>
        <div className="mt-3.5 flex items-start justify-between gap-2 px-0.5">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-ink3">{cat?.name ?? 'General'}</p>
            <h3 className="mt-1 truncate font-display text-[13.5px] font-semibold leading-snug text-ink group-hover:text-acc transition-colors">{product.name}</h3>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-ink3">
              <Stars rating={product.rating} size={11} /> {product.rating.toFixed(1)} ({product.ratingCount})
            </div>
          </div>
          <Price product={product} className="mt-0.5 shrink-0" />
        </div>
      </Link>
      <button
        onClick={() => toggleWish(product.id)}
        aria-label="Toggle wishlist"
        className={cn('absolute right-3 top-3 flex size-9 items-center justify-center rounded-full border shadow-sm transition-all cursor-pointer',
          wished ? 'border-transparent bg-acc text-acc-ink' : 'border-line bg-card/90 text-ink2 hover:text-acc backdrop-blur')}
        style={{ transitionDelay: `${index * 20}ms` }}
      >
        <Heart size={16} className={wished ? 'fill-current' : ''} />
      </button>
    </div>
  );
}

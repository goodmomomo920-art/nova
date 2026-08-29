import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Check, ClipboardCopy, Leaf, RefreshCw, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { useApp } from '../lib/store';
import { ProductCard, PImg, Reveal, SectionHead, Stars } from '../components/bits';
import { Btn } from '../components/ui';
import { discountPct } from '../lib/utils';

function SpinBadge() {
  return (
    <div className="spin-slow absolute -left-7 -top-7 hidden size-28 md:block">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <defs><path id="circ" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" /></defs>
        <circle cx="50" cy="50" r="49" fill="var(--color-lime)" />
        <text fontSize="10.5" fontWeight="800" letterSpacing="1.6" fill="var(--color-pine-900)" fontFamily="Manrope">
          <textPath href="#circ">FREE SHIPPING OVER $150 · 30-DAY RETURNS ·</textPath>
        </text>
        <path d="M44 38l14 12-14 12z" fill="var(--color-pine-900)" />
      </svg>
    </div>
  );
}

export default function Home() {
  const { website, products, categories, reviews, addToCart, toast, fmt, orders, customers, settings } = useApp();
  const freeOver = settings?.freeShipThreshold ?? 150;
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const active = products.filter((p) => p.active);
  const featured = useMemo(() => {
    const ids = website?.featuredIds ?? [];
    const list = ids.map((id) => active.find((p) => p.id === id)).filter(Boolean) as typeof active;
    return (list.length ? list : active.slice(0, 4)).slice(0, 4);
  }, [website, active]);
  const fresh = active.filter((p) => p.isNew).slice(0, 4);
  const best = [...active].sort((a, b) => b.sold - a.sold).slice(0, 4);
  const offers = active.filter((p) => p.sale_price != null);
  const approved = reviews.filter((r) => r.status === 'approved').slice(0, 6);
  const heroProduct = featured[0] ?? active[0];
  const avgRating = active.length ? active.reduce((a, p) => a + p.rating, 0) / active.length : 0;

  const subscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) { toast('Please enter a valid email address', 'err'); return; }
    setSubscribed(true);
    toast('Subscribed — 10% code on its way to your inbox');
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(website?.promoCode ?? 'NOVA10').catch(() => undefined);
    toast(`Code ${website?.promoCode ?? 'NOVA10'} copied to clipboard`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* ---------- hero ---------- */}
      <section className="dotgrid relative -mx-4 overflow-hidden px-4 pb-14 pt-10 sm:-mx-6 sm:px-6 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-acc">
              <span className="size-1.5 animate-pulse rounded-full bg-acc" /> {active.length} objects · new season
            </p>
            <h1 className="mt-6 font-display text-[clamp(2.1rem,5.6vw,4.3rem)] font-bold leading-[1.04] tracking-tight">
              {website?.heroTitle ?? 'Objects for modern living'}
              <span className="mt-2 block text-[0.42em] font-semibold leading-snug text-ink2">
                {website?.tagline}
              </span>
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink2">{website?.heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop">
                <Btn size="lg" className="group">{website?.heroCta ?? 'Shop the collection'} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Btn>
              </Link>
              <Link to="/categories"><Btn size="lg" variant="outline">Browse categories</Btn></Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
              {[[`${orders.length}+`, 'orders shipped'], [`${avgRating.toFixed(1)}★`, 'average rating'], [`${customers.length * 40}+`, 'happy customers']].map(([v, l]) => (
                <div key={l}>
                  <p className="font-display text-xl font-bold">{v}</p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ink3">{l}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={120} className="relative">
            <SpinBadge />
            <div className="relative ml-0 overflow-hidden rounded-2xl border border-line shadow-[0_24px_60px_-24px_rgba(16,31,25,0.35)] md:ml-10">
              <div className="aspect-[13/10]">
                <PImg src={website?.heroImage ?? ''} alt="Hero" />
              </div>
            </div>
            {heroProduct && (
              <button onClick={() => addToCart(heroProduct.id)} className="floaty absolute -bottom-5 right-2 flex items-center gap-3 rounded-xl border border-line bg-card p-3 pr-5 text-left shadow-xl transition-colors hover:border-acc cursor-pointer md:right-6">
                <div className="size-14 overflow-hidden rounded-lg"><PImg src={heroProduct.image} hue={heroProduct.hue} alt={heroProduct.name} /></div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-ink3">Trending now</p>
                  <p className="font-display text-[13px] font-semibold">{heroProduct.name}</p>
                  <p className="text-[12px] font-bold text-acc">{fmt(heroProduct.sale_price ?? heroProduct.price)} · tap to add</p>
                </div>
                <ShoppingBag size={17} className="text-acc" />
              </button>
            )}
          </Reveal>
        </div>
      </section>

      {/* ---------- values ---------- */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
        {[[Truck, 'Free shipping', `On orders over ${fmt(freeOver)}`], [RefreshCw, '30-day returns', 'No questions asked'], [ShieldCheck, '2-year warranty', 'On every product'], [Leaf, 'Carbon neutral', 'Every parcel offset']].map(([I, t, s]) => {
          const Icon = I as typeof Truck;
          return (
            <div key={t as string} className="group flex items-center gap-3.5 bg-card px-5 py-5 transition-colors hover:bg-acc-soft">
              <Icon size={20} className="shrink-0 text-acc transition-transform duration-300 group-hover:-translate-y-0.5" />
              <div>
                <p className="text-[13px] font-extrabold">{t as string}</p>
                <p className="text-[12px] font-medium text-ink3">{s as string}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* ---------- featured ---------- */}
      <section className="mt-20">
        <Reveal>
          <SectionHead
            kicker="Hand-picked"
            title="Featured objects"
            link={<Link to="/shop" className="group inline-flex items-center gap-1.5 text-[13px] font-extrabold uppercase tracking-wider text-acc">View all <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></Link>}
          />
        </Reveal>
        <div className="grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-4">
          {featured.map((p, i) => <Reveal key={p.id} delay={i * 70}><ProductCard product={p} index={i} /></Reveal>)}
        </div>
      </section>

      {/* ---------- promo banner ---------- */}
      {website?.showOffers && (
        <section className="mt-20">
          <Reveal>
            <div className="darkgrid relative overflow-hidden rounded-2xl bg-pine-900 px-6 py-10 text-paper sm:px-10 lg:px-14 lg:py-14">
              <div className="grid items-center gap-8 lg:grid-cols-[1.5fr_1fr]">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-lime">Limited-time offer</p>
                  <h2 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-4xl">{website.promoTitle}</h2>
                  <p className="mt-3 max-w-lg text-sm leading-relaxed text-paper/65">{website.promoBody}</p>
                  <Link to="/shop" className="mt-6 inline-block">
                    <Btn variant="lime" size="lg" className="group">Shop the edit <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Btn>
                  </Link>
                </div>
                <button onClick={copyCode} className="group flex items-center justify-between gap-4 rounded-xl border-2 border-dashed border-lime/50 bg-pine-950/60 px-6 py-5 text-left transition-colors hover:border-lime cursor-pointer">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-paper/50">Your code</p>
                    <p className="mt-1 font-display text-2xl font-bold tracking-wide text-lime">{website.promoCode}</p>
                  </div>
                  <ClipboardCopy size={22} className="text-paper/50 transition-colors group-hover:text-lime" />
                </button>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* ---------- categories ---------- */}
      {website?.showCategories && (
        <section className="mt-20">
          <Reveal>
            <SectionHead kicker="Departments" title="Shop by category"
              link={<Link to="/categories" className="group inline-flex items-center gap-1.5 text-[13px] font-extrabold uppercase tracking-wider text-acc">All categories <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></Link>} />
          </Reveal>
          <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
            {categories.filter((c) => !c.parent_id && c.active).map((c, i) => {
              const count = active.filter((p) => p.category_id === c.id || categories.some((sub) => sub.parent_id === c.id && sub.id === p.category_id)).length;
              return (
                <Reveal key={c.id} delay={i * 60} className="w-56 shrink-0 sm:w-64">
                  <Link to={`/shop?cat=${c.slug}`} className="group block">
                    <div className="relative aspect-[5/4] overflow-hidden rounded-xl border border-line">
                      <div className="h-full w-full transition-transform duration-700 group-hover:scale-[1.07]"><PImg src={c.image} alt={c.name} /></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-pine-950/70 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-4">
                        <div>
                          <p className="font-display text-[15px] font-bold text-paper">{c.name}</p>
                          <p className="text-[11px] font-bold text-paper/60">{count} products</p>
                        </div>
                        <span className="flex size-8 items-center justify-center rounded-full bg-lime text-pine-900 transition-transform duration-300 group-hover:rotate-45"><ArrowUpRight size={16} /></span>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      {/* ---------- new arrivals + best sellers ---------- */}
      <section className="mt-20 grid gap-14 lg:grid-cols-2 lg:gap-10">
        <div>
          <Reveal><SectionHead kicker="Just landed" title="New arrivals" /></Reveal>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8">
            {fresh.map((p, i) => <Reveal key={p.id} delay={i * 60}><ProductCard product={p} index={i} /></Reveal>)}
          </div>
        </div>
        <div>
          <Reveal><SectionHead kicker="Most loved" title="Best sellers" /></Reveal>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8">
            {best.map((p, i) => <Reveal key={p.id} delay={i * 60}><ProductCard product={p} index={i} /></Reveal>)}
          </div>
        </div>
      </section>

      {/* ---------- special offers strip ---------- */}
      {offers.length > 0 && (
        <section className="mt-20">
          <Reveal><SectionHead kicker="Marked down" title="Special offers" /></Reveal>
          <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
            {offers.map((p) => (
              <Link key={p.id} to={`/product/${p.slug}`} className="group w-72 shrink-0 overflow-hidden rounded-xl border border-line bg-card transition-shadow hover:shadow-lg">
                <div className="flex">
                  <div className="relative w-28 shrink-0">
                    <PImg src={p.image} hue={p.hue} alt={p.name} />
                    <span className="absolute left-2 top-2 rounded bg-acc px-1.5 py-0.5 text-[10px] font-extrabold text-acc-ink">−{discountPct(p.price, p.sale_price!)}%</span>
                  </div>
                  <div className="flex flex-col justify-center gap-1 p-4">
                    <p className="font-display text-[13px] font-semibold leading-snug group-hover:text-acc transition-colors">{p.name}</p>
                    <p className="text-[13px] font-bold text-acc">{fmt(p.sale_price!)} <span className="ml-1 text-[11px] font-semibold text-ink3 line-through">{fmt(p.price)}</span></p>
                    <p className="text-[11px] font-bold text-ink3">{p.sold} sold</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---------- reviews ---------- */}
      {website?.showReviews && approved.length > 0 && (
        <section className="mt-20">
          <Reveal><SectionHead kicker="Word of mouth" title="What customers say" /></Reveal>
          <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
            {approved.map((r, i) => {
              const p = products.find((x) => x.id === r.product_id);
              return (
                <Reveal key={r.id} delay={i * 60} className="w-80 shrink-0">
                  <figure className="flex h-full flex-col rounded-xl border border-line bg-card p-6 transition-shadow hover:shadow-lg">
                    <Stars rating={r.rating} />
                    <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink2">“{r.text}”</blockquote>
                    <figcaption className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                      <span className="flex size-9 items-center justify-center rounded-full bg-acc-soft font-display text-[12px] font-bold text-acc">{r.customer.split(' ').map((w) => w[0]).join('')}</span>
                      <div>
                        <p className="text-[13px] font-extrabold">{r.customer}</p>
                        <p className="text-[11px] font-semibold text-ink3">on {p?.name ?? 'a product'}</p>
                      </div>
                    </figcaption>
                  </figure>
                </Reveal>
              );
            })}
          </div>
        </section>
      )}

      {/* ---------- newsletter + final CTA ---------- */}
      {website?.showNewsletter && (
        <section className="mt-20">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl border border-line bg-card">
              <div className="grid lg:grid-cols-2">
                <div className="dotgrid p-8 sm:p-12">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-acc">The dispatch</p>
                  <h2 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-3xl">10% off your first order, plus first dibs on drops.</h2>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink2">One email a month. New objects, restocks, and the occasional archive sale. Unsubscribe anytime.</p>
                </div>
                <div className="flex items-center bg-pine-900 p-8 sm:p-12">
                  {subscribed ? (
                    <div className="pop-in flex items-center gap-4 text-paper">
                      <span className="flex size-12 items-center justify-center rounded-full bg-lime text-pine-900"><Check size={22} /></span>
                      <div>
                        <p className="font-display text-lg font-bold">You're on the list.</p>
                        <p className="text-sm text-paper/60">Your 10% code is on its way to {email}.</p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={subscribe} className="w-full">
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="inp flex-1 border-transparent bg-paper py-3.5" />
                        <Btn type="submit" variant="lime" size="lg">Subscribe</Btn>
                      </div>
                      <p className="mt-3 text-[11px] font-semibold text-paper/45">No spam, ever. Read by 12,000+ people.</p>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      <section className="mt-20 text-center">
        <Reveal>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-acc">Ready when you are</p>
          <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-bold leading-tight sm:text-5xl">The right object changes the whole room.</h2>
          <Link to="/shop" className="mt-8 inline-block">
            <Btn size="lg" className="group px-10">Start browsing <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Btn>
          </Link>
        </Reveal>
      </section>
    </div>
  );
}

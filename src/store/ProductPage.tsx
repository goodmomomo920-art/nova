import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, Heart, Minus, Plus, RotateCcw, ShoppingBag, Star, Truck, Zap } from 'lucide-react';
import { useApp } from '../lib/store';
import { Price, ProductCard, PImg, QtyPicker, Reveal, SectionHead, Stars } from '../components/bits';
import { Btn, Empty, Field, Tabs } from '../components/ui';
import { cn, discountPct, timeAgo, uid } from '../lib/utils';

export default function ProductPage() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { products, categories, reviews, addToCart, toggleWish, wishlist, customer, upsert, notify, toast, fmt, settings } = useApp();
  const freeOver = settings?.freeShipThreshold ?? 150;

  const product = products.find((p) => (p.slug === slug || p.id === slug) && p.active);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('desc');
  const [rRating, setRRating] = useState(5);
  const [rText, setRText] = useState('');
  const [sending, setSending] = useState(false);

  const variant = product?.variants.find((v) => v.id === variantId);
  const effHue = variant?.hue ?? product?.hue;
  const unit = product ? (product.sale_price ?? product.price) + (variant?.priceDelta ?? 0) : 0;
  const wished = product ? wishlist.includes(product.id) : false;
  const cat = categories.find((c) => c.id === product?.category_id);
  const prodReviews = useMemo(() => reviews.filter((r) => r.product_id === product?.id && r.status === 'approved'), [reviews, product]);
  const related = useMemo(() => products.filter((p) => p.active && p.category_id === product?.category_id && p.id !== product?.id).slice(0, 4), [products, product]);

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24">
        <Empty title="Product not found" body="It may have been removed from the catalogue or the link is out of date."
          action={<Link to="/shop"><Btn>Back to shop</Btn></Link>} />
      </div>
    );
  }

  const out = product.stock <= 0;
  const low = !out && product.stock <= product.lowStockThreshold;

  const thumbs: { id: string | null; label: string; hue?: number }[] = [
    { id: null, label: 'Base', hue: product.hue },
    ...product.variants.filter((v) => v.hue !== undefined).map((v) => ({ id: v.id, label: v.value, hue: v.hue })),
  ];

  const buy = () => {
    addToCart(product.id, qty, variantId ?? undefined);
    nav('/checkout');
  };

  const submitReview = (e: FormEvent) => {
    e.preventDefault();
    if (rText.trim().length < 10) { toast('Please write at least a sentence or two', 'err'); return; }
    setSending(true);
    window.setTimeout(() => {
      upsert('reviews', {
        id: uid(), store_id: product.store_id, product_id: product.id,
        customer: customer?.name ?? 'Guest shopper', rating: rRating, text: rText.trim(),
        date: new Date().toISOString(), status: 'pending',
      });
      notify('review', 'New review awaiting approval', `${customer?.name ?? 'Guest'} left ${rRating} stars on ${product.name}.`);
      setRText(''); setSending(false);
      toast('Review submitted — it will appear once approved');
    }, 600);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="mb-6 flex items-center gap-2 text-[12px] font-bold text-ink3">
        <Link to="/" className="hover:text-acc">Home</Link> / <Link to="/shop" className="hover:text-acc">Shop</Link> /
        {cat && <><Link to={`/shop?cat=${cat.slug}`} className="hover:text-acc">{cat.name}</Link> /</>}
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* gallery */}
        <Reveal>
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-[#e9e8df]">
            <PImg key={effHue ?? 'base'} src={product.image} hue={effHue} alt={product.name} />
            <div className="absolute left-4 top-4 flex gap-2">
              {product.isNew && <span className="rounded-md bg-lime px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-pine-900">New</span>}
              {product.sale_price != null && <span className="rounded-md bg-acc px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-acc-ink">Save {discountPct(product.price, product.sale_price)}%</span>}
            </div>
          </div>
          {thumbs.length > 1 && (
            <div className="mt-3 flex gap-3">
              {thumbs.map((t) => (
                <button key={t.label} onClick={() => setVariantId(t.id)} aria-label={t.label}
                  className={cn('size-20 overflow-hidden rounded-lg border-2 transition-all cursor-pointer', (variantId ?? null) === t.id ? 'border-acc' : 'border-line hover:border-line2')}>
                  <PImg src={product.image} hue={t.hue} alt={t.label} />
                </button>
              ))}
            </div>
          )}
        </Reveal>

        {/* info */}
        <Reveal delay={100}>
          <Link to={`/shop?cat=${cat?.slug}`} className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-acc hover:underline">{cat?.name}</Link>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">{product.name}</h1>
          <a href="#reviews" onClick={(e) => { e.preventDefault(); setTab('reviews'); document.getElementById('tabs')?.scrollIntoView({ behavior: 'smooth' }); }} className="mt-3 inline-flex items-center gap-2 text-[13px] font-bold text-ink2 hover:text-acc">
            <Stars rating={product.rating} /> {product.rating.toFixed(1)} · {product.ratingCount + prodReviews.length} reviews
          </a>
          <div className="mt-5"><Price product={product} big /></div>
          {variant && <p className="mt-1 text-[12px] font-bold text-ink3">Variant: {variant.label} — {variant.value}{variant.priceDelta > 0 && ` (+${fmt(variant.priceDelta)})`}</p>}
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ink2">{product.description}</p>

          {product.variants.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-[12px] font-extrabold uppercase tracking-wider text-ink2">{product.variants[0].label}</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => {
                  const vOut = v.stock <= 0;
                  return (
                    <button key={v.id} disabled={vOut} onClick={() => setVariantId(variantId === v.id ? null : v.id)}
                      className={cn('rounded-lg border px-4 py-2 text-[13px] font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40',
                        variantId === v.id ? 'border-acc bg-acc text-acc-ink' : vOut ? 'border-line text-ink3 line-through' : 'border-line2 bg-card hover:border-acc hover:text-acc')}>
                      {v.value}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-5">
            {out ? (
              <p className="inline-flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-1.5 text-[13px] font-extrabold text-danger"><Minus size={14} /> Out of stock</p>
            ) : low ? (
              <p className="inline-flex items-center gap-2 rounded-lg bg-warn-soft px-3 py-1.5 text-[13px] font-extrabold text-warn"><Zap size={14} /> Only {product.stock} left — selling fast</p>
            ) : (
              <p className="inline-flex items-center gap-2 rounded-lg bg-moss-100 px-3 py-1.5 text-[13px] font-extrabold text-moss-700"><Check size={14} /> In stock, ships in 24h</p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <QtyPicker qty={qty} onChange={setQty} max={Math.max(1, product.stock)} />
            <Btn size="lg" disabled={out} onClick={() => addToCart(product.id, qty, variantId ?? undefined)} className="min-w-[170px] flex-1 sm:flex-none">
              <ShoppingBag size={17} /> Add to cart — {fmt(unit * qty)}
            </Btn>
            <Btn size="lg" variant="dark" disabled={out} onClick={buy}>Buy now</Btn>
            <button onClick={() => toggleWish(product.id)} aria-label="Wishlist"
              className={cn('flex size-12 items-center justify-center rounded-lg border transition-all cursor-pointer', wished ? 'border-acc bg-acc text-acc-ink' : 'border-line2 bg-card text-ink2 hover:border-acc hover:text-acc')}>
              <Heart size={19} className={wished ? 'fill-current' : ''} />
            </button>
          </div>

          <div className="mt-8 grid gap-3 rounded-xl border border-line bg-card p-5 text-[13px] font-semibold text-ink2 sm:grid-cols-3">
            <span className="flex items-center gap-2.5"><Truck size={17} className="text-acc" /> Free shipping over {fmt(freeOver)}</span>
            <span className="flex items-center gap-2.5"><RotateCcw size={17} className="text-acc" /> 30-day easy returns</span>
            <span className="flex items-center gap-2.5"><Check size={17} className="text-acc" /> Lifetime repairs</span>
          </div>
          <p className="mt-4 text-[12px] font-semibold text-ink3">SKU {product.sku}{product.tags.length > 0 && <> · {product.tags.map((t) => `#${t}`).join('  ')}</>}</p>
        </Reveal>
      </div>

      {/* tabs */}
      <div id="tabs" className="mt-16">
        <Tabs active={tab} onChange={setTab} tabs={[
          { id: 'desc', label: 'Description' },
          { id: 'reviews', label: `Reviews (${prodReviews.length})` },
          { id: 'ship', label: 'Shipping & returns' },
        ]} />
        <div className="py-8">
          {tab === 'desc' && (
            <div className="max-w-2xl space-y-4 text-[15px] leading-relaxed text-ink2">
              <p>{product.description}</p>
              <p>Every {product.name} leaves our Portland warehouse checked by hand, wrapped in plastic-free packaging, and covered by our two-year warranty. If it ever fails under normal use, we repair or replace it — no receipts hunt, no drama.</p>
              <ul className="space-y-2">
                {product.tags.map((t) => (
                  <li key={t} className="flex items-center gap-2.5 text-[14px] font-semibold"><Check size={15} className="text-acc" /> <span className="capitalize">{t.replace(/-/g, ' ')}</span></li>
                ))}
              </ul>
            </div>
          )}
          {tab === 'ship' && (
            <div className="max-w-2xl space-y-4 text-[15px] leading-relaxed text-ink2">
              <p><strong className="text-ink">Shipping.</strong> Standard delivery takes 3–5 business days and is free on orders over {fmt(freeOver)}. Express (1–2 days) is available at checkout.</p>
              <p><strong className="text-ink">Returns.</strong> Changed your mind? Send it back within 30 days in any condition and we'll refund you in full — we'll even email you the label.</p>
              <p><strong className="text-ink">Repairs.</strong> Every product is covered by lifetime repairs. Email our workshop and we'll take it from there.</p>
            </div>
          )}
          {tab === 'reviews' && (
            <div id="reviews" className="grid gap-10 lg:grid-cols-[1fr_380px]">
              <div>
                {prodReviews.length === 0 ? (
                  <Empty title="No reviews yet" body="Be the first to tell other shoppers what you think of this product." />
                ) : (
                  <div className="space-y-5">
                    {prodReviews.map((r) => (
                      <div key={r.id} className="rounded-xl border border-line bg-card p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 items-center justify-center rounded-full bg-acc-soft font-display text-[12px] font-bold text-acc">{r.customer.split(' ').map((w) => w[0]).join('')}</span>
                            <div>
                              <p className="text-[13px] font-extrabold">{r.customer}</p>
                              <p className="text-[11px] font-semibold text-ink3">{timeAgo(r.date)}</p>
                            </div>
                          </div>
                          <Stars rating={r.rating} />
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-ink2">{r.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <form onSubmit={submitReview} className="sticky top-24 rounded-xl border border-line bg-card p-6">
                  <h3 className="font-display text-base font-semibold">Write a review</h3>
                  <p className="mt-1 text-[12px] font-semibold text-ink3">{customer ? `Reviewing as ${customer.name}` : 'Reviewing as a guest — sign in to attach it to your account'}</p>
                  <div className="mt-4">
                    <p className="mb-1.5 text-[12px] font-bold">Your rating</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button type="button" key={i} onClick={() => setRRating(i)} aria-label={`${i} stars`} className="cursor-pointer">
                          <Star size={24} className={i <= rRating ? 'fill-[#e0a53a] text-[#e0a53a]' : 'fill-line2 text-line2'} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <Field label="Your review" className="mt-4">
                    <textarea value={rText} onChange={(e) => setRText(e.target.value)} rows={4} className="inp resize-none" placeholder="What did you love — or not?" />
                  </Field>
                  <Btn type="submit" loading={sending} className="mt-4 w-full">Submit review</Btn>
                  <p className="mt-2.5 text-[11px] font-semibold text-ink3">Reviews are moderated before publishing.</p>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* related */}
      {related.length > 0 && (
        <section className="mt-14">
          <SectionHead kicker="Pairs well with" title="You may also like" />
          <div className="grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-4">
            {related.map((p, i) => <Reveal key={p.id} delay={i * 60}><ProductCard product={p} index={i} /></Reveal>)}
          </div>
        </section>
      )}
    </div>
  );
}

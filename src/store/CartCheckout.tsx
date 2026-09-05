import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, BadgePercent, Banknote, Check, CreditCard, Lock, PackageCheck, ShoppingBag, Smartphone, Trash2, Wallet, X } from 'lucide-react';
import { useApp } from '../lib/store';
import { PImg, Reveal } from '../components/bits';
import { Btn, Empty, Field, StatusBadge } from '../components/ui';
import { cn, clamp } from '../lib/utils';

const PAY_ICONS: Record<string, typeof CreditCard> = { card: CreditCard, paypal: Wallet, applepay: Smartphone, cod: Banknote };

/* ================================ CART ================================ */

export function CartPage() {
  const { cartLines, cartSubtotal, setCartQty, removeLine, applyCoupon, fmt, settings } = useApp();
  const nav = useNavigate();
  const [code, setCode] = useState('');
  const [coupon, setCoupon] = useState<{ code: string; amount: number; kind: 'order' | 'shipping' } | null>(null);
  const [couponErr, setCouponErr] = useState('');

  const threshold = settings?.freeShipThreshold ?? 150;
  const std = settings?.shipping.find((s) => s.name === 'Standard');
  const baseShip = std ? (cartSubtotal >= threshold ? 0 : std.fee) : 0;
  const shipCost = coupon?.kind === 'shipping' ? 0 : baseShip;
  const discount = coupon?.kind === 'order' ? coupon.amount : 0;
  const total = cartSubtotal - discount + shipCost;

  const apply = () => {
    const res = applyCoupon(code, cartSubtotal);
    if (!res.ok) { setCoupon(null); setCouponErr(res.error ?? 'Invalid code'); return; }
    setCoupon({ code: res.code!, amount: res.amount ?? 0, kind: res.kind! });
    setCouponErr('');
  };

  if (cartLines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24">
        <Empty icon={<ShoppingBag size={24} />} title="Your cart is empty" body="Everything you add ends up here. Start with the best sellers — they're best sellers for a reason."
          action={<Link to="/shop"><Btn size="lg">Browse the shop</Btn></Link>} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Reveal>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Cart</h1>
        <p className="mt-2 text-sm font-semibold text-ink3">{cartLines.length} line{cartLines.length > 1 ? 's' : ''} · review below, then check out</p>
      </Reveal>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {cartLines.map((l) => (
            <div key={l.item.key} className="pop-in flex gap-4 rounded-xl border border-line bg-card p-4">
              <Link to={`/product/${l.product.slug}`} className="size-24 shrink-0 overflow-hidden rounded-lg sm:size-28">
                <PImg src={l.product.image} hue={l.item.variantId ? l.variant?.hue : l.product.hue} alt={l.product.name} />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link to={`/product/${l.product.slug}`} className="block truncate font-display text-[14px] font-semibold hover:text-acc">{l.product.name}</Link>
                    <p className="mt-0.5 text-[12px] font-semibold text-ink3">
                      {l.variant ? `${l.variant.label}: ${l.variant.value} · ` : ''}{fmt(l.unit)} each
                      {l.product.sale_price != null && <span className="ml-1.5 text-acc">sale</span>}
                    </p>
                  </div>
                  <button onClick={() => removeLine(l.item.key)} aria-label="Remove" className="text-ink3 transition-colors hover:text-danger cursor-pointer"><Trash2 size={17} /></button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="inline-flex items-center rounded-lg border border-line2">
                    <button onClick={() => setCartQty(l.item.key, l.item.qty - 1)} className="flex size-8 items-center justify-center text-ink2 hover:text-ink cursor-pointer" aria-label="Decrease">−</button>
                    <span className="w-8 text-center text-[13px] font-bold tabular-nums">{l.item.qty}</span>
                    <button onClick={() => setCartQty(l.item.key, Math.min(l.product.stock, l.item.qty + 1))} className="flex size-8 items-center justify-center text-ink2 hover:text-ink cursor-pointer" aria-label="Increase">+</button>
                  </div>
                  <p className="font-display text-[15px] font-bold">{fmt(l.line)}</p>
                </div>
              </div>
            </div>
          ))}
          <Link to="/shop" className="inline-flex items-center gap-1.5 text-[13px] font-extrabold uppercase tracking-wider text-acc hover:underline">
            <ArrowRight size={15} className="rotate-180" /> Continue shopping
          </Link>
        </div>

        <div>
          <div className="sticky top-24 rounded-xl border border-line bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Order summary</h2>
            <div className="mt-4">
              <div className="flex gap-2">
                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Coupon code" className="inp flex-1 uppercase" />
                <Btn variant="dark" onClick={apply}><BadgePercent size={16} /> Apply</Btn>
              </div>
              {couponErr && <p className="mt-2 text-[12px] font-bold text-danger">{couponErr}</p>}
              {coupon && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-moss-100 px-2 py-1 text-[12px] font-extrabold text-moss-700">
                  <Check size={13} /> {coupon.code} applied {coupon.kind === 'shipping' ? '— free shipping' : `— saves ${fmt(coupon.amount)}`}
                  <button onClick={() => { setCoupon(null); setCode(''); }} className="ml-1 cursor-pointer"><X size={12} /></button>
                </p>
              )}
            </div>

            <div className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm font-semibold">
              <div className="flex justify-between text-ink2"><span>Subtotal</span><span className="text-ink">{fmt(cartSubtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-moss-700"><span>Discount ({coupon!.code})</span><span>−{fmt(discount)}</span></div>}
              <div className="flex justify-between text-ink2"><span>Shipping ({std?.name ?? 'Standard'})</span><span className={cn(shipCost === 0 ? 'text-moss-700' : 'text-ink')}>{shipCost === 0 ? 'Free' : fmt(shipCost)}</span></div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-extrabold"><span>Total</span><span className="font-display">{fmt(total)}</span></div>
            </div>

            {cartSubtotal < threshold && (
              <div className="mt-4 rounded-lg bg-paper p-3">
                <p className="text-[12px] font-bold text-ink2">Add {fmt(threshold - cartSubtotal)} more for free standard shipping</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-acc transition-all duration-500" style={{ width: `${clamp((cartSubtotal / threshold) * 100, 4, 100)}%` }} />
                </div>
              </div>
            )}

            <Btn size="lg" className="mt-5 w-full group" onClick={() => nav(coupon ? `/checkout?coupon=${coupon.code}` : '/checkout')}>
              Proceed to checkout <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Btn>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-bold text-ink3"><Lock size={12} /> Secure demo checkout — no real charge</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== CHECKOUT ============================== */

export function CheckoutPage() {
  const { cartLines, cartSubtotal, applyCoupon, placeOrder, settings, customer, fmt } = useApp();
  const nav = useNavigate();
  const [params] = useSearchParams();

  const [form, setForm] = useState({
    name: customer?.name ?? '', email: customer?.email ?? '', phone: customer?.phone ?? '',
    address: customer?.addresses[0]?.line1 ?? '', city: customer?.addresses[0]?.city ?? '', country: 'United States',
    card: '', exp: '', cvc: '',
  });
  const [shippingId, setShippingId] = useState(settings?.shipping.find((s) => s.enabled)?.id ?? '');
  const [paymentId, setPaymentId] = useState(settings?.payments.find((p) => p.enabled)?.id ?? 'card');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placing, setPlacing] = useState(false);

  const couponParam = params.get('coupon');
  const coupon = useMemo(() => {
    if (!couponParam) return null;
    const res = applyCoupon(couponParam, cartSubtotal);
    return res.ok ? { code: res.code!, amount: res.amount ?? 0, kind: res.kind! } : null;
  }, [couponParam, applyCoupon, cartSubtotal]);

  const method = settings?.shipping.find((s) => s.id === shippingId);
  const baseShip = method ? (method.freeOver != null && cartSubtotal >= method.freeOver ? 0 : method.fee) : 0;
  const shipCost = coupon?.kind === 'shipping' ? 0 : baseShip;
  const discount = coupon?.kind === 'order' ? coupon.amount : 0;
  const total = cartSubtotal - discount + shipCost;

  useEffect(() => {
    if (cartLines.length === 0 && !placing) nav('/cart', { replace: true });
  }, [cartLines.length, placing, nav]);

  if (cartLines.length === 0) return null;

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.email.includes('@')) errs.email = 'Valid email required';
    if (form.phone.trim().length < 6) errs.phone = 'Valid phone required';
    if (!form.address.trim()) errs.address = 'Required';
    if (!form.city.trim()) errs.city = 'Required';
    if (paymentId === 'card' && form.card.replace(/\s/g, '').length < 12) errs.card = 'Enter a card number (demo — any digits work)';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setPlacing(true);
    window.setTimeout(() => {
      const order = placeOrder({
        name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
        address: form.address.trim(), city: form.city.trim(), country: form.country,
        shippingId, paymentId, coupon: coupon?.code ?? null,
      });
      nav(`/order-success/${order.id}`, { replace: true });
    }, 900);
  };

  const inp = (k: keyof typeof form, ph: string, type = 'text') => (
    <div>
      <input value={form[k]} onChange={(e) => set(k, e.target.value)} placeholder={ph} type={type}
        className={cn('inp', errors[k] && 'border-danger focus:border-danger')} />
      {errors[k] && <p className="mt-1 text-[11px] font-bold text-danger">{errors[k]}</p>}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Reveal>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Checkout</h1>
        <p className="mt-2 text-sm font-semibold text-ink3">Almost there — one form between you and your order.</p>
      </Reveal>

      <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          <section className="rounded-xl border border-line bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2.5 font-display text-base font-semibold"><span className="flex size-7 items-center justify-center rounded-full bg-pine-900 font-sans text-[12px] font-extrabold text-lime">1</span> Contact information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">{inp('name', 'Ada Lovelace')}</Field>
              <Field label="Phone">{inp('phone', '+1 (555) 000-0000', 'tel')}</Field>
              <Field label="Email" className="sm:col-span-2">{inp('email', 'ada@example.com', 'email')}</Field>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2.5 font-display text-base font-semibold"><span className="flex size-7 items-center justify-center rounded-full bg-pine-900 font-sans text-[12px] font-extrabold text-lime">2</span> Shipping address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Street address" className="sm:col-span-2">{inp('address', '2210 Alder Street, Apt 4')}</Field>
              <Field label="City">{inp('city', 'Portland')}</Field>
              <Field label="Country">
                <select value={form.country} onChange={(e) => set('country', e.target.value)} className="inp cursor-pointer">
                  {['United States', 'Canada', 'United Kingdom', 'Germany', 'Australia'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2.5 font-display text-base font-semibold"><span className="flex size-7 items-center justify-center rounded-full bg-pine-900 font-sans text-[12px] font-extrabold text-lime">3</span> Shipping method</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {(settings?.shipping ?? []).filter((s) => s.enabled).map((s) => {
                const fee = s.freeOver != null && cartSubtotal >= s.freeOver ? 0 : s.fee;
                return (
                  <button type="button" key={s.id} onClick={() => setShippingId(s.id)}
                    className={cn('rounded-xl border-2 p-4 text-left transition-all cursor-pointer', shippingId === s.id ? 'border-acc bg-acc-soft' : 'border-line hover:border-line2')}>
                    <p className="flex items-center justify-between text-[14px] font-extrabold">{s.name}<span className={cn(fee === 0 ? 'text-moss-700' : '')}>{fee === 0 ? 'Free' : fmt(fee)}</span></p>
                    <p className="mt-1 text-[12px] font-semibold text-ink3">{s.eta}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-line bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2.5 font-display text-base font-semibold"><span className="flex size-7 items-center justify-center rounded-full bg-pine-900 font-sans text-[12px] font-extrabold text-lime">4</span> Payment method</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(settings?.payments ?? []).filter((p) => p.enabled).map((p) => {
                const Icon = PAY_ICONS[p.id] ?? CreditCard;
                return (
                  <button type="button" key={p.id} onClick={() => setPaymentId(p.id)}
                    className={cn('flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all cursor-pointer', paymentId === p.id ? 'border-acc bg-acc-soft' : 'border-line hover:border-line2')}>
                    <Icon size={20} className={paymentId === p.id ? 'text-acc' : 'text-ink2'} />
                    <span>
                      <span className="block text-[14px] font-extrabold">{p.name}</span>
                      <span className="block text-[12px] font-semibold text-ink3">{p.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {paymentId === 'card' && (
              <div className="pop-in mt-4 grid gap-4 rounded-xl bg-paper p-4 sm:grid-cols-[2fr_1fr_1fr]">
                <Field label="Card number">{inp('card', '4242 4242 4242 4242')}</Field>
                <Field label="Expiry">{inp('exp', 'MM / YY')}</Field>
                <Field label="CVC">{inp('cvc', '123')}</Field>
              </div>
            )}
            <p className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-ink3"><Lock size={12} /> Demo payment — structure ready for a real provider, nothing is charged.</p>
          </section>
        </div>

        {/* summary */}
        <div>
          <div className="sticky top-24 rounded-xl border border-line bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Your order</h2>
            <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
              {cartLines.map((l) => (
                <div key={l.item.key} className="flex items-center gap-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg">
                    <PImg src={l.product.image} hue={l.item.variantId ? l.variant?.hue : l.product.hue} alt={l.product.name} />
                    <span className="absolute -right-0 -top-0 flex size-5 items-center justify-center rounded-bl-lg bg-pine-900 text-[10px] font-extrabold text-paper">{l.item.qty}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold">{l.product.name}</p>
                    <p className="text-[11px] font-semibold text-ink3">{l.variant ? `${l.variant.value} · ` : ''}{fmt(l.unit)}</p>
                  </div>
                  <p className="text-[13px] font-extrabold">{fmt(l.line)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2.5 border-t border-line pt-4 text-sm font-semibold">
              <div className="flex justify-between text-ink2"><span>Subtotal</span><span className="text-ink">{fmt(cartSubtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-moss-700"><span>Coupon {coupon!.code}</span><span>−{fmt(discount)}</span></div>}
              <div className="flex justify-between text-ink2"><span>Shipping — {method?.name}</span><span className={cn(shipCost === 0 ? 'text-moss-700' : 'text-ink')}>{shipCost === 0 ? 'Free' : fmt(shipCost)}</span></div>
              <div className="flex justify-between border-t border-line pt-3 text-base font-extrabold"><span>Total</span><span className="font-display">{fmt(total)}</span></div>
            </div>
            <Btn type="submit" size="lg" loading={placing} className="mt-5 w-full">
              {placing ? 'Placing order…' : `Place order — ${fmt(total)}`}
            </Btn>
            <p className="mt-3 text-center text-[11px] font-bold text-ink3">By placing this order you agree to our terms. 30-day returns on everything.</p>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ============================ ORDER SUCCESS ============================ */

export function OrderSuccessPage() {
  const { id } = useParams();
  const { orders, fmt } = useApp();
  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24">
        <Empty icon={<PackageCheck size={24} />} title="Order not found" body="We couldn't find that order in this store."
          action={<Link to="/shop"><Btn>Back to shop</Btn></Link>} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="pop-in text-center">
        <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-lime text-pine-900">
          <Check size={38} strokeWidth={3} />
        </span>
        <h1 className="mt-6 font-display text-3xl font-bold sm:text-4xl">Order confirmed</h1>
        <p className="mt-3 text-[15px] font-semibold text-ink2">
          Thanks, {order.customerName.split(' ')[0]}. Order <span className="font-extrabold text-ink">{order.number}</span> is in — a confirmation is on its way to {order.email}.
        </p>
        <div className="mt-3 flex justify-center"><StatusBadge status={order.status} /></div>
      </div>

      <div className="mt-10 overflow-hidden rounded-xl border border-line bg-card">
        <div className="space-y-3 border-b border-line p-6">
          {order.items.map((it, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="size-14 shrink-0 overflow-hidden rounded-lg"><PImg src={it.image} hue={it.hue} alt={it.name} /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold">{it.name}</p>
                <p className="text-[11px] font-semibold text-ink3">{it.variant ? `${it.variant} · ` : ''}Qty {it.qty}</p>
              </div>
              <p className="text-[13px] font-extrabold">{fmt(it.price * it.qty)}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-6 p-6 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-ink3">Shipping to</p>
            <p className="mt-2 text-sm font-bold">{order.customerName}</p>
            <p className="text-sm font-semibold text-ink2">{order.address}</p>
            <p className="text-sm font-semibold text-ink2">{order.city}, {order.country}</p>
            <p className="mt-2 text-[12px] font-bold text-ink3">{order.shippingMethod}</p>
          </div>
          <div className="space-y-2 text-sm font-semibold">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-ink3">Summary</p>
            <div className="flex justify-between text-ink2"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-moss-700"><span>Discount {order.coupon}</span><span>−{fmt(order.discount)}</span></div>}
            <div className="flex justify-between text-ink2"><span>Shipping</span><span>{order.shippingCost === 0 ? 'Free' : fmt(order.shippingCost)}</span></div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-extrabold"><span>Total</span><span className="font-display">{fmt(order.total)}</span></div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/account?tab=orders"><Btn variant="dark">Track it in My Orders</Btn></Link>
        <Link to="/shop"><Btn variant="outline">Continue shopping</Btn></Link>
      </div>
    </div>
  );
}

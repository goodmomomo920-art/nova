import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ChevronDown, LogOut, Mail, MapPin, Package, Phone, Send } from 'lucide-react';
import { useApp } from '../lib/store';
import { IMG } from '../lib/data';
import { ProductCard, PImg, Reveal } from '../components/bits';
import { Badge, Btn, Empty, Field, Modal, StatusBadge, Tabs } from '../components/ui';
import { cn, fmtDate, uid } from '../lib/utils';

/* ================================ AUTH ================================ */

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { login, signup, customer, toast } = useApp();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (customer) nav('/account', { replace: true }); }, [customer, nav]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    if (mode === 'signup') {
      if (name.trim().length < 2) { setErr('Please enter your full name.'); return; }
      if (pass.length < 6) { setErr('Password must be at least 6 characters.'); return; }
      if (pass !== pass2) { setErr('Passwords do not match.'); return; }
    }
    setBusy(true);
    window.setTimeout(() => {
      const res = mode === 'login' ? login(email, pass) : signup(name.trim(), email, pass);
      setBusy(false);
      if (res) { setErr(res); return; }
      nav('/account');
    }, 500);
  };

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-6xl gap-0 overflow-hidden rounded-2xl border border-line lg:grid-cols-2">
      <div className="darkgrid relative hidden flex-col justify-between bg-pine-900 p-10 text-paper lg:flex">
        <p className="font-display text-lg font-bold">NOVA<span className="text-lime">®</span></p>
        <div>
          <h2 className="font-display text-3xl font-bold leading-tight">One account.<br />Every order, tracked.</h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper/60">Faster checkout, saved addresses, order tracking, and a wishlist that follows you across devices.</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-paper/15">
          <div className="aspect-[16/9]"><PImg src={IMG.about} alt="Our workshop" /></div>
        </div>
      </div>

      <div className="flex items-center bg-card p-8 sm:p-12">
        <form onSubmit={submit} className="w-full max-w-sm">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-acc">{mode === 'login' ? 'Welcome back' : 'Join the store'}</p>
          <h1 className="mt-2 font-display text-2xl font-bold">{mode === 'login' ? 'Sign in' : 'Create your account'}</h1>
          <div className="mt-6 space-y-4">
            {mode === 'signup' && (
              <Field label="Full name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" className="inp" /></Field>
            )}
            <Field label="Email"><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" className="inp" /></Field>
            <Field label="Password" hint={mode === 'login' ? 'demo1234' : 'min. 6 characters'}>
              <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" type="password" className="inp" />
            </Field>
            {mode === 'signup' && (
              <Field label="Confirm password"><input value={pass2} onChange={(e) => setPass2(e.target.value)} placeholder="••••••••" type="password" className="inp" /></Field>
            )}
          </div>
          {err && <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-[13px] font-bold text-danger">{err}</p>}
          <Btn type="submit" size="lg" loading={busy} className="mt-6 w-full">
            {mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={16} />
          </Btn>
          <p className="mt-5 text-center text-[13px] font-semibold text-ink2">
            {mode === 'login' ? <>New here? <Link to="/signup" className="font-extrabold text-acc hover:underline">Create an account</Link></> : <>Already a member? <Link to="/login" className="font-extrabold text-acc hover:underline">Sign in</Link></>}
          </p>
          {mode === 'login' && (
            <button type="button" onClick={() => { setEmail('maya@demo.com'); setPass('demo1234'); toast('Demo credentials filled — press sign in', 'info'); }}
              className="mt-4 w-full rounded-lg border border-dashed border-line2 bg-paper px-3 py-2.5 text-[12px] font-bold text-ink2 transition-colors hover:border-acc hover:text-acc cursor-pointer">
              Use demo account — maya@demo.com / demo1234
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

/* ============================== ACCOUNT ============================== */

export function AccountPage() {
  const { customer, orders, wishlist, products, upsert, logout, toast, fmt, storeId } = useApp();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? 'profile';
  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [openOrder, setOpenOrder] = useState<string | null>(null);
  const [addrOpen, setAddrOpen] = useState(false);
  const [addr, setAddr] = useState({ label: 'Home', line1: '', city: '', country: 'United States', zip: '' });

  useEffect(() => { if (!customer) nav('/login', { replace: true }); }, [customer, nav]);
  if (!customer) return null;

  const myOrders = orders.filter((o) => o.customer_id === customer.id || o.email.toLowerCase() === customer.email.toLowerCase());
  const spent = myOrders.filter((o) => o.status !== 'cancelled').reduce((a, o) => a + o.total, 0);
  const wishProducts = products.filter((p) => wishlist.includes(p.id));

  const saveProfile = () => {
    upsert('customers', { ...customer, name: name.trim() || customer.name, phone });
    toast('Profile updated');
  };

  const addAddress = () => {
    if (!addr.line1.trim() || !addr.city.trim()) { toast('Street and city are required', 'err'); return; }
    upsert('customers', { ...customer, addresses: [...customer.addresses, { ...addr, id: uid() }] });
    setAddrOpen(false);
    setAddr({ label: 'Home', line1: '', city: '', country: 'United States', zip: '' });
    toast('Address saved');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-acc">Your space</p>
            <h1 className="mt-1 font-display text-3xl font-bold">Hey, {customer.name.split(' ')[0]}.</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-acc-soft text-acc">{myOrders.length} orders · {fmt(spent)} lifetime</Badge>
            <Btn variant="outline" size="sm" onClick={() => { logout(); nav('/'); }}><LogOut size={14} /> Sign out</Btn>
          </div>
        </div>
      </Reveal>

      <Tabs className="mt-8" active={tab} onChange={(t) => setParams({ tab: t }, { replace: true })} tabs={[
        { id: 'profile', label: 'Profile' },
        { id: 'orders', label: `My orders (${myOrders.length})` },
        { id: 'addresses', label: `Addresses (${customer.addresses.length})` },
        { id: 'wishlist', label: `Wishlist (${wishProducts.length})` },
      ]} />

      <div className="py-8">
        {tab === 'profile' && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-xl border border-line bg-card p-6">
              <h2 className="font-display text-base font-semibold">Personal details</h2>
              <div className="mt-4 space-y-4">
                <Field label="Full name"><input value={name} onChange={(e) => setName(e.target.value)} className="inp" /></Field>
                <Field label="Email" hint="used for sign-in"><input value={customer.email} disabled className="inp opacity-60" /></Field>
                <Field label="Phone"><input value={phone} onChange={(e) => setPhone(e.target.value)} className="inp" placeholder="+1 (555) 000-0000" /></Field>
                <Btn onClick={saveProfile}>Save changes</Btn>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-line bg-card p-6">
                <h2 className="font-display text-base font-semibold">At a glance</h2>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {[['Member since', fmtDate(customer.createdAt)], ['Store', storeId.toUpperCase()], ['Orders', String(myOrders.length)], ['Lifetime spend', fmt(spent)]].map(([l, v]) => (
                    <div key={l} className="rounded-lg bg-paper p-4">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink3">{l}</p>
                      <p className="mt-1 font-display text-[15px] font-bold">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-line bg-pine-900 p-6 text-paper">
                <h2 className="font-display text-base font-semibold text-lime">Demo note</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-paper/65">Accounts are stored locally per store tenant. Try the admin dashboard to see this exact customer appear under Customers → and their orders under Orders.</p>
                <Link to="/admin" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-extrabold text-lime hover:underline">Open admin dashboard <ArrowRight size={14} /></Link>
              </div>
            </div>
          </div>
        )}

        {tab === 'orders' && (
          myOrders.length === 0 ? (
            <Empty icon={<Package size={24} />} title="No orders yet" body="When you place an order it shows up here with live status tracking."
              action={<Link to="/shop"><Btn>Start shopping</Btn></Link>} />
          ) : (
            <div className="space-y-3">
              {myOrders.map((o) => (
                <div key={o.id} className="overflow-hidden rounded-xl border border-line bg-card">
                  <button onClick={() => setOpenOrder(openOrder === o.id ? null : o.id)} className="flex w-full flex-wrap items-center gap-3 px-5 py-4 text-left cursor-pointer hover:bg-paper/60 transition-colors">
                    <div className="flex -space-x-2">
                      {o.items.slice(0, 3).map((it, i) => (
                        <div key={i} className="size-11 overflow-hidden rounded-lg border-2 border-card"><PImg src={it.image} hue={it.hue} alt={it.name} /></div>
                      ))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-extrabold">{o.number} <span className="ml-1 font-semibold text-ink3">· {fmtDate(o.createdAt)}</span></p>
                      <p className="text-[12px] font-semibold text-ink3">{o.items.reduce((a, i) => a + i.qty, 0)} items · {o.shippingMethod}</p>
                    </div>
                    <StatusBadge status={o.status} />
                    <p className="font-display text-[15px] font-bold">{fmt(o.total)}</p>
                    <ChevronDown size={17} className={cn('text-ink3 transition-transform', openOrder === o.id && 'rotate-180')} />
                  </button>
                  {openOrder === o.id && (
                    <div className="pop-in space-y-2.5 border-t border-line bg-paper/50 px-5 py-4">
                      {o.items.map((it, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 text-[13px] font-semibold">
                          <span className="text-ink2">{it.qty}× {it.name}{it.variant ? ` (${it.variant})` : ''}</span>
                          <span>{fmt(it.price * it.qty)}</span>
                        </div>
                      ))}
                      <p className="pt-1 text-[12px] font-semibold text-ink3">Ships to: {o.address}, {o.city} · Payment: {o.payment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'addresses' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customer.addresses.map((a) => (
              <div key={a.id} className="rounded-xl border border-line bg-card p-5">
                <div className="flex items-center justify-between">
                  <Badge className="bg-acc-soft text-acc">{a.label}</Badge>
                  <button onClick={() => { upsert('customers', { ...customer, addresses: customer.addresses.filter((x) => x.id !== a.id) }); toast('Address removed', 'info'); }}
                    className="text-[11px] font-extrabold uppercase tracking-wider text-danger cursor-pointer hover:opacity-70">Remove</button>
                </div>
                <p className="mt-3 text-sm font-bold">{a.line1}</p>
                <p className="text-sm font-semibold text-ink2">{a.city}, {a.country} {a.zip}</p>
              </div>
            ))}
            <button onClick={() => setAddrOpen(true)} className="flex min-h-[130px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line2 text-ink3 transition-colors hover:border-acc hover:text-acc cursor-pointer">
              <MapPin size={22} /> <span className="text-[13px] font-extrabold">Add address</span>
            </button>
          </div>
        )}

        {tab === 'wishlist' && (
          wishProducts.length === 0 ? (
            <Empty title="Wishlist is empty" body="Tap the heart on any product to save it here."
              action={<Link to="/shop"><Btn>Browse products</Btn></Link>} />
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
              {wishProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )
        )}
      </div>

      <Modal open={addrOpen} onClose={() => setAddrOpen(false)} title="Add address"
        footer={<><Btn variant="outline" size="sm" onClick={() => setAddrOpen(false)}>Cancel</Btn><Btn size="sm" onClick={addAddress}>Save address</Btn></>}>
        <div className="space-y-4">
          <Field label="Label"><input value={addr.label} onChange={(e) => setAddr({ ...addr, label: e.target.value })} className="inp" placeholder="Home / Office" /></Field>
          <Field label="Street address"><input value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} className="inp" placeholder="2210 Alder Street" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="City"><input value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} className="inp" /></Field>
            <Field label="ZIP"><input value={addr.zip} onChange={(e) => setAddr({ ...addr, zip: e.target.value })} className="inp" /></Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ============================== CONTACT ============================== */

export function ContactPage() {
  const { website, toast } = useApp();
  const [f, setF] = useState({ name: '', email: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!f.email.includes('@') || f.message.trim().length < 5) { toast('Please fill in a valid email and message', 'err'); return; }
    setBusy(true);
    window.setTimeout(() => { setBusy(false); setSent(true); toast('Message sent — we reply within one business day'); }, 700);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Reveal>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-acc">Say hello</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Talk to a human.</h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink2">Questions about an order, a repair, or a product that's not quite right? Real people answer — usually within the day.</p>
      </Reveal>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        <Reveal>
          {sent ? (
            <div className="pop-in flex h-full flex-col items-center justify-center rounded-xl border border-line bg-card p-10 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-lime text-pine-900"><Send size={22} /></span>
              <h2 className="mt-4 font-display text-xl font-bold">Message received</h2>
              <p className="mt-2 text-sm font-semibold text-ink2">We'll get back to {f.email} within one business day.</p>
              <Btn variant="outline" className="mt-6" onClick={() => { setSent(false); setF({ name: '', email: '', message: '' }); }}>Send another</Btn>
            </div>
          ) : (
            <form onSubmit={submit} className="rounded-xl border border-line bg-card p-6 sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="inp" placeholder="Ada Lovelace" /></Field>
                <Field label="Email"><input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="inp" placeholder="you@example.com" /></Field>
              </div>
              <Field label="Message" className="mt-4">
                <textarea value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} rows={6} className="inp resize-none" placeholder="How can we help?" />
              </Field>
              <Btn type="submit" loading={busy} size="lg" className="mt-5">Send message <Send size={15} /></Btn>
            </form>
          )}
        </Reveal>
        <Reveal delay={100}>
          <div className="space-y-4">
            {[
              [Mail, 'Email', website?.contactEmail ?? ''],
              [Phone, 'Phone', website?.contactPhone ?? ''],
              [MapPin, 'Workshop', website?.contactAddress ?? ''],
            ].map(([I, t, v]) => {
              const Icon = I as typeof Mail;
              return (
                <div key={t as string} className="flex items-start gap-4 rounded-xl border border-line bg-card p-5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-acc-soft text-acc"><Icon size={18} /></span>
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink3">{t as string}</p>
                    <p className="mt-1 text-sm font-bold">{v as string}</p>
                  </div>
                </div>
              );
            })}
            <div className="overflow-hidden rounded-xl border border-line">
              <div className="aspect-[4/3]"><PImg src={IMG.about} alt="Our workshop" /></div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/* =============================== ABOUT =============================== */

export function AboutPage() {
  const { website } = useApp();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <Reveal>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-acc">Since 2019</p>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-5xl">{website?.aboutTitle ?? 'Built slow, made to last'}</h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ink2">{website?.aboutBody}</p>
          <div className="mt-8 grid max-w-md grid-cols-3 gap-4">
            {[['10-yr', 'design lifespan'], ['100%', 'plastic-free packaging'], ['4.8★', 'average review']].map(([v, l]) => (
              <div key={l} className="rounded-xl border border-line bg-card p-4">
                <p className="font-display text-lg font-bold text-acc">{v}</p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-ink3">{l}</p>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-line">
              <div className="aspect-[14/11]"><PImg src={IMG.about} alt="Packing an order" /></div>
            </div>
            <div className="floaty absolute -bottom-5 -left-3 rounded-xl border border-line bg-card px-5 py-3 shadow-xl sm:left-6">
              <p className="font-display text-[13px] font-bold">Every parcel, packed by hand</p>
              <p className="text-[11px] font-semibold text-ink3">Portland, Oregon</p>
            </div>
          </div>
        </Reveal>
      </div>

      <div className="mt-20 grid gap-5 sm:grid-cols-3">
        {[
          ['Test for a season', 'Nothing ships until our team has lived with it for months. If it annoys us, it never makes the shelf.'],
          ['Repair, don\'t replace', 'Lifetime repairs on everything we sell. Send it in, we fix it, it comes home.'],
          ['Small on purpose', 'Fifteen products, done properly, beats five hundred done adequately. The catalogue grows slowly.'],
        ].map(([t, b], i) => (
          <Reveal key={t} delay={i * 80}>
            <div className="h-full rounded-xl border border-line bg-card p-6 transition-shadow hover:shadow-lg">
              <p className="font-display text-[42px] font-bold leading-none text-line2">{String(i + 1).padStart(2, '0')}</p>
              <h3 className="mt-4 font-display text-lg font-semibold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink2">{b}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="darkgrid mt-20 rounded-2xl bg-pine-900 px-8 py-12 text-center text-paper">
          <h2 className="mx-auto max-w-xl font-display text-2xl font-bold leading-tight sm:text-3xl">Come see what slow commerce looks like.</h2>
          <Link to="/shop" className="mt-6 inline-block"><Btn variant="lime" size="lg" className="group">Browse the catalogue <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Btn></Link>
        </div>
      </Reveal>
    </div>
  );
}

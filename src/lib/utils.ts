export const cn = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);

/** Deterministic PRNG so demo data is stable between reseeds. */
export function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CUR: Record<string, string> = { USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB' };

export function money(n: number, currency = 'USD') {
  try {
    return new Intl.NumberFormat(CUR[currency] ?? 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

export const iso = (daysAgo: number, hour = 10, minute = 24) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const dayKey = (isoStr: string) => {
  const d = new Date(isoStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const fmtDate = (isoStr: string) =>
  new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const fmtDateTime = (isoStr: string) =>
  new Date(isoStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export const timeAgo = (isoStr: string) => {
  const s = Math.max(1, Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return fmtDate(isoStr);
};

export const discountPct = (price: number, sale: number) =>
  Math.round((1 - sale / price) * 100);

export const hueFilter = (hue?: number) =>
  hue ? { filter: `hue-rotate(${hue}deg) saturate(1.14)` } : undefined;

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);

export function lastNDays(n: number): { key: string; label: string; date: Date }[] {
  const out: { key: string; label: string; date: Date }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({
      key: dayKey(d.toISOString()),
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      date: d,
    });
  }
  return out;
}

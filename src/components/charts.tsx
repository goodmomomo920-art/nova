import { useRef, useState } from 'react';

/* Lightweight hand-rolled SVG charts — no chart lib needed. */

export function Spark({ data, stroke = 'var(--color-moss-600)', className }: { data: number[]; stroke?: string; className?: string }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const pts = data.map((v, i) => `${(i / Math.max(1, data.length - 1)) * 100},${30 - ((v - min) / (max - min || 1)) * 26 - 2}`).join(' ');
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={className ?? 'h-8 w-24'}>
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function AreaChart({ data, labels, height = 230, format = (n: number) => String(n), stroke = 'var(--color-moss-600)', fill = 'rgba(30,107,78,.13)' }: {
  data: number[]; labels: string[]; height?: number; format?: (n: number) => string; stroke?: string; fill?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const W = 640, H = height, pT = 16, pB = 26, pX = 6;
  const max = Math.max(...data, 1);
  const stepX = (W - pX * 2) / Math.max(1, data.length - 1);
  const pts = data.map((v, i) => [pX + i * stepX, pT + (H - pT - pB) * (1 - v / max)] as const);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = data.length ? `${line} L${pts[pts.length - 1][0].toFixed(1)},${H - pB} L${pts[0][0].toFixed(1)},${H - pB} Z` : '';
  const tickCount = Math.min(6, labels.length);
  const tickEvery = Math.max(1, Math.ceil(labels.length / tickCount));

  const onMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * W;
    setHover(Math.min(data.length - 1, Math.max(0, Math.round((x - pX) / stepX))));
  };

  const hp = hover != null ? pts[hover] : null;

  return (
    <div className="relative">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={pX} x2={W - pX} y1={pT + (H - pT - pB) * (1 - f)} y2={pT + (H - pT - pB) * (1 - f)} stroke="var(--color-line)" strokeDasharray="3 5" strokeWidth="1" />
        ))}
        {area && <path d={area} fill={fill} />}
        {data.length > 1 && <path d={line} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" className="draw-line" style={{ ['--len' as string]: 2400 }} />}
        {hp && (
          <g>
            <line x1={hp[0]} x2={hp[0]} y1={pT} y2={H - pB} stroke={stroke} strokeOpacity=".35" strokeWidth="1" />
            <circle cx={hp[0]} cy={hp[1]} r="5" fill="var(--color-card)" stroke={stroke} strokeWidth="2.5" />
          </g>
        )}
        {labels.map((l, i) => (i % tickEvery === 0 ? (
          <text key={i} x={pts[i][0]} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--color-ink3)" fontFamily="Manrope">{l}</text>
        ) : null))}
        <text x={W - pX} y={pT - 4} textAnchor="end" fontSize="11" fontWeight="700" fill="var(--color-ink2)" fontFamily="Manrope">{format(max)}</text>
      </svg>
      {hover != null && hp && (
        <div
          className="pointer-events-none absolute -top-1 rounded-lg bg-pine-900 px-3 py-1.5 text-xs font-bold text-paper shadow-lg"
          style={{ left: `${(hp[0] / W) * 100}%`, transform: 'translateX(-50%)' }}
        >
          <span className="mr-1.5 font-medium text-paper/60">{labels[hover]}</span>
          {format(data[hover])}
        </div>
      )}
    </div>
  );
}

export function BarChart({ data, labels, height = 200, format = (n: number) => String(n), color = 'var(--color-moss-600)' }: {
  data: number[]; labels: string[]; height?: number; format?: (n: number) => string; color?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = height, pB = 26, pT = 12;
  const max = Math.max(...data, 1);
  const bw = (W / data.length) * 0.62;
  const gap = W / data.length;
  const tickEvery = Math.max(1, Math.ceil(labels.length / 6));
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseLeave={() => setHover(null)}>
        {[0.5, 1].map((f) => (
          <line key={f} x1={0} x2={W} y1={pT + (H - pT - pB) * (1 - f)} y2={pT + (H - pT - pB) * (1 - f)} stroke="var(--color-line)" strokeDasharray="3 5" strokeWidth="1" />
        ))}
        {data.map((v, i) => {
          const h = Math.max(2, ((H - pT - pB) * v) / max);
          return (
            <g key={i} onMouseEnter={() => setHover(i)}>
              <rect x={i * gap + (gap - bw) / 2} y={pT} width={bw} height={H - pT - pB} fill="transparent" />
              <rect
                x={i * gap + (gap - bw) / 2} y={H - pB - h} width={bw} height={h} rx="4"
                fill={hover === i ? 'var(--color-pine-900)' : color}
                className="grow-bar transition-colors"
                style={{ animationDelay: `${i * 30}ms` }}
              />
              {i % tickEvery === 0 && (
                <text x={i * gap + gap / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--color-ink3)" fontFamily="Manrope">{labels[i]}</text>
              )}
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <div
          className="pointer-events-none absolute -top-1 rounded-lg bg-pine-900 px-3 py-1.5 text-xs font-bold text-paper shadow-lg"
          style={{ left: `${((hover + 0.5) / data.length) * 100}%`, transform: 'translateX(-50%)' }}
        >
          <span className="mr-1.5 font-medium text-paper/60">{labels[hover]}</span>
          {format(data[hover])}
        </div>
      )}
    </div>
  );
}

export const DONUT_COLORS = ['#1e6b4e', '#d9f25c', '#2b4bc0', '#c2492f', '#b57f17', '#3d4a5c', '#8c3a2b'];

export function Donut({ slices, size = 190, format = (n: number) => String(n) }: {
  slices: { label: string; value: number }[]; size?: number; format?: (n: number) => string;
}) {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const r = 40, C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <svg viewBox="0 0 100 100" style={{ width: size, height: size }} className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-line)" strokeWidth="13" />
        {slices.map((s, i) => {
          const frac = s.value / total;
          const el = (
            <circle
              key={s.label} cx="50" cy="50" r={r} fill="none"
              stroke={DONUT_COLORS[i % DONUT_COLORS.length]} strokeWidth="13"
              strokeDasharray={`${Math.max(0.5, frac * C - 1.5)} ${C}`}
              strokeDashoffset={-acc * C}
              strokeLinecap="butt"
              className="transition-all duration-700"
            />
          );
          acc += frac;
          return el;
        })}
        <text x="50" y="47" textAnchor="middle" className="rotate-90" transform-origin="50 50" fontSize="13" fontWeight="800" fill="var(--color-ink)" fontFamily="Unbounded">{format(total)}</text>
        <text x="50" y="60" textAnchor="middle" className="rotate-90" transform-origin="50 50" fontSize="7" fill="var(--color-ink3)" fontFamily="Manrope">total</text>
      </svg>
      <div className="min-w-[150px] flex-1 space-y-2">
        {slices.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2 text-[13px]">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
            <span className="flex-1 truncate font-semibold text-ink2">{s.label}</span>
            <span className="font-bold">{Math.round((s.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HBars({ items, format = (n: number) => String(n), color = 'var(--color-moss-600)' }: {
  items: { label: string; value: number; hint?: string }[]; format?: (n: number) => string; color?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-3.5">
      {items.map((it, i) => (
        <div key={it.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate font-semibold text-ink2">{it.label}</span>
            <span className="shrink-0 font-bold">{format(it.value)}{it.hint && <span className="ml-1.5 font-medium text-ink3">{it.hint}</span>}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-paper">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${(it.value / max) * 100}%`, background: i === 0 ? 'var(--color-pine-900)' : color, transitionDelay: `${i * 60}ms` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

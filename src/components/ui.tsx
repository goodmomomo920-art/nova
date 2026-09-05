import { useEffect, useState } from 'react';
import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { AlertTriangle, CheckCircle2, Info, Inbox, Loader2, Search, X } from 'lucide-react';
import { cn } from '../lib/utils';
import type { OrderStatus, PaymentStatus } from '../lib/types';
import { useApp } from '../lib/store';

/* ---------------- buttons ---------------- */

type BtnVariant = 'primary' | 'dark' | 'lime' | 'outline' | 'ghost' | 'danger' | 'soft';

const BTN: Record<BtnVariant, string> = {
  primary: 'bg-acc text-acc-ink hover-acc shadow-sm',
  dark: 'bg-pine-900 text-paper hover:bg-pine-800',
  lime: 'bg-lime text-pine-900 hover:bg-lime-2',
  outline: 'border border-line2 bg-card text-ink hover:border-ink3 hover:bg-paper',
  ghost: 'text-ink hover:bg-ink/5',
  danger: 'bg-danger text-white hover:bg-danger/85',
  soft: 'bg-acc-soft text-acc hover:bg-acc/20',
};

export function Btn({
  variant = 'primary', size = 'md', loading, className, children, disabled, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'xs' | 'sm' | 'md' | 'lg'; loading?: boolean }) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer whitespace-nowrap',
        size === 'xs' && 'text-xs px-2.5 py-1.5',
        size === 'sm' && 'text-[13px] px-3.5 py-2',
        size === 'md' && 'text-sm px-5 py-2.5',
        size === 'lg' && 'text-[15px] px-7 py-3.5',
        BTN[variant],
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}

export function IconBtn({ className, children, label, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label?: string }) {
  return (
    <button
      aria-label={label}
      className={cn('inline-flex items-center justify-center rounded-lg p-2 text-ink2 hover:text-ink hover:bg-ink/5 transition-colors cursor-pointer', className)}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ---------------- badges & status meta ---------------- */

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide', className)}>
      {children}
    </span>
  );
}

export const ORDER_META: Record<OrderStatus, { label: string; cls: string; dot: string }> = {
  pending: { label: 'Pending', cls: 'bg-warn-soft text-warn', dot: 'bg-warn' },
  confirmed: { label: 'Confirmed', cls: 'bg-cobalt-soft text-cobalt', dot: 'bg-cobalt' },
  processing: { label: 'Processing', cls: 'bg-acc-soft text-acc', dot: 'bg-acc' },
  shipped: { label: 'Shipped', cls: 'bg-[#dfe9f2] text-[#2b5a8c]', dot: 'bg-[#2b5a8c]' },
  delivered: { label: 'Delivered', cls: 'bg-moss-100 text-moss-700', dot: 'bg-moss-600' },
  cancelled: { label: 'Cancelled', cls: 'bg-danger-soft text-danger', dot: 'bg-danger' },
};

export const PAYMENT_META: Record<PaymentStatus, { label: string; cls: string }> = {
  pending: { label: 'Payment pending', cls: 'bg-warn-soft text-warn' },
  paid: { label: 'Paid', cls: 'bg-moss-100 text-moss-700' },
  failed: { label: 'Failed', cls: 'bg-danger-soft text-danger' },
  refunded: { label: 'Refunded', cls: 'bg-cobalt-soft text-cobalt' },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const m = ORDER_META[status];
  return (
    <Badge className={m.cls}>
      <span className={cn('size-1.5 rounded-full', m.dot)} />
      {m.label}
    </Badge>
  );
}

/* ---------------- form bits ---------------- */

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 flex items-baseline justify-between text-[12px] font-bold text-ink">
        {label}
        {hint && <span className="font-medium text-ink3">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function SearchInput({ value, onChange, placeholder, className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink3" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? 'Search…'} className="inp pl-9" />
    </div>
  );
}

export function Tgl({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 cursor-pointer', on ? 'bg-acc' : 'bg-line2')}
    >
      <span className={cn('absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200', on ? 'translate-x-[22px]' : 'translate-x-0.5')} />
    </button>
  );
}

/* ---------------- overlays ---------------- */

export function Modal({ open, onClose, title, children, wide, footer }: {
  open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; wide?: boolean; footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', fn); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-pine-950/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={onClose}>
      <div
        className={cn('pop-in flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-card shadow-2xl sm:rounded-xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="font-display text-[15px] font-semibold">{title}</h3>
          <IconBtn label="Close" onClick={onClose}><X size={18} /></IconBtn>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line bg-paper/60 px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}

export function Confirm({ open, onClose, onConfirm, title, body, confirmLabel = 'Delete', danger = true }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; body: string; confirmLabel?: string; danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={
        <>
          <Btn variant="outline" size="sm" onClick={onClose}>Keep it</Btn>
          <Btn variant={danger ? 'danger' : 'primary'} size="sm" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Btn>
        </>
      }>
      <div className="flex gap-3">
        <div className={cn('mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg', danger ? 'bg-danger-soft text-danger' : 'bg-warn-soft text-warn')}>
          <AlertTriangle size={17} />
        </div>
        <p className="text-sm leading-relaxed text-ink2">{body}</p>
      </div>
    </Modal>
  );
}

export function Drawer({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] bg-pine-950/50 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div
        className="pop-in absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-line bg-card shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="font-display text-[15px] font-semibold">{title}</h3>
          <IconBtn label="Close" onClick={onClose}><X size={18} /></IconBtn>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line bg-paper/60 px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  );
}

/* ---------------- misc ---------------- */

export function Empty({ title, body, action, icon }: { title: string; body: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line2 bg-card/60 px-6 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-paper text-ink3">
        {icon ?? <Inbox size={24} />}
      </div>
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink2">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Tabs({ tabs, active, onChange, className }: { tabs: { id: string; label: ReactNode }[]; active: string; onChange: (id: string) => void; className?: string }) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto no-scrollbar border-b border-line', className)}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'relative whitespace-nowrap px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer',
            active === t.id ? 'text-ink' : 'text-ink3 hover:text-ink2',
          )}
        >
          {t.label}
          {active === t.id && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-acc" />}
        </button>
      ))}
    </div>
  );
}

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-8 flex items-center justify-center gap-1.5">
      <Btn variant="outline" size="sm" disabled={page === 1} onClick={() => onChange(page - 1)}>Prev</Btn>
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            'size-9 rounded-lg text-sm font-bold transition-colors cursor-pointer',
            p === page ? 'bg-pine-900 text-paper' : 'text-ink2 hover:bg-ink/5',
          )}
        >
          {p}
        </button>
      ))}
      <Btn variant="outline" size="sm" disabled={page === pages} onClick={() => onChange(page + 1)}>Next</Btn>
    </div>
  );
}

export function Toaster() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'toast-in pointer-events-auto flex items-start gap-2.5 rounded-xl border bg-pine-900 px-4 py-3 text-sm font-semibold text-paper shadow-xl',
            t.kind === 'ok' && 'border-moss-600/40',
            t.kind === 'err' && 'border-danger/50',
            t.kind === 'info' && 'border-line2/30',
          )}
        >
          {t.kind === 'ok' && <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-lime" />}
          {t.kind === 'err' && <AlertTriangle size={17} className="mt-0.5 shrink-0 text-[#ff9c86]" />}
          {t.kind === 'info' && <Info size={17} className="mt-0.5 shrink-0 text-paper/70" />}
          <span className="flex-1 leading-snug">{t.msg}</span>
          <button onClick={() => dismissToast(t.id)} className="text-paper/50 hover:text-paper cursor-pointer" aria-label="Dismiss"><X size={15} /></button>
        </div>
      ))}
    </div>
  );
}

export function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}

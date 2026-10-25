import { cn } from '@/lib/format';

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, children, className, actions }: { title?: string; children: React.ReactNode; className?: string; actions?: React.ReactNode }) {
  return (
    <section className={cn('rounded-xl border border-zinc-200 bg-white p-5 shadow-sm', className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-semibold text-zinc-900">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, tone = 'default' }: { label: string; value: React.ReactNode; hint?: string; tone?: 'default' | 'gold' | 'burgundy' | 'green' }) {
  const tones = {
    default: 'text-zinc-900',
    gold: 'text-amber-600',
    burgundy: 'text-burgundy',
    green: 'text-emerald-700',
  };
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-zinc-600">{label}</p>
      <p className={cn('mt-1 text-3xl font-bold tabular-nums', tones[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-burgundy focus:ring-2 focus:ring-burgundy/20 focus:outline-none disabled:bg-zinc-100';

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-sm font-medium text-zinc-800">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={4} {...props} className={cn(inputCls, 'leading-relaxed', props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputCls, props.className)} />;
}

export function Checkbox({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-zinc-800">
      <input type="checkbox" {...props} className="h-4 w-4 rounded border-zinc-300 accent-burgundy" />
      {label}
    </label>
  );
}

export function Badge({ children, tone = 'zinc' }: { children: React.ReactNode; tone?: 'zinc' | 'green' | 'red' | 'amber' | 'blue' }) {
  const tones = {
    zinc: 'bg-zinc-100 text-zinc-700',
    green: 'bg-emerald-100 text-emerald-800',
    red: 'bg-red-100 text-red-800',
    amber: 'bg-amber-100 text-amber-800',
    blue: 'bg-sky-100 text-sky-800',
  };
  return <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', tones[tone])}>{children}</span>;
}

export const btn = {
  primary:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-burgundy px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-burgundy-light disabled:opacity-60',
  secondary:
    'inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 disabled:opacity-60',
  danger:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60',
  ghost: 'inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100 disabled:opacity-50',
};

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-zinc-200 text-sm [&_td]:px-4 [&_td]:py-2.5 [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-left [&_th]:font-semibold [&_th]:text-zinc-700 [&_thead]:bg-zinc-50 [&_tbody_tr]:border-t [&_tbody_tr]:border-zinc-100 [&_tbody_tr:hover]:bg-zinc-50/60">
        {children}
      </table>
    </div>
  );
}

export function Pagination({ page, totalPages, makeHref }: { page: number; totalPages: number; makeHref: (p: number) => string }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="mt-4 flex items-center justify-center gap-2 text-sm" aria-label="Phân trang">
      {page > 1 && <a className={btn.secondary} href={makeHref(page - 1)}>← Trước</a>}
      <span className="px-2 text-zinc-600">Trang {page}/{totalPages}</span>
      {page < totalPages && <a className={btn.secondary} href={makeHref(page + 1)}>Sau →</a>}
    </nav>
  );
}

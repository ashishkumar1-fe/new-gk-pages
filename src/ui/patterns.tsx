import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './icons';
import { Button, Kbd } from './primitives';

/* Page chrome from ratio-website/src/components/admin/shell.tsx (Page, PageHeader) and list.tsx (tabs, search, footer). */

export const PageLayout = ({ children, wide }: { children: ReactNode; wide?: boolean }) => (
  <div className="min-h-[calc(100vh-56px)] bg-a-page px-4 pb-28 pt-6 sm:px-8 lg:min-h-screen lg:pt-8">
    <div className={cn('flex flex-col gap-5', !wide && 'mx-auto max-w-[1400px]')}>{children}</div>
  </div>
);

export const PageHeader = ({
  title,
  icon,
  subtitle,
  badge,
  back,
  actions,
}: {
  title: string;
  icon?: IconName;
  subtitle?: ReactNode;
  badge?: ReactNode;
  back?: { label: string; onClick: () => void };
  actions?: ReactNode;
}) => (
  <div>
    {back && (
      <button
        type="button"
        onClick={back.onClick}
        className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-a-blue hover:underline"
      >
        <Icon name="back" size={14} /> {back.label}
      </button>
    )}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="flex min-w-0 items-center gap-2 text-2xl font-semibold text-a-ink-900 sm:text-4xl">
        {icon && <Icon name={icon} size={24} strokeWidth={1.8} />}
        <span className="min-w-0 truncate">{title}</span>
        {badge}
      </h1>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
    {subtitle && <div className="mt-1 text-base text-a-ink-500">{subtitle}</div>}
  </div>
);

export const TwoColumn = ({ main, aside }: { main: ReactNode; aside?: ReactNode }) => (
  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px]">
    <div className="flex min-w-0 flex-col gap-4">{main}</div>
    {aside && <aside className="flex min-w-0 flex-col gap-4">{aside}</aside>}
  </div>
);

/** View tabs: pill style, blue ring when on; counts optional. */
export const Tabs = ({
  items,
  value,
  onChange,
  trailing,
}: {
  items: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (id: string) => void;
  trailing?: ReactNode;
}) => (
  <div role="tablist" className="flex flex-wrap items-center gap-1">
    <div className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none]">
      {items.map((t) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={cn(
              'h-8 shrink-0 rounded px-3 text-base font-medium transition-[background,box-shadow] duration-120',
              on ? 'bg-white text-a-blue shadow-ring-accent' : 'text-a-ink-600 hover:bg-white',
            )}
          >
            {t.label}
            {t.count !== undefined && <span className="ml-1 text-xs font-normal tabular-nums text-a-ink-450">{t.count}</span>}
          </button>
        );
      })}
    </div>
    {trailing}
  </div>
);

/** Search box with debounce; Enter applies at once. Latest text always wins. */
export const SearchBox = ({
  value,
  onChange,
  placeholder,
  debounceMs = 300,
  label = 'Search',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  debounceMs?: number;
  label?: string;
}) => {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (draft === value) return;
    const t = setTimeout(() => onChange(draft), debounceMs);
    return () => clearTimeout(t);
  }, [draft]);
  return (
    <label className="a-ring flex h-9 min-w-[240px] flex-1 items-center gap-2 rounded bg-white px-3 transition-shadow duration-120">
      <Icon name="search" size={16} tone="faint" />
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onChange(draft)}
        placeholder={placeholder}
        aria-label={label}
        className="h-full min-w-0 flex-1 bg-transparent text-base text-a-ink-800 outline-none placeholder:text-a-ink-450"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="flex h-6 w-6 items-center justify-center rounded-sm text-a-ink-450 hover:bg-a-line-100"
        >
          <Icon name="x" size={14} />
        </button>
      )}
    </label>
  );
};

export const EmptyState = ({ title, body, action }: { title: string; body?: string; action?: ReactNode }) => (
  <div className="flex flex-col items-center px-6 py-14 text-center">
    <div className="text-md font-semibold text-a-ink-900">{title}</div>
    {body && <p className="mt-1 max-w-[360px] text-a-ink-500">{body}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="a-card flex flex-col items-center gap-2 py-10 text-center shadow-ring-critical">
    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-a-danger-bg text-a-danger">
      <Icon name="alert" size={18} />
    </span>
    <p className="text-base text-a-ink-800">{message}</p>
    {onRetry && (
      <Button variant="secondary" onClick={onRetry} icon="refresh">
        Retry
      </Button>
    )}
  </div>
);

/** Table footer pager: prev / next icon buttons + "1 – 50 of 120 results". */
export const Pagination = ({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (p: number) => void;
}) => {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex h-13 items-center gap-3 border-t border-a-line-100 px-3 text-sm text-a-ink-600">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-a-line-100 disabled:opacity-30"
      >
        <Icon name="left" />
      </button>
      <button
        type="button"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
        className="flex h-7 w-7 items-center justify-center rounded hover:bg-a-line-100 disabled:opacity-30"
      >
        <Icon name="chevron" />
      </button>
      <span className="tabular-nums">
        {total ? `${(page - 1) * pageSize + 1} – ${Math.min(total, page * pageSize)} of ${total} results` : '0 results'}
      </span>
    </div>
  );
};

/** Dark floating save bar: appears only while dirty or saving (design: product editor). */
export const SaveBar = ({
  dirty,
  saving,
  onSave,
  onDiscard,
  status,
  title,
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  status?: string;
  title?: string;
}) => {
  if (!dirty && !saving) return status ? <p className="text-xs text-a-ink-450">{status}</p> : null;
  return (
    <div className="sticky top-16 z-20 flex items-center justify-between gap-3 rounded-md bg-a-ink-900 px-4 py-2.5 text-white shadow-lg lg:top-3">
      <span className="text-base font-medium">{saving ? 'Saving…' : (title ?? 'Unsaved changes')}</span>
      <span className="flex gap-2">
        <button
          type="button"
          onClick={onDiscard}
          disabled={saving}
          className="h-7 rounded px-2.5 text-base text-white/80 hover:bg-white/10 disabled:opacity-40"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="h-7 rounded bg-white px-2.5 text-base font-medium text-a-ink-900 hover:bg-a-blue-100 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </span>
    </div>
  );
};

export const Banner = ({
  tone = 'info',
  icon,
  children,
  action,
}: {
  tone?: 'info' | 'warning' | 'critical' | 'success' | 'arya';
  icon?: IconName;
  children: ReactNode;
  action?: ReactNode;
}) => (
  <div
    role={tone === 'critical' ? 'alert' : 'status'}
    className={cn(
      'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md px-3.5 py-2.5 text-base text-a-ink-800',
      tone === 'info' && 'bg-a-blue-100/50 shadow-[0_0_0_1px_#C3CAFF]',
      tone === 'success' && 'bg-a-ok-bg shadow-ring-ok',
      tone === 'warning' && 'bg-a-warn-bg shadow-[0_0_0_1px_#F7D29B]',
      tone === 'critical' && 'bg-a-danger-bg shadow-ring-critical',
      tone === 'arya' && 'bg-[linear-gradient(90deg,#FFF6F2,#FFF4F9_50%,#F6F2FF)] shadow-[0_0_0_1px_#F7D9E4]',
    )}
  >
    {icon && <Icon name={icon} size={16} tone={tone === 'warning' || tone === 'critical' ? undefined : 'faint'} />}
    <span className="min-w-0 flex-1 basis-[220px]">{children}</span>
    {action}
  </div>
);

/** Stat tiles row (orders: "Last 24 hours · 12 · ₹48,120 in sales"). */
export const StatGrid = ({ items }: { items: { label: string; value: string; sub?: string; muted?: boolean }[] }) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
    {items.map((x) => (
      <div key={x.label} className="a-card p-4">
        <div className="text-xs font-medium text-a-ink-500">{x.label}</div>
        <div className={cn('mt-1 text-xl font-semibold tabular-nums', x.muted ? 'text-a-ink-450' : 'text-a-ink-900')}>{x.value}</div>
        {x.sub && <div className="text-xs text-a-ink-450">{x.sub}</div>}
      </div>
    ))}
  </div>
);

/** Joined metric strip in one card (products: Showing · sell-through · days of inventory · ABC). */
export const MetricStrip = ({ items }: { items: { label: string; value: ReactNode; muted?: boolean }[] }) => (
  <div className="a-card grid grid-cols-2 overflow-hidden md:grid-flow-col md:auto-cols-fr">
    {items.map((m, i) => (
      <div
        key={m.label}
        className={cn(
          'border-a-line-100 p-4',
          i % 2 === 0 && 'border-r',
          i < items.length - 2 && 'border-b md:border-b-0',
          i < items.length - 1 && 'md:border-r',
        )}
      >
        <div className="inline-block border-b border-dashed border-a-ink-450 text-base font-medium text-a-ink-900">{m.label}</div>
        <div className={cn('mt-1 text-base', m.muted ? 'text-a-ink-450' : 'text-a-ink-800')}>{m.value}</div>
      </div>
    ))}
  </div>
);

/** Settings: a titled group of rows in one card. */
export const Group = ({ title, hint, action, children }: { title: string; hint?: string; action?: ReactNode; children: ReactNode }) => (
  <section className="mb-7">
    <div className="mb-2.5 flex items-end justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-a-ink-900">{title}</h3>
        {hint && <p className="text-xs text-a-ink-500">{hint}</p>}
      </div>
      {action}
    </div>
    <div className="overflow-hidden rounded-md bg-white shadow-card">{children}</div>
  </section>
);
export const Row = ({ k, sub, children }: { k: string; sub?: string; children: ReactNode }) => (
  <div className="flex min-h-[45px] items-center justify-between gap-4 border-b border-a-line-100 px-4 py-2 last:border-0">
    <span className="min-w-0">
      <span className="block text-base text-a-ink-800">{k}</span>
      {sub && <span className="block text-xs text-a-ink-450">{sub}</span>}
    </span>
    <span className="min-w-0 shrink-0 text-right text-base text-a-ink-600">{children}</span>
  </div>
);

/** ⌘K hint pair. */
export const ShortcutHint = ({ keys }: { keys: string[] }) => (
  <span className="hidden items-center gap-1 sm:flex">
    {keys.map((k) => (
      <Kbd key={k}>{k}</Kbd>
    ))}
  </span>
);

/** Full-page loader with the design's "store waking up" animation. Reduced motion skips to a quiet state. */
const PAGE_PHASES = ['Scaling your sales…', 'Raising AOV…', 'Converting more carts…', 'Cutting RTO…', 'Polishing the storefront…'];
const BARS: [number, number][] = [
  [28, 0.25],
  [38, 0.4],
  [48, 0.55],
  [64, 1],
  [48, 0.55],
  [38, 0.4],
  [28, 0.25],
];
function useTicks(ms: number) {
  const [t, setT] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setT((x) => x + 1), ms);
    return () => clearInterval(i);
  }, [ms]);
  return t;
}
export const PageLoader = ({ fullscreen }: { fullscreen?: boolean }) => {
  const t = useTicks(90);
  const sales = 84200 + ((t * 730) % 165000);
  const aov = 512 + ((t * 3) % 260);
  const cr = 1.2 + (t % 130) * 0.028;
  const stats: [string, string][] = [
    ['Sales', `₹${sales.toLocaleString('en-IN')}`],
    ['AOV', `₹${aov.toLocaleString('en-IN')}`],
    ['Conversion', `${cr.toFixed(1)}%`],
  ];
  return (
    <div
      role="status"
      aria-label="Loading your store"
      className={cn(
        'flex flex-col items-center justify-center bg-white',
        fullscreen ? 'fixed inset-0 z-50' : 'min-h-[calc(100vh-56px)] lg:min-h-screen',
      )}
    >
      <span className="animate-pulse">
        <LogoMark />
      </span>
      <div className="mt-7 flex h-16 items-end gap-1.5" aria-hidden>
        {BARS.map(([h, o], i) => (
          <div
            key={i}
            className="w-2.5 origin-bottom rounded-t-xs bg-a-blue"
            style={{ height: h, opacity: o, animation: `a-grow 1.6s ease-in-out ${i * 0.12}s infinite` }}
          />
        ))}
      </div>
      <div className="mt-7 flex items-center gap-8">
        {stats.map(([k, v], i) => (
          <div key={k} className="flex items-center gap-8">
            {i > 0 && <div className="-ml-8 h-7 w-px bg-a-line-200" />}
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-xs text-a-ink-450">{k}</span>
              <span className="flex items-baseline gap-1">
                <span className="text-md font-semibold tabular-nums text-a-ink-900">{v}</span>
                <span className="text-xs text-a-ok">↑</span>
              </span>
            </div>
          </div>
        ))}
      </div>
      <span className="mt-6 min-h-5 text-a-ink-500">{PAGE_PHASES[Math.floor((t * 90) / 1100) % PAGE_PHASES.length]}</span>
      <div className="mt-3.5 h-[3px] w-60 overflow-hidden rounded-xs bg-a-line-100">
        <div className="h-[3px] w-full rounded-xs bg-a-blue" style={{ animation: 'a-fill 1.5s ease-in-out infinite' }} />
      </div>
    </div>
  );
};
const LogoMark = () => (
  <span
    role="img"
    aria-label="Ratio"
    className="a-mask block h-[38px] w-[110px] text-a-ink-900"
    style={{ maskImage: 'url(/admin/logo.png)', WebkitMaskImage: 'url(/admin/logo.png)' }}
  />
);

/** Table skeleton with a live "counting" overlay (design: TableLoader). */
const TABLE_PHASES: Record<string, string[]> = {
  products: ['Sorting bestsellers…', 'Checking stock levels…', 'Crunching AOV…'],
  orders: ['Counting new orders…', 'Reconciling payments…', 'Tracking shipments…'],
  customers: ['Segmenting customers…', 'Measuring repeat rate…', 'Finding your VIPs…'],
};
const NAME_W = ['70%', '52%', '64%', '46%', '58%'];
const SHORT_W = ['56px', '44px', '52px', '48px'];
export const TableLoader = ({ entity, cols, thumb }: { entity: string; cols: string[]; thumb?: 'square' | 'circle' }) => {
  const t = useTicks(90);
  const phases = TABLE_PHASES[entity] ?? ['Loading…'];
  const grid = `${thumb ? '56px ' : ''}2.2fr repeat(${Math.max(1, cols.length - 1)},1fr)`;
  return (
    <div role="status" aria-label={`Loading ${entity}`} className="a-card relative overflow-hidden">
      <div className="grid h-10 items-center gap-4 border-b border-a-line-100 px-4" style={{ gridTemplateColumns: grid }}>
        {thumb && <span />}
        {cols.map((c) => (
          <span key={c} className="truncate text-xs font-medium text-a-ink-450">
            {c}
          </span>
        ))}
      </div>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="grid h-12 items-center gap-4 border-b border-a-line-100 px-4 last:border-0"
          style={{ gridTemplateColumns: grid }}
        >
          {thumb && (
            <div
              className={cn('a-skel h-8 w-8', thumb === 'circle' ? 'rounded-full' : 'rounded')}
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          )}
          <div className="a-skel h-3 rounded-sm" style={{ width: NAME_W[i % 5], animationDelay: `${i * 0.12}s` }} />
          {cols.slice(1).map((_, j) => (
            <div
              key={j}
              className="a-skel h-3 max-w-full rounded-sm"
              style={{ width: SHORT_W[(i + j) % 4], animationDelay: `${i * 0.12 + (j + 1) * 0.05}s` }}
            />
          ))}
        </div>
      ))}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-2.5 rounded-md bg-white px-3.5 py-2.5 shadow-[inset_0_0_0_1px_#E8E8E8,0_0_0_1px_#E8E8E8]">
          <div className="h-4 w-4 animate-spin-fast rounded-full border-2 border-a-line-100 border-t-a-blue" />
          <span className="min-h-5 font-medium text-a-ink-900">{phases[Math.floor((t * 90) / 1100) % phases.length]}</span>
        </div>
      </div>
    </div>
  );
};

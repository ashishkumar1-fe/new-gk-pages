import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Button } from './primitives';

export const PageLayout = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-6">{children}</div>
);

export const PageHeader = ({
  title,
  subtitle,
  back,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  back?: { label: string; onClick: () => void };
  actions?: ReactNode;
}) => (
  <header className="flex flex-wrap items-start justify-between gap-3">
    <div className="flex flex-col gap-1">
      {back && (
        <button type="button" onClick={back.onClick} className="text-left text-sm text-muted hover:text-ink">
          ← {back.label}
        </button>
      )}
      <h1 className="text-2xl font-semibold text-ink">{title}</h1>
      {subtitle && <div className="text-sm text-muted">{subtitle}</div>}
    </div>
    <div className="flex items-center gap-2">{actions}</div>
  </header>
);

export const TwoColumn = ({ main, aside }: { main: ReactNode; aside?: ReactNode }) => (
  <div className="grid grid-cols-1 gap-5 lg:grid-cols-[65fr_35fr]">
    <div className="flex min-w-0 flex-col gap-5">{main}</div>
    {aside && <div className="flex min-w-0 flex-col gap-5">{aside}</div>}
  </div>
);

export const Tabs = ({
  items,
  value,
  onChange,
}: {
  items: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) => (
  <div role="tablist" className="flex gap-1 border-b border-line">
    {items.map((t) => (
      <button
        key={t.id}
        role="tab"
        type="button"
        aria-selected={t.id === value}
        onClick={() => onChange(t.id)}
        className={cn(
          '-mb-px border-b-2 px-3 py-2 text-sm',
          t.id === value ? 'border-accent font-medium text-ink' : 'border-transparent text-muted hover:text-ink',
        )}
      >
        {t.label}
      </button>
    ))}
  </div>
);

export const EmptyState = ({ title, body, action }: { title: string; body?: string; action?: ReactNode }) => (
  <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line py-14 text-center">
    <p className="text-base font-medium text-ink">{title}</p>
    {body && <p className="max-w-md text-sm text-muted">{body}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="flex flex-col items-center gap-2 rounded-lg border border-critical bg-critical-soft py-10 text-center">
    <p className="text-sm text-critical">{message}</p>
    {onRetry && (
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Retry
      </Button>
    )}
  </div>
);

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
    <div className="flex items-center justify-between text-sm text-muted">
      <span className="tabular-nums">
        {total === 0 ? 'No results' : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
      </span>
      <div className="flex gap-2">
        <Button size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </Button>
        <Button size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
};

export const BulkBar = ({ count, onClear, children }: { count: number; onClear: () => void; children: ReactNode }) => (
  <div className="flex items-center gap-3 rounded-lg border border-line bg-accent-soft px-4 py-2 text-sm">
    <span className="font-medium text-accent-ink">{count} selected</span>
    <div className="flex gap-2">{children}</div>
    <button type="button" onClick={onClear} className="ml-auto text-muted hover:text-ink">
      Clear
    </button>
  </div>
);

export const SaveBar = ({
  dirty,
  saving,
  onSave,
  onDiscard,
  status,
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  status?: string;
}) => (
  <div
    className={cn(
      'sticky top-0 z-10 -mx-6 flex items-center justify-between border-b px-6 py-2 transition-colors',
      dirty || saving ? 'border-line bg-ink text-surface' : 'border-transparent bg-bg text-muted',
    )}
  >
    <span className="text-sm">{saving ? 'Saving…' : dirty ? 'Unsaved changes' : (status ?? ' ')}</span>
    <div className="flex gap-2">
      <Button size="sm" variant="ghost" disabled={!dirty || saving} onClick={onDiscard}>
        <span className={dirty ? 'text-surface' : ''}>Discard</span>
      </Button>
      <Button size="sm" variant="primary" disabled={!dirty} loading={saving} onClick={onSave}>
        Save
      </Button>
    </div>
  </div>
);

export const Banner = ({ tone = 'info', children }: { tone?: 'info' | 'warning' | 'critical' | 'success'; children: ReactNode }) => (
  <div
    role={tone === 'critical' ? 'alert' : 'status'}
    className={cn(
      'flex flex-col gap-1 rounded border px-3 py-2 text-sm',
      tone === 'info' && 'border-accent-soft bg-accent-soft text-accent-ink',
      tone === 'success' && 'border-success-soft bg-success-soft text-success',
      tone === 'warning' && 'border-warning-soft bg-warning-soft text-warning',
      tone === 'critical' && 'border-critical bg-critical-soft text-critical',
    )}
  >
    {children}
  </div>
);

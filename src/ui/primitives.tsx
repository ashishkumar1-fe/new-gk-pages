import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

/* Closed APIs: fixed variants, no className/style passthrough. A new look comes from a kit change. */

type Tone = 'success' | 'warning' | 'critical' | 'info' | 'neutral';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'critical';
  size?: 'sm' | 'md';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  children?: ReactNode;
  title?: string;
}
export const Button = ({
  variant = 'secondary',
  size = 'md',
  loading,
  disabled,
  onClick,
  type = 'button',
  children,
  title,
}: ButtonProps) => (
  <button
    type={type}
    title={title}
    onClick={onClick}
    disabled={disabled || loading}
    aria-busy={loading}
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50 disabled:cursor-not-allowed',
      size === 'sm' ? 'h-8 px-3 text-sm' : 'h-10 px-4 text-sm',
      variant === 'primary' && 'bg-accent text-surface hover:bg-accent-ink',
      variant === 'secondary' && 'bg-surface text-ink border border-line hover:bg-neutral-soft',
      variant === 'ghost' && 'bg-transparent text-ink hover:bg-neutral-soft',
      variant === 'critical' && 'bg-critical text-surface hover:opacity-90',
    )}
  >
    {loading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
    {children}
  </button>
);

export const Badge = ({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
      tone === 'success' && 'bg-success-soft text-success',
      tone === 'warning' && 'bg-warning-soft text-warning',
      tone === 'critical' && 'bg-critical-soft text-critical',
      tone === 'info' && 'bg-accent-soft text-accent-ink',
      tone === 'neutral' && 'bg-neutral-soft text-neutral',
    )}
  >
    {children}
  </span>
);

export const Field = ({
  label,
  help,
  error,
  htmlFor,
  children,
}: {
  label: string;
  help?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
      {label}
    </label>
    {children}
    {error ? (
      <p className="text-xs text-critical" role="alert">
        {error}
      </p>
    ) : help ? (
      <p className="text-xs text-muted">{help}</p>
    ) : null}
  </div>
);

const control =
  'w-full rounded border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted focus:outline focus:outline-2 focus:outline-accent disabled:bg-neutral-soft';

export const TextField = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'style'> & { invalid?: boolean }
>(({ invalid, ...p }, ref) => (
  <input ref={ref} {...p} aria-invalid={invalid} className={cn(control, 'h-10', invalid && 'border-critical')} />
));
TextField.displayName = 'TextField';

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className' | 'style'> & { invalid?: boolean }
>(({ invalid, ...p }, ref) => (
  <textarea ref={ref} rows={4} {...p} aria-invalid={invalid} className={cn(control, 'py-2', invalid && 'border-critical')} />
));
TextArea.displayName = 'TextArea';

export const Select = forwardRef<
  HTMLSelectElement,
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'style'> & {
    options: { value: string; label: string }[];
    placeholder?: string;
  }
>(({ options, placeholder, ...p }, ref) => (
  <select ref={ref} {...p} className={cn(control, 'h-10')}>
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
));
Select.displayName = 'Select';

export const Checkbox = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'style' | 'type'> & { label?: string }
>(({ label, ...p }, ref) => (
  <label className="inline-flex items-center gap-2 text-sm text-ink">
    <input ref={ref} type="checkbox" {...p} className="h-4 w-4 rounded-sm border-line accent-accent" />
    {label}
  </label>
));
Checkbox.displayName = 'Checkbox';

export const Skeleton = ({ lines = 1, className }: { lines?: number; className?: never }) => (
  <div className="flex flex-col gap-2" aria-hidden>
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className={cn('h-4 animate-pulse rounded bg-neutral-soft', className)} />
    ))}
  </div>
);

export const Card = ({ title, children, tone = 'default' }: { title?: string; children: ReactNode; tone?: 'default' | 'critical' }) => (
  <section className={cn('rounded-lg border bg-surface p-5', tone === 'critical' ? 'border-critical' : 'border-line')}>
    {title && <h3 className="mb-3 text-base font-semibold text-ink">{title}</h3>}
    {children}
  </section>
);

export const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="rounded-sm border border-line bg-neutral-soft px-1 font-mono text-xs">{children}</kbd>
);
export type { ButtonHTMLAttributes };

/** File picker in the kit's look; the native input stays visually hidden but keyboard reachable through its label. */
export const FileInput = ({
  id,
  accept,
  label,
  fileName,
  onFile,
}: {
  id: string;
  accept?: string;
  label: string;
  fileName?: string;
  onFile: (f: File) => void;
}) => (
  <label
    htmlFor={id}
    className="flex cursor-pointer items-center justify-between gap-3 rounded border border-dashed border-line bg-surface px-3 py-3 text-sm text-ink hover:bg-neutral-soft focus-within:outline focus-within:outline-2 focus-within:outline-accent"
  >
    <span>{fileName ?? label}</span>
    <span className="text-muted">Choose file</span>
    <input
      id={id}
      type="file"
      accept={accept}
      className="sr-only"
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) onFile(f);
        e.target.value = '';
      }}
    />
  </label>
);

export const ProgressBar = ({ value, label }: { value?: number; label: string }) => (
  <div
    role="progressbar"
    aria-label={label}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={value}
    className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-soft"
  >
    <div
      className={cn('h-full bg-accent transition-all', value === undefined && 'w-1/3 animate-pulse')}
      style={value === undefined ? undefined : { width: `${value}%` }}
    />
  </div>
);

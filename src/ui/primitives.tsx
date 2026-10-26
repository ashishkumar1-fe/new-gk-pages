import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './icons';

/* Closed APIs: fixed variants, no className/style passthrough. A new look comes from a kit change.
   Looks ported from ratio-website/src/components/admin/ui.tsx (Ratio New Design — Admin panel). */

export type Tone = 'success' | 'warning' | 'critical' | 'info' | 'neutral' | 'arya';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'critical' | 'arya';
  size?: 'sm' | 'md';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  children?: ReactNode;
  title?: string;
  icon?: IconName;
  /** full width (login, dialogs) */
  block?: boolean;
  'aria-label'?: string;
  'aria-expanded'?: boolean;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'sm', loading, disabled, onClick, type = 'button', children, title, icon, block, ...aria },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-label={aria['aria-label']}
      aria-expanded={aria['aria-expanded']}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded font-medium transition-[background,box-shadow,color,opacity] duration-120 ease-out disabled:pointer-events-none disabled:opacity-40',
        size === 'sm' ? 'h-7 px-2.5 text-base' : 'h-9 px-3.5 text-base',
        block && 'w-full',
        variant === 'primary' && 'bg-a-blue text-white hover:bg-a-blue-700',
        variant === 'secondary' && 'bg-white text-a-ink-800 shadow-ring-soft hover:bg-a-blue-100',
        variant === 'ghost' && 'text-a-ink-600 hover:bg-a-line-100',
        variant === 'critical' && 'bg-white text-a-danger shadow-ring-critical hover:bg-a-danger-bg',
        variant === 'arya' && 'arya-shine bg-white text-a-ink-800 shadow-ring-arya hover:bg-a-arya-soft',
      )}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin-fast rounded-full border-2 border-a-line-100 border-t-current" aria-hidden />
      ) : (
        icon && <Icon name={icon} size={variant === 'arya' ? 14 : 16} tone={variant === 'arya' ? 'arya' : undefined} />
      )}
      {children}
    </button>
  );
});

/** Square icon-only button for toolbars, headers and rows. */
export const IconButton = ({
  icon,
  label,
  onClick,
  size = 'md',
  active,
  disabled,
  badge,
}: {
  icon: IconName;
  label: string;
  onClick?: () => void;
  size?: 'sm' | 'md';
  active?: boolean;
  disabled?: boolean;
  badge?: number;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
    aria-pressed={active}
    className={cn(
      'relative flex shrink-0 items-center justify-center rounded text-a-ink-600 hover:bg-a-line-100 disabled:opacity-30',
      size === 'sm' ? 'h-7 w-7' : 'h-8 w-8',
      active && 'bg-a-line-100 text-a-blue',
    )}
  >
    <Icon name={icon} size={size === 'sm' ? 14 : 18} />
    {badge ? (
      <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-sm bg-a-blue px-1 text-2xs font-semibold text-white">
        {badge}
      </span>
    ) : null}
  </button>
);

const PILL: Record<Tone, string> = {
  success: 'bg-a-ok-bg text-a-ok shadow-ring-ok',
  warning: 'bg-a-warn-bg text-a-warn shadow-ring-warn',
  info: 'bg-a-blue-100 text-a-blue shadow-ring-accent',
  neutral: 'bg-a-line-100 text-a-ink-550 shadow-ring-line',
  critical: 'bg-a-danger-bg text-a-danger shadow-ring-critical',
  arya: 'bg-white text-a-arya-ink shadow-ring-arya',
};
/** Status pill. Tone comes from domain/format, never decided here. */
export const Badge = ({ tone = 'neutral', children, icon }: { tone?: Tone; children: ReactNode; icon?: IconName }) => (
  <span
    className={cn('inline-flex h-[22px] shrink-0 items-center gap-1 whitespace-nowrap rounded-sm px-1.5 text-xs font-medium', PILL[tone])}
  >
    {icon && <Icon name={icon} size={12} />}
    {children}
  </span>
);

export const Field = ({
  label,
  help,
  hint,
  error,
  htmlFor,
  right,
  children,
}: {
  label: string;
  help?: string;
  /** (i) tooltip beside the label */
  hint?: string;
  error?: string;
  htmlFor?: string;
  right?: ReactNode;
  children: ReactNode;
}) => (
  <div className="flex flex-col">
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <label htmlFor={htmlFor} className="flex items-center gap-1 text-xs font-medium text-a-ink-700">
        {label}
        {hint && (
          <span
            title={hint}
            className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] text-a-ink-450 shadow-ring-line"
          >
            i
          </span>
        )}
      </label>
      {right}
    </div>
    {children}
    {error ? (
      <p className="mt-1.5 text-xs text-a-danger" role="alert">
        {error}
      </p>
    ) : help ? (
      <p className="mt-1.5 text-xs text-a-ink-450">{help}</p>
    ) : null}
  </div>
);

const control =
  'a-ring w-full rounded bg-white text-base text-a-ink-800 outline-none transition-shadow duration-120 placeholder:text-a-ink-450 disabled:bg-a-line-100 disabled:text-a-ink-500';

export const TextField = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'style' | 'prefix'> & { invalid?: boolean; prefix?: string; suffix?: string }
>(({ invalid, prefix, suffix, ...p }, ref) => {
  if (!prefix && !suffix)
    return <input ref={ref} {...p} aria-invalid={invalid} className={cn(control, 'h-9 px-3', invalid && 'shadow-ring-critical')} />;
  return (
    <label
      className={cn(
        'a-ring flex h-9 w-full items-center gap-2 rounded bg-white px-3 transition-shadow duration-120',
        invalid && 'shadow-ring-critical',
      )}
    >
      {prefix && <span className="text-base text-a-ink-450">{prefix}</span>}
      <input
        ref={ref}
        {...p}
        aria-invalid={invalid}
        className="h-full min-w-0 flex-1 bg-transparent text-base text-a-ink-800 outline-none placeholder:text-a-ink-450"
      />
      {suffix && <span className="text-base text-a-ink-450">{suffix}</span>}
    </label>
  );
});
TextField.displayName = 'TextField';

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className' | 'style'> & { invalid?: boolean }
>(({ invalid, ...p }, ref) => (
  <textarea
    ref={ref}
    rows={4}
    {...p}
    aria-invalid={invalid}
    className={cn(control, 'block resize-y px-3 py-2 leading-5', invalid && 'shadow-ring-critical')}
  />
));
TextArea.displayName = 'TextArea';

export const Select = forwardRef<
  HTMLSelectElement,
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'style'> & {
    options: { value: string; label: string }[];
    placeholder?: string;
    invalid?: boolean;
  }
>(({ options, placeholder, invalid, ...p }, ref) => (
  <div className="relative w-full">
    <select
      ref={ref}
      {...p}
      aria-invalid={invalid}
      className={cn(control, 'h-9 appearance-none pl-3 pr-8', invalid && 'shadow-ring-critical')}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-a-ink-500">
      <Icon name="down" size={16} />
    </span>
  </div>
));
Select.displayName = 'Select';

export const Checkbox = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'style' | 'type'> & { label?: string; sub?: string }
>(({ label, sub, ...p }, ref) => {
  const box = <input ref={ref} type="checkbox" {...p} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded-sm accent-a-blue" />;
  if (!label) return box;
  return (
    <label className="flex items-start gap-2.5">
      {box}
      <span>
        <span className="block text-base text-a-ink-800">{label}</span>
        {sub && <span className="block text-xs text-a-ink-450">{sub}</span>}
      </span>
    </label>
  );
});
Checkbox.displayName = 'Checkbox';

export const Toggle = ({
  on,
  onChange,
  label,
  disabled,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!on)}
    className={cn(
      'relative h-5 w-9 shrink-0 rounded-full transition-colors duration-120 disabled:opacity-40',
      on ? 'bg-a-blue' : 'bg-a-line-150',
    )}
  >
    <span
      className={cn(
        'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-lg transition-[left] duration-120',
        on ? 'left-[18px]' : 'left-0.5',
      )}
    />
  </button>
);

export const Radio = <T extends string>({
  value,
  onChange,
  options,
  name,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string; sub?: string }[];
  name: string;
}) => (
  <div role="radiogroup" aria-label={name} className="flex flex-col gap-2">
    {options.map((o) => (
      <label key={o.id} className="flex cursor-pointer items-start gap-2.5">
        <input type="radio" name={name} checked={value === o.id} onChange={() => onChange(o.id)} className="mt-1 accent-a-blue" />
        <span>
          <span className="block text-base text-a-ink-800">{o.label}</span>
          {o.sub && <span className="block text-xs text-a-ink-450">{o.sub}</span>}
        </span>
      </label>
    ))}
  </div>
);

export const Skeleton = ({ lines = 1 }: { lines?: number }) => (
  <div className="flex flex-col gap-2" aria-hidden>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="a-skel h-3 rounded-sm"
        style={{ width: ['70%', '52%', '64%', '46%', '58%'][i % 5], animationDelay: `${i * 0.12}s` }}
      />
    ))}
  </div>
);

export const Card = ({
  title,
  subtitle,
  action,
  children,
  tone = 'default',
  padded = true,
}: {
  title?: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  tone?: 'default' | 'critical' | 'page';
  padded?: boolean;
}) => (
  <section className={cn('a-card', padded && 'p-4', tone === 'critical' && 'shadow-ring-critical', tone === 'page' && 'bg-a-page')}>
    {(title || action) && (
      <div className={cn('flex items-center justify-between gap-3', padded ? 'mb-3' : 'px-4 pb-3 pt-4')}>
        {title && (
          <h2 className="text-md font-semibold leading-6 text-a-ink-900">
            {title}
            {subtitle && <span className="block text-xs font-normal text-a-ink-450">{subtitle}</span>}
          </h2>
        )}
        {action}
      </div>
    )}
    {children}
  </section>
);

export const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-sm bg-white px-1 font-sans text-2xs text-a-ink-500 shadow-ring-line">
    {children}
  </kbd>
);
export type { ButtonHTMLAttributes };

/** Initials avatar, hue from the name (customers, staff). */
export const Avatar = ({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) => {
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 5;
  const bg = ['#DDE0FF', '#EAFCDD', '#FFF3E2', '#FCE7F3', '#E0F2FE'][hue];
  const fg = ['#3F53FE', '#217005', '#B26A00', '#BE185D', '#0369A1'][hue];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        size === 'sm' ? 'h-6 w-6 text-2xs' : size === 'lg' ? 'h-10 w-10 text-base' : 'h-8 w-8 text-xs',
      )}
      style={{ background: bg, color: fg }}
    >
      {name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()}
    </span>
  );
};

/** Square thumbnail: an image url, or the image placeholder. */
export const Thumb = ({ src, size = 32, alt = '' }: { src?: string; size?: 24 | 28 | 32 | 40 | 48 | 84; alt?: string }) =>
  src ? (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="shrink-0 rounded object-cover shadow-thumb"
      style={{ width: size, height: size }}
    />
  ) : (
    <span className="flex shrink-0 items-center justify-center rounded bg-a-line-100 text-a-ink-450" style={{ width: size, height: size }}>
      <Icon name="image" size={size >= 48 ? 24 : 14} />
    </span>
  );

/** Arya's avatar: the one warm gradient in a blue admin, so anything AI is recognisable. */
export const AryaMark = ({ size = 'md', spin }: { size?: 'sm' | 'md' | 'lg'; spin?: boolean }) => (
  <span
    className={cn(
      'arya-grad relative inline-flex shrink-0 items-center justify-center rounded-full text-white',
      size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-8 w-8' : 'h-7 w-7',
    )}
    aria-hidden
  >
    <span className={cn('flex', spin && 'animate-spin-slow')}>
      <Icon name="sparkle" size={size === 'sm' ? 12 : size === 'lg' ? 18 : 16} strokeWidth={1.8} />
    </span>
  </span>
);

/** Click-outside + esc dismiss. */
export function useDismiss<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const key = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
    };
  }, [open, close]);
  return ref;
}

export type MenuItem = { label: string; icon?: IconName; onClick?: () => void; disabled?: boolean; tone?: 'default' | 'critical' } | 'sep';
/** Dropdown menu. `trigger` renders the opener and gets (open, toggle). */
export function Menu({
  trigger,
  items,
  align = 'right',
  up,
}: {
  trigger: (open: boolean, toggle: () => void) => ReactNode;
  items: MenuItem[];
  align?: 'left' | 'right';
  /** open above the trigger (sidebar footer) */
  up?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss<HTMLDivElement>(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative min-w-0">
      {trigger(open, () => setOpen((o) => !o))}
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-50 min-w-[200px] animate-dd rounded-md bg-white p-1 shadow-menu',
            up ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((it, i) =>
            it === 'sep' ? (
              <div key={i} className="my-1 h-px bg-a-line-100" />
            ) : (
              <button
                key={it.label}
                role="menuitem"
                type="button"
                disabled={it.disabled}
                onClick={() => {
                  setOpen(false);
                  it.onClick?.();
                }}
                className={cn(
                  'flex h-8 w-full items-center gap-2 rounded px-2 text-left text-base hover:bg-a-line-100 disabled:opacity-40',
                  it.tone === 'critical' ? 'text-a-danger' : 'text-a-ink-700',
                )}
              >
                {it.icon && <Icon name={it.icon} size={16} tone="faint" />}
                {it.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}

/** "More" (⋯) button that opens a Menu. */
export const MoreMenu = ({ items, label = 'More' }: { items: MenuItem[]; label?: string }) => (
  <Menu items={items} trigger={(open, toggle) => <Button onClick={toggle} aria-expanded={open} aria-label={label} icon="more" />} />
);

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
    className="flex cursor-pointer items-center justify-between gap-3 rounded border border-dashed border-a-line-150 bg-white px-3 py-3 text-base text-a-ink-800 hover:bg-a-page focus-within:shadow-ring-focus"
  >
    <span>{fileName ?? label}</span>
    <span className="text-a-ink-450">Choose file</span>
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

export const ProgressBar = ({ value, label, tone = 'accent' }: { value?: number; label: string; tone?: 'accent' | 'warn' }) => (
  <div
    role="progressbar"
    aria-label={label}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={value}
    className="h-1.5 w-full overflow-hidden rounded-full bg-a-line-100"
  >
    <div
      className={cn(
        'h-full rounded-full transition-[width] duration-300',
        tone === 'warn' ? 'bg-a-warn' : 'bg-a-blue',
        value === undefined && 'w-1/3 animate-pulse',
      )}
      style={value === undefined ? undefined : { width: `${value}%` }}
    />
  </div>
);

/** Removable chip (filters, tags). */
export const Chip = ({
  children,
  onRemove,
  tone = 'default',
}: {
  children: ReactNode;
  onRemove?: () => void;
  tone?: 'default' | 'arya';
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-sm py-0.5 pl-1.5 text-xs font-medium',
      onRemove ? 'pr-0.5' : 'pr-1.5',
      tone === 'arya' ? 'bg-a-arya-soft text-a-arya-ink shadow-ring-arya' : 'bg-white text-a-ink-700 shadow-ring-line',
    )}
  >
    {children}
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove"
        className="flex h-4 w-4 items-center justify-center rounded-xs text-a-ink-450 hover:bg-a-line-100 hover:text-a-ink-800"
      >
        <Icon name="x" size={12} />
      </button>
    )}
  </span>
);

/** Tag input: chips plus a text field; Enter or comma adds. */
export const TagInput = ({
  value,
  onChange,
  placeholder = 'Add tags',
  id,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  id?: string;
}) => {
  const [draft, setDraft] = useState('');
  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onChange([...new Set([...value, t])]);
    setDraft('');
  };
  return (
    <div className="a-ring flex min-h-9 flex-wrap items-center gap-1 rounded bg-white px-1.5 py-1">
      {value.map((t) => (
        <Chip key={t} onRemove={() => onChange(value.filter((x) => x !== t))}>
          {t}
        </Chip>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add();
          } else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={add}
        placeholder={value.length ? '' : placeholder}
        aria-label={placeholder}
        className="h-6 min-w-[60px] flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-a-ink-450"
      />
    </div>
  );
};

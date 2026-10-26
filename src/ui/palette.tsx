import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconName } from './icons';
import { AryaMark, Kbd, useDismiss } from './primitives';

export interface PaletteHit {
  id: string;
  label: string;
  sub?: string;
  icon?: IconName;
  thumb?: ReactNode;
  arya?: boolean;
  onPick: () => void;
}
export interface PaletteGroup {
  label: string;
  hits: PaletteHit[];
  more?: number;
}

/**
 * ⌘K search (design: shell.tsx Search). The field lives in the sidebar; results drop below it.
 * Presentational: the caller supplies groups for the current query and handles navigation.
 */
export const CommandPalette = ({
  query,
  onQuery,
  groups,
  placeholder = 'Search or ask Arya',
  compact,
  autoFocus,
  onDone,
}: {
  query: string;
  onQuery: (q: string) => void;
  groups: PaletteGroup[];
  placeholder?: string;
  compact?: boolean;
  autoFocus?: boolean;
  onDone?: () => void;
}) => {
  const [open, setOpen] = useState(!!autoFocus);
  const [idx, setIdx] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const close = () => {
    setOpen(false);
    onDone?.();
  };
  const ref = useDismiss<HTMLDivElement>(open, close);
  const flat = groups.flatMap((g) => g.hits);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        input.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);
  useEffect(() => setIdx(0), [query]);

  const go = (h: PaletteHit) => {
    h.onPick();
    onQuery('');
    input.current?.blur();
    close();
  };

  return (
    <div ref={ref} className="relative">
      <label
        className={cn(
          'flex h-9 items-center gap-2 rounded-md px-3 transition-[background,box-shadow] duration-120',
          open ? 'bg-white shadow-ring-focus' : 'bg-a-page shadow-ring',
        )}
      >
        <Icon name="search" size={16} tone="faint" />
        <input
          ref={input}
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => {
            onQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setIdx((i) => Math.min(flat.length - 1, i + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setIdx((i) => Math.max(0, i - 1));
            } else if (e.key === 'Enter' && flat[idx]) {
              e.preventDefault();
              go(flat[idx]!);
            } else if (e.key === 'Escape') {
              input.current?.blur();
              close();
            }
          }}
          placeholder={compact ? 'Search' : placeholder}
          aria-label="Search"
          role="combobox"
          aria-expanded={open}
          aria-controls="admin-search-list"
          className="h-full min-w-0 flex-1 bg-transparent text-base text-a-ink-800 outline-none placeholder:text-a-ink-500"
        />
        <span className="hidden items-center gap-1 sm:flex">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </label>
      {open && (
        <div
          id="admin-search-list"
          role="listbox"
          className={cn(
            'absolute top-[calc(100%+6px)] z-50 animate-dd overflow-hidden rounded-md bg-white shadow-pop',
            compact ? 'left-0 w-[min(520px,calc(100vw-24px))]' : 'inset-x-0',
          )}
        >
          <div className="max-h-[min(460px,70vh)] overflow-auto py-1.5">
            {groups.map((g) => (
              <div key={g.label} className="px-1.5 pb-1">
                <div className="px-2 pb-1 pt-2 text-xs font-medium text-a-ink-450">{g.label}</div>
                {g.hits.map((h) => {
                  const i = flat.indexOf(h);
                  return (
                    <button
                      key={g.label + h.id}
                      type="button"
                      role="option"
                      aria-selected={i === idx}
                      onMouseEnter={() => setIdx(i)}
                      onClick={() => go(h)}
                      className={cn(
                        'flex h-10 w-full items-center gap-2.5 rounded px-2 text-left',
                        i === idx && (h.arya ? 'bg-a-arya-soft' : 'bg-a-line-100'),
                      )}
                    >
                      {h.arya ? (
                        <AryaMark size="sm" />
                      ) : (
                        (h.thumb ?? (
                          <span className="flex h-6 w-6 items-center justify-center rounded bg-a-line-100 text-a-ink-500">
                            {h.icon && <Icon name={h.icon} size={14} />}
                          </span>
                        ))
                      )}
                      <span className="min-w-0 flex-1 truncate text-base text-a-ink-800">{h.label}</span>
                      {h.sub && <span className="hidden max-w-[45%] truncate text-xs text-a-ink-450 sm:block">{h.sub}</span>}
                    </button>
                  );
                })}
                {g.more ? <div className="px-2 py-1 text-xs text-a-ink-450">+{g.more} more</div> : null}
              </div>
            ))}
            {query.trim() && flat.length <= 1 && (
              <div className="px-4 py-3 text-base text-a-ink-500">No results for “{query.trim()}”. Ask Arya instead.</div>
            )}
          </div>
          <div className="flex items-center gap-3 border-t border-a-line-100 px-3 py-2 text-xs text-a-ink-450">
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> to navigate
            </span>
            <span className="flex items-center gap-1">
              <Kbd>↵</Kbd> to open
            </span>
            <span className="flex items-center gap-1">
              <Kbd>esc</Kbd> to close
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/** Notifications dropdown shell (design: shell.tsx Notifications). */
export const NotificationList = ({
  items,
  unread,
  onMarkRead,
  onViewAll,
}: {
  items: { id: string; icon: IconName; title: string; body: string; at: string; onClick?: () => void }[];
  unread: number;
  onMarkRead: () => void;
  onViewAll?: () => void;
}) => (
  <div className="w-[min(360px,calc(100vw-24px))]">
    <div className="-mx-3 -mt-3 flex h-12 items-center justify-between border-b border-a-line-100 px-4">
      <span className="font-semibold text-a-ink-900">Notifications</span>
      <button type="button" disabled={!unread} onClick={onMarkRead} className="text-xs font-medium text-a-blue disabled:text-a-ink-450">
        Mark all as read
      </button>
    </div>
    <ul className="-mx-3 max-h-[360px] overflow-auto py-1">
      {items.map((n) => (
        <li key={n.id}>
          <button type="button" onClick={n.onClick} className="flex w-full gap-3 px-4 py-2.5 text-left hover:bg-a-line-100">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded bg-a-line-100 text-a-ink-600">
              <Icon name={n.icon} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="truncate font-medium text-a-ink-900">{n.title}</span>
                {unread > 0 && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-a-blue" />}
              </span>
              <span className="block truncate text-xs text-a-ink-500">{n.body}</span>
            </span>
            <span className="shrink-0 text-xs text-a-ink-450">{n.at}</span>
          </button>
        </li>
      ))}
      {items.length === 0 && <li className="px-4 py-6 text-center text-base text-a-ink-500">You're all caught up.</li>}
    </ul>
    {onViewAll && (
      <div className="-mx-3 -mb-3 border-t border-a-line-100 px-4 py-2.5 text-center">
        <button type="button" onClick={onViewAll} className="text-xs font-medium text-a-blue">
          View all
        </button>
      </div>
    )}
  </div>
);

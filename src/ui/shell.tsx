import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon, Logo, type IconName } from './icons';
import { IconButton } from './primitives';

/* Chrome from ratio-website/src/components/admin/shell.tsx: a 240px white sidebar that holds search, nav, settings
   and the account row; a mobile bar under lg. Frames only: surfaces supply nav data, search, account, panels. */

export interface NavChild {
  id: string;
  label: string;
  href?: string;
  badge?: string;
  active?: boolean;
  onClick?: () => void;
}
export interface NavItem {
  id: string;
  label: string;
  icon: IconName;
  href?: string;
  badge?: string;
  active?: boolean;
  /** parent lights up when a child is active too (open), but not as the current page */
  open?: boolean;
  onClick?: () => void;
  children?: NavChild[];
  chevron?: boolean;
}
export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const AppFrame = ({
  sidebar,
  children,
  panel,
  panelOpen,
}: {
  sidebar: ReactNode;
  children: ReactNode;
  /** right side panel (assistant) */
  panel?: ReactNode;
  panelOpen?: boolean;
}) => (
  <div className="min-h-screen bg-white">
    <div className="flex pt-14 lg:pt-0">
      {sidebar}
      <main className={cn('min-w-0 flex-1 transition-[padding] duration-200', panelOpen && 'xl:pr-100')}>{children}</main>
    </div>
    {panel}
  </div>
);

export const MobileBar = ({
  onMenu,
  onSearch,
  right,
  onHome,
}: {
  onMenu: () => void;
  onSearch?: () => void;
  right?: ReactNode;
  onHome: () => void;
}) => (
  <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 bg-white px-3 shadow-hairline lg:hidden">
    <IconButton icon="menu" label="Menu" onClick={onMenu} />
    <button type="button" onClick={onHome} aria-label="Home">
      <Logo size="sm" />
    </button>
    <span className="flex-1" />
    {onSearch && <IconButton icon="search" label="Search" onClick={onSearch} />}
    {right}
  </header>
);

const rowCls = (on: boolean) =>
  cn(
    'flex h-8 w-full items-center gap-2 rounded px-2 text-left text-base leading-5 transition-colors duration-120',
    on ? 'bg-a-line-100 font-medium text-a-blue' : 'text-a-ink-800 hover:bg-a-line-100',
  );

const NavRow = ({ it }: { it: NavItem }) => {
  const body = (
    <>
      <Icon name={it.icon} size={16} tone={it.active ? 'accent' : 'muted'} />
      <span className="flex-1">{it.label}</span>
      {it.badge && <span className="text-xs tabular-nums text-a-ink-500">{it.badge}</span>}
      {it.children && it.open && <Icon name="down" size={16} />}
      {it.chevron && <Icon name="chevron" size={16} tone="faint" />}
    </>
  );
  if (!it.href && !it.onClick)
    return (
      <span title="Coming soon" aria-disabled className={cn(rowCls(false), 'cursor-default text-a-ink-500 hover:bg-transparent')}>
        {body}
      </span>
    );
  return (
    <a
      href={it.href ?? '#'}
      aria-current={it.active ? 'page' : undefined}
      onClick={(e) => {
        e.preventDefault();
        it.onClick?.();
      }}
      className={rowCls(!!it.active)}
    >
      {body}
    </a>
  );
};

export const Sidebar = ({
  open,
  onClose,
  onHome,
  search,
  groups,
  footer,
  account,
}: {
  /** mobile drawer state; ignored at lg+ */
  open: boolean;
  onClose: () => void;
  onHome: () => void;
  search?: ReactNode;
  groups: NavGroup[];
  /** settings row */
  footer?: ReactNode;
  /** store switcher + notifications + assistant toggle */
  account?: ReactNode;
}) => (
  <>
    {open && <div className="fixed inset-0 top-14 z-[34] bg-a-ink-900/30 lg:hidden" onClick={onClose} />}
    <nav
      aria-label="Admin"
      className={cn(
        'fixed bottom-0 left-0 top-14 z-[35] flex w-60 shrink-0 flex-col bg-white px-3 pb-3 pt-3 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:pt-5',
        open ? 'translate-x-0 shadow-lg' : '-translate-x-full',
      )}
    >
      <button type="button" onClick={onHome} aria-label="Home" className="mb-4 hidden px-2 lg:block">
        <Logo />
      </button>
      {search && <div className="mb-3">{search}</div>}
      <ul className="flex-1 space-y-0.5 overflow-auto">
        {groups.map((g, gi) => (
          <li key={g.label ?? gi} className={cn(gi > 0 && 'pt-4')}>
            {g.label && <span className="flex h-8 items-center px-2 text-xs font-medium text-a-ink-450">{g.label}</span>}
            <ul className="space-y-0.5">
              {g.items.map((it) => (
                <li key={it.id}>
                  <NavRow it={it} />
                  {it.children && it.open && (
                    <ul className="mb-1 space-y-0.5">
                      {it.children.map((c) => (
                        <li key={c.id}>
                          {c.href || c.onClick ? (
                            <a
                              href={c.href ?? '#'}
                              aria-current={c.active ? 'page' : undefined}
                              onClick={(e) => {
                                e.preventDefault();
                                c.onClick?.();
                              }}
                              className={cn(
                                'flex h-7.5 items-center gap-2 rounded pl-[34px] pr-2 text-base',
                                c.active ? 'bg-a-line-100 font-medium text-a-blue' : 'text-a-ink-700 hover:bg-a-line-100',
                              )}
                            >
                              <span className="flex-1">{c.label}</span>
                              {c.badge && <span className="text-xs tabular-nums text-a-ink-500">{c.badge}</span>}
                            </a>
                          ) : (
                            <span
                              title="Coming soon"
                              aria-disabled
                              className="flex h-7.5 cursor-default items-center gap-2 rounded pl-[34px] pr-2 text-base text-a-ink-450"
                            >
                              {c.label}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      {footer}
      {account}
    </nav>
  </>
);

/** Sidebar footer: "Settings" + three quick settings icons. */
export const SidebarFooter = ({
  onSettings,
  quick,
}: {
  onSettings: () => void;
  quick: { icon: IconName; label: string; onClick: () => void }[];
}) => (
  <div className="flex items-center justify-between border-t border-a-line-150 pt-2">
    <button
      type="button"
      onClick={onSettings}
      className="flex h-8 items-center gap-2 rounded px-2 font-medium text-a-ink-800 hover:bg-a-line-100"
    >
      <Icon name="settings" size={16} tone="muted" />
      Settings
    </button>
    <span className="flex items-center gap-0.5">
      {quick.map((q) => (
        <IconButton key={q.label} icon={q.icon} label={q.label} size="sm" onClick={q.onClick} />
      ))}
    </span>
  </div>
);

/** Account row trigger: store initials + name + owner, used as a Menu trigger. */
export const AccountTrigger = ({ brand, sub, open, onClick }: { brand: string; sub?: string; open?: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    aria-expanded={open}
    aria-label="Store and account"
    className="flex w-full min-w-0 items-center gap-2 rounded p-1 text-left hover:bg-a-line-100"
  >
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-a-blue-100 text-xs font-semibold text-a-blue">
      {initials(brand)}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-medium leading-4 text-a-ink-900">{brand}</span>
      {sub && <span className="block truncate text-xs leading-4 text-a-ink-450">{sub}</span>}
    </span>
    <span className="rotate-180 text-a-ink-500">
      <Icon name="down" size={14} />
    </span>
  </button>
);
export const initials = (s: string) =>
  s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

/** Assistant toggle square ("A"), gradient while open. */
export const AssistantToggle = ({ open, onClick }: { open: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={open ? 'Close Arya' : 'Open Arya'}
    aria-pressed={open}
    title="Arya (⌘J)"
    className={cn(
      'flex h-7 w-7 shrink-0 items-center justify-center rounded text-sm font-semibold text-white transition-[background] duration-120',
      open ? 'arya-grad' : 'bg-a-ink-900 hover:bg-a-ink-700',
    )}
  >
    A
  </button>
);

/** Right-hand slide-in panel (assistant). */
export const SidePanel = ({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) => {
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);
  if (!mounted) return null;
  return (
    <aside
      aria-label="Arya"
      aria-hidden={!open}
      className={cn(
        'fixed bottom-0 right-0 top-14 z-[60] flex w-full flex-col bg-white shadow-[-1px_0_0_#ECF1F6] transition-transform duration-200 sm:w-100 lg:top-0',
        open ? 'translate-x-0' : 'translate-x-full',
      )}
      onTransitionEnd={() => !open && setMounted(false)}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-a-line-100 px-4">
        <div className="flex min-w-0 items-center gap-2">{title}</div>
        <IconButton icon="x" label="Close" onClick={onClose} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
      {footer && <div className="shrink-0 border-t border-a-line-100 p-3">{footer}</div>}
    </aside>
  );
};

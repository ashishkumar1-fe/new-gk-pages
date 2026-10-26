import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  active?: boolean;
  onClick: () => void;
}
export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Frames only. Surfaces fill them. */
export const AppFrame = ({ sidebar, topbar, children }: { sidebar: ReactNode; topbar: ReactNode; children: ReactNode }) => (
  <div className="flex min-h-screen bg-bg text-ink">
    <aside className="hidden w-60 shrink-0 border-r border-line bg-surface md:block">{sidebar}</aside>
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="border-b border-line bg-surface">{topbar}</div>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  </div>
);

export const Sidebar = ({ brand, groups }: { brand: ReactNode; groups: NavGroup[] }) => (
  <nav className="flex h-full flex-col gap-4 p-4">
    <div className="px-2 text-lg font-semibold">{brand}</div>
    {groups.map((g) => (
      <div key={g.label}>
        <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted">{g.label}</p>
        {g.items.map((i) => (
          <a
            key={i.id}
            href={i.href}
            onClick={(e) => {
              e.preventDefault();
              i.onClick();
            }}
            className={cn(
              'block rounded px-2 py-1.5 text-sm',
              i.active ? 'bg-accent-soft font-medium text-accent-ink' : 'text-ink hover:bg-neutral-soft',
            )}
          >
            {i.label}
          </a>
        ))}
      </div>
    ))}
  </nav>
);

export const TopBar = ({ left, right }: { left?: ReactNode; right?: ReactNode }) => (
  <div className="flex h-12 items-center justify-between px-4">
    <div className="flex items-center gap-3 text-sm text-muted">{left}</div>
    <div className="flex items-center gap-3">{right}</div>
  </div>
);

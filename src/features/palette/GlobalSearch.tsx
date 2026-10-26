import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { commands } from '@/commands/registry';
import { resources } from '@/resources/registry';
import { flags } from '@/platform/flags';
import { staleTimeFor } from '@/platform/query/cachePolicy';
import { useUi, type SettingsTab } from '@/store/ui';
import { CommandPalette, Thumb, type IconName, type PaletteGroup, type PaletteHit } from '@/ui';
import { useGo } from '@/routes/_hooks/useGo';
import { navIconFor } from '@/features/nav';

/** Settings entries ⌘K can open (design: shell.tsx PAGES). */
const SETTINGS: { label: string; tab: SettingsTab; icon: IconName }[] = [
  { label: 'General settings', tab: 'general', icon: 'settings' },
  { label: 'Users and roles', tab: 'users', icon: 'users' },
  { label: 'Activity log', tab: 'activity', icon: 'history' },
  { label: 'Checkout and payments', tab: 'checkout', icon: 'card' },
  { label: 'Shipping and delivery', tab: 'shipping', icon: 'truck' },
  { label: 'Taxes and invoicing', tab: 'taxes', icon: 'receipt' },
  { label: 'Order configuration', tab: 'orders', icon: 'orders' },
  { label: 'Return rules', tab: 'returns', icon: 'refresh' },
  { label: 'Notifications', tab: 'notifications', icon: 'mail' },
  { label: 'Review settings', tab: 'reviews', icon: 'star' },
  { label: 'Search settings', tab: 'search', icon: 'search' },
  { label: 'SEO and robots.txt', tab: 'seo', icon: 'growth' },
  { label: 'Domains', tab: 'domains', icon: 'markets' },
  { label: 'Apps and AI tools', tab: 'apps', icon: 'apps' },
  { label: 'Metafields', tab: 'metafields', icon: 'content' },
];

/**
 * ⌘K: Arya · records (resources with search, via their own data.search) · commands exposed to the palette ·
 * settings and pages (d41). Data from the registry; the kit draws it.
 */
export const GlobalSearch = ({ compact, autoFocus, onDone }: { compact?: boolean; autoFocus?: boolean; onDone?: () => void }) => {
  const [q, setQ] = useState('');
  const go = useGo();
  const { ask, openSettings } = useUi();
  const t = q.trim().toLowerCase();
  const searchable = useMemo(() => resources.filter((r) => r.search?.enabled && r.data.search), []);
  const product = searchable.find((r) => r.name === 'product');

  // Only products have a working search API today; other resources join as their api modules are ported.
  const records = useQuery({
    queryKey: ['palette', 'product', t],
    queryFn: ({ signal }) => product!.data.search!(t, 4, { signal }),
    enabled: !!product && t.length >= 2,
    staleTime: staleTimeFor('lookup'),
  });

  const groups: PaletteGroup[] = [];
  if (t && flags.isOn('assistant'))
    groups.push({
      label: 'Arya',
      hits: [{ id: 'ask', label: `Ask Arya: “${q.trim()}”`, sub: 'Answers, actions and filters', arya: true, onPick: () => ask(q.trim()) }],
    });
  if (t && product && records.data?.length) {
    groups.push({
      label: product.label.plural,
      hits: (records.data as { id: string; title: string; status?: string; imageUrl?: string }[]).map((p) => ({
        id: p.id,
        label: p.title,
        sub: p.status,
        thumb: <Thumb src={p.imageUrl} size={24} />,
        onPick: () => go(product.routes.detail!.replace('$id', p.id)),
      })),
    });
  }
  if (t) {
    const cmds = commands
      .filter(
        (c) =>
          c.expose.palette &&
          (c.scope === 'page' || c.scope === 'global') &&
          (typeof c.label === 'string' ? c.label : c.id).toLowerCase().includes(t),
      )
      .slice(0, 4);
    if (cmds.length)
      groups.push({
        label: 'Commands',
        hits: cmds.map((c) => ({
          id: c.id,
          label: typeof c.label === 'string' ? c.label : c.id,
          sub: c.description,
          icon: 'sparkle',
          onPick: () => go(resources.find((r) => r.name === c.resource)?.routes.list ?? '/'),
        })),
      });
  }
  const allPages: PaletteHit[] = [
    { id: 'home', label: 'Home', icon: 'home', onPick: () => go('/') },
    ...resources
      .filter((r) => r.nav)
      .map((r) => ({ id: r.name, label: r.label.plural, icon: navIconFor(r.name, r.icon), onPick: () => go(r.routes.list) })),
    ...SETTINGS.map((s) => ({ id: `s-${s.tab}`, label: s.label, icon: s.icon, onPick: () => openSettings(s.tab) })),
  ];
  const pages = allPages.filter((p) => !t || p.label.toLowerCase().includes(t));
  const cap = t ? 4 : 6;
  if (pages.length)
    groups.push({ label: 'Settings & pages', hits: pages.slice(0, cap), more: pages.length > cap ? pages.length - cap : undefined });

  return <CommandPalette query={q} onQuery={setQ} groups={groups} compact={compact} autoFocus={autoFocus} onDone={onDone} />;
};

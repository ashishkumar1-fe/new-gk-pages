import { useEffect, useState } from 'react';
import { Outlet, useParams, useRouterState } from '@tanstack/react-router';
import { resources } from '@/resources/registry';
import { useMerchant } from '@/platform/useSession';
import { logout } from '@/platform/session';
import { flags } from '@/platform/flags';
import { useUi } from '@/store/ui';
import {
  AccountTrigger,
  AppFrame,
  AssistantDock,
  AssistantToggle,
  Dialog,
  IconButton,
  Menu,
  MobileBar,
  NotificationList,
  Popover,
  Sidebar,
  SidebarFooter,
  toast,
  type NavChild,
  type NavGroup,
  type NavItem,
} from '@/ui';
import { useGo } from './_hooks/useGo';
import { useShortcut } from './_hooks/useShortcut';
import { SupportBox } from '@/features/errors/SupportBox';
import { JobsIndicator } from '@/features/jobs/JobsIndicator';
import { JobFlows } from '@/features/jobs/JobFlows';
import { GlobalSearch } from '@/features/palette/GlobalSearch';
import { SettingsSheet } from '@/features/settings/SettingsSheet';
import { AssistantPanel } from '@/features/assistant/AssistantPanel';
import { CHILD_PLACEHOLDERS, COMING_SOON, navIconFor } from '@/features/nav';

/**
 * Chrome (design: shell.tsx): the sidebar holds logo, ⌘K search, nav from the registry, settings row and the account
 * row (store, notifications, Arya). Mobile gets a top bar. Arya docks at the bottom of every page but Home.
 */
export const StoreLayout = () => {
  const go = useGo();
  const { storeId } = useParams({ strict: false }) as { storeId?: string };
  const path = useRouterState({ select: (s) => s.location.pathname });
  const m = useMerchant();
  const ui = useUi();
  const [report, setReport] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [notifsRead, setNotifsRead] = useState(false);
  const base = `/store/${storeId}`;
  const isHome = path === base || path === `${base}/`;
  useEffect(() => ui.setSidebar(false), [path]);
  useShortcut('mod+j', () => ui.setAssistant(!ui.assistantOpen));

  // nav: top-level resources, children by nav.parent, design placeholders in between
  const on = (route: string) => path.startsWith(`${base}${route}`);
  const ordered = [...resources].filter((r) => r.nav).sort((a, b) => (a.nav!.position ?? 99) - (b.nav!.position ?? 99));
  const tops = ordered.filter((r) => !r.nav!.parent);
  const items: NavItem[] = [{ id: 'home', label: 'Home', icon: 'home', href: base, active: isHome, onClick: () => go('/') }];
  for (const r of tops) {
    const kids = ordered.filter((c) => c.nav!.parent === r.name);
    const children: NavChild[] = [
      ...kids.map((c) => ({
        id: c.name,
        label: c.label.plural,
        href: `${base}${c.routes.list}`,
        active: on(c.routes.list),
        onClick: () => go(c.routes.list),
      })),
      ...(CHILD_PLACEHOLDERS[r.name] ?? []).map((l) => ({ id: l, label: l })),
    ];
    const childOn = children.some((c) => c.active);
    items.push({
      id: r.name,
      label: r.label.plural,
      icon: navIconFor(r.name, r.icon),
      href: `${base}${r.routes.list}`,
      active: on(r.routes.list) && !childOn,
      open: on(r.routes.list) || childOn,
      onClick: () => go(r.routes.list),
      children: children.length ? children : undefined,
    });
    for (const p of COMING_SOON.filter((x) => x.after === r.name))
      items.push({ id: p.label, label: p.label, icon: p.icon, children: p.children?.map((l) => ({ id: l, label: l })) });
  }
  const groups: NavGroup[] = [
    { items },
    {
      label: 'Sales channels',
      items: [
        { id: 'storefront', label: 'Online store', icon: 'store' },
        { id: 'apps', label: 'Apps', icon: 'apps', chevron: true, onClick: () => ui.openSettings('apps') },
      ],
    },
  ];

  const brand = m.name ?? storeId ?? 'Store';
  const notifications = [
    { id: 'n1', icon: 'store' as const, title: 'Your store is live', body: `${storeId}.myratio.win`, at: 'Just now' },
    {
      id: 'n2',
      icon: 'products' as const,
      title: 'Products loaded',
      body: 'From the item service',
      at: 'Just now',
      onClick: () => go('/products'),
    },
  ];
  const unread = notifsRead ? 0 : notifications.length;
  const assistantOn = flags.isOn('assistant');

  const account = (
    <div className="mt-2 flex items-center gap-1 border-t border-a-line-150 pt-2">
      <Menu
        up
        align="left"
        items={[
          { label: brand, icon: 'store', disabled: true },
          { label: 'Switch store', icon: 'switch', onClick: () => go('/pick-store') },
          'sep',
          { label: 'Store settings', icon: 'settings', onClick: () => ui.openSettings('general') },
          { label: 'Manage account', icon: 'user', onClick: () => ui.openSettings('users') },
          { label: 'Keyboard shortcuts', icon: 'keyboard', onClick: () => toast('⌘K search · ⌘J Arya · ⌘S save · Esc closes menus') },
          { label: 'Report a problem', icon: 'alert', onClick: () => setReport(true) },
          'sep',
          { label: 'Log out', icon: 'logout', onClick: () => void logout().finally(() => go('/login')) },
        ]}
        trigger={(open, toggle) => <AccountTrigger brand={brand} sub={m.staff?.email ?? storeId} open={open} onClick={toggle} />}
      />
      <Popover
        up
        trigger={(open, toggle) => (
          <IconButton
            icon="bell"
            label={`Notifications${unread ? `, ${unread} unread` : ''}`}
            badge={unread || undefined}
            active={open}
            onClick={toggle}
          />
        )}
      >
        <NotificationList items={notifications} unread={unread} onMarkRead={() => setNotifsRead(true)} onViewAll={() => go('/orders')} />
      </Popover>
      {assistantOn && <AssistantToggle open={ui.assistantOpen} onClick={() => ui.setAssistant(!ui.assistantOpen)} />}
    </div>
  );

  return (
    <AppFrame
      panelOpen={ui.assistantOpen}
      panel={assistantOn && <AssistantPanel />}
      sidebar={
        <>
          <MobileBar
            onMenu={ui.toggleSidebar}
            onHome={() => go('/')}
            onSearch={() => setMobileSearch(true)}
            right={assistantOn && <AssistantToggle open={ui.assistantOpen} onClick={() => ui.setAssistant(!ui.assistantOpen)} />}
          />
          {mobileSearch && (
            <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-2 bg-white px-3 lg:hidden">
              <div className="flex-1">
                <GlobalSearch autoFocus onDone={() => setMobileSearch(false)} />
              </div>
              <button type="button" onClick={() => setMobileSearch(false)} className="px-2 text-base text-a-ink-600">
                Cancel
              </button>
            </div>
          )}
          <Sidebar
            open={ui.sidebarOpen}
            onClose={() => ui.setSidebar(false)}
            onHome={() => go('/')}
            search={<GlobalSearch compact />}
            groups={groups}
            footer={
              <>
                <JobsIndicator />
                <SidebarFooter
                  onSettings={() => ui.openSettings('general')}
                  quick={[
                    { icon: 'card', label: 'Checkout settings', onClick: () => ui.openSettings('checkout') },
                    { icon: 'truck', label: 'Shipping settings', onClick: () => ui.openSettings('shipping') },
                    { icon: 'markets', label: 'Domain settings', onClick: () => ui.openSettings('domains') },
                  ]}
                />
              </>
            }
            account={account}
          />
        </>
      }
    >
      <Outlet />
      {assistantOn && !isHome && !ui.assistantOpen && (
        <AssistantDock onOpen={() => ui.setAssistant(true)} context={contextLabel(path, base)} />
      )}
      <JobFlows />
      <SettingsSheet />
      <Dialog open={report} onOpenChange={setReport} title="Report a problem">
        <SupportBox />
      </Dialog>
    </AppFrame>
  );
};

const contextLabel = (path: string, base: string) => {
  const seg = path.slice(base.length).split('/').filter(Boolean);
  const r = resources.find((x) => x.routes.list === `/${seg[0] ?? ''}`);
  if (!r) return undefined;
  return seg.length > 1 ? `this ${r.label.singular.toLowerCase()}` : r.label.plural.toLowerCase();
};

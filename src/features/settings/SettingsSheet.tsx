import { useState } from 'react';
import { useMerchant } from '@/platform/useSession';
import { getStoreId } from '@/platform/merchant';
import { flags } from '@/platform/flags';
import { useUi, type SettingsTab } from '@/store/ui';
import { Badge, Button, Group, Icon, Row, Sheet, TextField, Toggle, initials, type IconName } from '@/ui';

/* Settings sheet (design: settings-sheet.tsx). Tabs and groups as in the design; sections whose backend is not
   ported show their rows read-only with a "Coming soon" badge instead of fake controls (capability off). */

const TABS: { id: SettingsTab; label: string; icon: IconName; group: string }[] = [
  { id: 'general', label: 'General', icon: 'home', group: 'Store' },
  { id: 'users', label: 'Users and roles', icon: 'users', group: 'Store' },
  { id: 'activity', label: 'Activity log', icon: 'history', group: 'Store' },
  { id: 'domains', label: 'Domains', icon: 'markets', group: 'Store' },
  { id: 'checkout', label: 'Checkout', icon: 'card', group: 'Selling' },
  { id: 'shipping', label: 'Shipping and delivery', icon: 'truck', group: 'Selling' },
  { id: 'taxes', label: 'Taxes and invoicing', icon: 'receipt', group: 'Selling' },
  { id: 'orders', label: 'Order configuration', icon: 'orders', group: 'Selling' },
  { id: 'returns', label: 'Return rules', icon: 'refresh', group: 'Selling' },
  { id: 'notifications', label: 'Notifications', icon: 'mail', group: 'Customers' },
  { id: 'reviews', label: 'Reviews', icon: 'star', group: 'Customers' },
  { id: 'search', label: 'Search', icon: 'search', group: 'Storefront' },
  { id: 'seo', label: 'SEO', icon: 'growth', group: 'Storefront' },
  { id: 'apps', label: 'Apps and AI tools', icon: 'apps', group: 'Platform' },
  { id: 'metafields', label: 'Metafields', icon: 'content', group: 'Platform' },
];
export const settingsTabs = TABS;

const Soon = () => <Badge tone="neutral">Coming soon</Badge>;

export const SettingsSheet = () => {
  const ui = useUi();
  const m = useMerchant();
  const [q, setQ] = useState('');
  const tabs = TABS.filter((t) => t.label.toLowerCase().includes(q.toLowerCase()));
  const tab = TABS.find((t) => t.id === ui.settingsTab) ?? TABS[0]!;
  const brand = m.name ?? getStoreId();
  const domain = `${getStoreId()}.myratio.win`;
  return (
    <Sheet
      open={!!ui.settingsTab}
      onOpenChange={(o) => !o && ui.closeSettings()}
      title={tab.label}
      side={
        <>
          <div className="flex items-center gap-2.5 px-5 pb-4 pt-6">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-a-blue text-xs font-semibold text-white">
              {initials(brand)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-semibold leading-5 text-a-ink-900">{brand}</span>
              <span className="block truncate text-xs leading-4 text-a-ink-500">{domain}</span>
            </span>
          </div>
          <div className="px-3 max-md:hidden">
            <TextField value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search settings" aria-label="Search settings" />
          </div>
          <nav className="flex gap-0.5 overflow-x-auto px-3 py-3 md:flex-col md:overflow-y-auto" aria-label="Settings">
            {tabs.map((t, i) => (
              <span key={t.id} className="contents">
                {t.group !== tabs[i - 1]?.group && (
                  <span className="hidden px-2 pb-1 pt-3 text-2xs font-semibold uppercase tracking-label text-a-ink-450 first:pt-0 md:block">
                    {t.group}
                  </span>
                )}
                <Button variant={t.id === tab.id ? 'secondary' : 'ghost'} icon={t.icon} onClick={() => ui.openSettings(t.id)}>
                  {t.label}
                </Button>
              </span>
            ))}
          </nav>
        </>
      }
    >
      <div className={tab.id === 'notifications' ? 'max-w-sheet-wide' : 'max-w-hero'}>
        {tab.id === 'general' && (
          <>
            <Group title="Store contact details">
              <Row k="Store name">{brand}</Row>
              <Row k="Email">{m.staff?.email ?? '—'}</Row>
              <Row k="Store ID">{getStoreId()}</Row>
              <Row k="Store address">India</Row>
            </Group>
            <Group title="Store defaults">
              <Row k="Currency display">Indian Rupee (INR ₹)</Row>
              <Row k="Unit system">Metric</Row>
              <Row k="Default weight unit">Kilogram (kg)</Row>
              <Row k="Time zone">(GMT+05:30) India Standard Time</Row>
            </Group>
          </>
        )}
        {tab.id === 'users' && (
          <Group title="Staff" hint="Roles and permissions come from user/details. Enforcement is off in v1." action={<Soon />}>
            <Row k={m.staff?.name ?? 'You'} sub={m.staff?.email}>
              <Badge tone="info">Owner</Badge>
            </Row>
            <Row k="Permissions">{m.can('write_products') ? 'All scopes pass (enforcement off)' : 'Restricted'}</Row>
          </Group>
        )}
        {tab.id === 'activity' && (
          <Group title="Activity" hint="Every command run is recorded with who, what and when." action={<Soon />}>
            <Row k="Command audit">Breadcrumbs and PostHog events today; a list lands here when the audit API is ported.</Row>
          </Group>
        )}
        {tab.id === 'domains' && (
          <Group title="Your domains">
            <Row k={domain}>
              <Badge tone="success">Primary</Badge>
            </Row>
            <Row k="Custom domain">
              <Soon />
            </Row>
          </Group>
        )}
        {tab.id === 'checkout' && (
          <div className="rounded-md p-5 shadow-card">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-a-blue-100 text-a-blue">
                <Icon name="card" size={20} />
              </span>
              <div className="flex-1">
                <div className="text-md font-semibold text-a-ink-900">GoKwik checkout</div>
                <p className="mt-0.5 text-a-ink-500">
                  UPI, cards, wallets and cash on delivery in one checkout, with COD risk scoring and prepaid nudges built in.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {['UPI', 'Cards', 'Netbanking', 'Wallets', 'COD', 'EMI'].map((x) => (
                    <Badge key={x} tone="info">
                      {x}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4">
                  <Badge tone="success">Connected</Badge>
                </div>
              </div>
            </div>
          </div>
        )}
        {tab.id === 'shipping' && (
          <Group title="Shipping profiles" hint="Profiles → zones (pincode rules) → rates." action={<Soon />}>
            <Row k="General" sub="Delhi NCR · Rest of India · North East & islands">
              3 zones
            </Row>
          </Group>
        )}
        {tab.id === 'taxes' && (
          <Group title="Taxes and invoicing" action={<Soon />}>
            <Row k="Prices">Inclusive of tax</Row>
            <Row k="Default tax code">GST 18%</Row>
            <Row k="Invoice prefix">INV/</Row>
          </Group>
        )}
        {tab.id === 'orders' && (
          <Group title="Order configuration" action={<Soon />}>
            <Row k="Customer requests">Returns only</Row>
            <Row k="Address edits after order">Off</Row>
          </Group>
        )}
        {tab.id === 'returns' && (
          <Group title="Return rules" action={<Soon />}>
            <Row k="Return window">7 days</Row>
            <Row k="Return shipping">Free</Row>
          </Group>
        )}
        {tab.id === 'notifications' && (
          <Group title="Customer notifications" hint="Order confirmation, shipping, delivery, returns." action={<Soon />}>
            {['Order confirmation', 'Shipping confirmation', 'Out for delivery', 'Delivered', 'Return request received'].map((n) => (
              <Row key={n} k={n}>
                <Toggle on onChange={() => {}} label={n} disabled />
              </Row>
            ))}
          </Group>
        )}
        {tab.id === 'reviews' && (
          <Group title="Review policy" action={<Soon />}>
            <Row k="Auto-publish">4 stars and above</Row>
          </Group>
        )}
        {tab.id === 'search' && (
          <Group title="Storefront search" action={<Soon />}>
            <Row k="Show inventory availability">On</Row>
            <Row k="Boost in-stock products">On</Row>
          </Group>
        )}
        {tab.id === 'seo' && (
          <Group title="SEO and robots.txt" action={<Soon />}>
            <Row k="Hide store from search engines">Off</Row>
            <Row k="robots.txt">Disallow /admin, /cart, /checkout</Row>
          </Group>
        )}
        {tab.id === 'apps' && (
          <Group title="Apps for your store" hint="Installed apps add commands and extension blocks.">
            {[
              ['Product reviews', 'Collect photo reviews after delivery.'],
              ['Loyalty and rewards', 'Points on every order, redeemable at checkout.'],
              ['WhatsApp marketing', 'Abandoned cart and order update flows.'],
              ['Unicommerce', 'Sync orders and inventory with your warehouse.'],
            ].map(([n, b]) => (
              <Row key={n} k={n!} sub={b}>
                <Button disabled>Install</Button>
              </Row>
            ))}
          </Group>
        )}
        {tab.id === 'metafields' && (
          <Group
            title="Product metafields"
            hint="Define a field once, fill it per product."
            action={flags.isOn('custom-fields') ? undefined : <Soon />}
          >
            {[
              ['What it does', 'Single line text · Product details'],
              ['Ingredients', 'Multi-line text · Product details'],
              ['Net quantity', 'Single line text · Label information'],
              ['Country of origin', 'Single line text · Label information'],
            ].map(([n, t]) => (
              <Row key={n} k={n!}>
                {t}
              </Row>
            ))}
          </Group>
        )}
      </div>
    </Sheet>
  );
};

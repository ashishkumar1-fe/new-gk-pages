import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { product } from '@/resources/product';
import { staleTimeFor } from '@/platform/query/cachePolicy';
import { useMerchant } from '@/platform/useSession';
import { getStoreId } from '@/platform/merchant';
import type { ProductListItem } from '@/domain/product/schema';
import { useUi } from '@/store/ui';
import { Badge, Button, Composer, Icon, ProgressBar, PromptChips, Thumb } from '@/ui';
import { useGo } from '../_hooks/useGo';

/**
 * Home (design: admin/(app)/page.tsx ReturningHome): metrics strip, Arya hero in the centre, action cards, setup guide.
 * Orders are not ported yet, so the metrics that need them show as pending; product cards are live.
 */
export const HomePage = () => {
  const go = useGo();
  const m = useMerchant();
  const ui = useUi();
  const products = useQuery({
    queryKey: [...product.keys.lists(), 'home'],
    queryFn: ({ signal }) => product.data.getList({ filters: {}, page: 1, limit: 50 }, { signal }),
    staleTime: staleTimeFor('list'),
  });
  const rows = (products.data?.items ?? []) as ProductListItem[];
  const low = rows.filter((p) => p.inventoryQuantity > 0 && p.inventoryQuantity < 10);
  const drafts = rows.filter((p) => p.status === 'draft');
  const brand = m.name ?? getStoreId();
  const domain = `${getStoreId()}.myratio.win`;
  const h = new Date().getHours();
  const greet = h < 5 ? 'Working late?' : h < 12 ? 'Good morning!' : h < 17 ? 'Good afternoon!' : 'Good evening!';
  const setup = [
    { key: 'product', label: 'Add your first product', done: rows.length > 0, go: () => go('/products/new') },
    { key: 'payments', label: 'Set up checkout', done: true, go: () => ui.openSettings('checkout') },
    { key: 'domain', label: 'Get a custom domain', done: false, go: () => ui.openSettings('domains') },
    { key: 'shipping', label: 'Review shipping rates', done: false, go: () => ui.openSettings('shipping') },
    { key: 'storefront', label: 'Customize your storefront', done: false, go: () => undefined },
  ];
  const doneCount = setup.filter((s) => s.done).length;

  return (
    <div className="relative animate-pagein overflow-hidden px-4 pb-24 sm:px-8">
      {/* metrics strip */}
      <div className="relative flex flex-wrap items-center gap-x-8 gap-y-3 pt-5">
        <span className="text-base text-a-ink-600 max-xl:w-full">Last 7 days · All channels</span>
        <div className="flex flex-1 flex-wrap justify-center gap-x-8 gap-y-3 max-xl:justify-start">
          {[
            { label: 'Total sales', value: '—', sub: 'orders not connected' },
            { label: 'Orders', value: '—', sub: 'orders not connected' },
            { label: 'Products', value: products.data ? String(products.data.total) : '…', sub: `${drafts.length} drafts` },
            { label: 'Low stock', value: products.data ? String(low.length) : '…', sub: 'under 10 units' },
          ].map((x) => (
            <div key={x.label} className="text-center max-xl:text-left">
              <div className="text-sm text-a-ink-600">{x.label}</div>
              <div className="mt-0.5 flex items-center justify-center gap-1.5 max-xl:justify-start">
                <span className="text-base font-semibold tabular-nums text-a-ink-900">{x.value}</span>
                <span className="text-sm text-a-ink-450">{x.sub}</span>
              </div>
            </div>
          ))}
        </div>
        <span className="flex items-center gap-1.5 text-base text-a-ink-600 max-xl:hidden">
          Live at <b className="font-medium text-a-ink-900">{domain}</b>
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-a-green/40" />
            <span className="relative h-2.5 w-2.5 rounded-full border-2 border-a-green" />
          </span>
        </span>
      </div>

      {/* hero */}
      <section className="relative mx-auto flex min-h-hero max-w-hero flex-col justify-center py-12 text-center">
        <p className="text-xl font-medium text-a-ink-550 sm:text-4xl">{greet}</p>
        <h1 className="text-3xl font-semibold text-a-ink-900 sm:text-5xl">Let&apos;s continue growing {brand}.</h1>
        <div className="mt-7 text-left">
          <Composer
            big
            beam
            placeholder="Work with Arya"
            onSend={(t) => ui.ask(t)}
            quick={['Give me my daily brief', 'Draft a new product', 'Show draft products', "What's running low on stock?"]}
            recents={[]}
          />
        </div>
        <div className="mt-5">
          <PromptChips
            items={[
              { label: 'Low stock', count: low.length, prompt: "What's running low on stock?" },
              { label: 'Drafts to publish', count: drafts.length, prompt: 'Which drafts are ready to publish?' },
              { label: 'Write descriptions', prompt: 'Write descriptions for products missing one' },
              { label: 'Daily brief', prompt: 'Give me my daily brief' },
            ]}
            onPick={(p) => ui.ask(p)}
          />
        </div>
      </section>

      {/* action cards */}
      <section className="relative mx-auto grid max-w-page grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {low.length > 0 && (
          <ActionCard
            title="Restock before you sell out"
            body={`${low.length} product${low.length === 1 ? ' is' : 's are'} under 10 units.`}
            cta="Restock with Arya"
            arya
            onCta={() => ui.ask("What's running low on stock?")}
          >
            <ul className="flex flex-col gap-2.5">
              {low.slice(0, 3).map((p) => (
                <li key={p.id} className="flex items-center gap-2.5">
                  <Thumb src={p.imageUrl} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-a-ink-800">{p.title}</span>
                    <span className="mt-1 block">
                      <ProgressBar value={Math.max(4, p.inventoryQuantity * 10)} label={`${p.title} stock`} tone="warn" />
                    </span>
                  </span>
                  <span className="w-12 text-right text-xs tabular-nums text-a-warn">{p.inventoryQuantity} left</span>
                </li>
              ))}
            </ul>
          </ActionCard>
        )}
        <ActionCard
          title="Your products"
          body={
            rows[0] ? (
              <>
                Latest: <b className="font-semibold text-a-ink-800">{rows[0].title}</b>.
              </>
            ) : (
              'Add your first product to start selling.'
            )
          }
          cta="View products"
          onCta={() => go('/products')}
        >
          <ul className="flex flex-col gap-1">
            {rows.slice(0, 4).map((p, k) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => go(`/products/${p.id}`)}
                  className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-a-page ${k === 0 ? 'bg-a-page' : ''}`}
                >
                  <Thumb src={p.imageUrl} size={28} />
                  <span className="min-w-0 flex-1 truncate text-sm text-a-blue">{p.title}</span>
                  <Badge tone={p.status === 'active' ? 'success' : p.status === 'draft' ? 'warning' : 'neutral'}>{p.status}</Badge>
                </button>
              </li>
            ))}
          </ul>
        </ActionCard>
        {drafts.length > 0 && (
          <ActionCard
            title="Polish your product pages"
            body={`${drafts.length} draft${drafts.length === 1 ? ' needs' : 's need'} a description or a Google listing before publishing.`}
            cta="Write with Arya"
            arya
            onCta={() => ui.ask('Write descriptions for my draft products')}
          >
            <div className="rounded-md p-3 shadow-card">
              <div className="text-2xs text-a-ok">{domain} › products</div>
              <div className="mt-0.5 truncate text-md text-a-google">
                {drafts[0]?.title} | {brand}
              </div>
              <div className="mt-1 flex flex-col gap-1">
                <div className="a-skel h-2 w-full rounded-sm" />
                <div className="a-skel h-2 w-3/4 rounded-sm" />
              </div>
            </div>
          </ActionCard>
        )}
        <ActionCard
          title="Get a custom domain"
          body={`You're live on ${domain}. Give your store a branded URL that's easy to find, trust and remember.`}
          cta="Set up domain"
          onCta={() => ui.openSettings('domains')}
        >
          <div className="a-ring flex h-9 w-full items-center rounded px-3 text-base">
            <span className="text-a-ink-900">{brand.toLowerCase().replace(/[^a-z0-9]+/g, '')}</span>
            <span className="h-4 w-px animate-pulse bg-a-blue" />
            <span className="text-a-ink-450">.in</span>
          </div>
        </ActionCard>
        <ActionCard
          title="Review shipping rates"
          body="Defaults are set for your location. Adjust zones and rates any time."
          cta="Review shipping"
          onCta={() => ui.openSettings('shipping')}
        >
          <div className="w-full overflow-hidden rounded shadow-card">
            {[
              ['Delhi NCR', 'Free'],
              ['Rest of India', 'from ₹49'],
              ['North East & islands', 'from ₹99'],
            ].map(([z, r]) => (
              <div key={z} className="flex justify-between border-b border-a-line-100 px-3 py-2 text-xs text-a-ink-700 last:border-0">
                <span>{z}</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </ActionCard>
        <ActionCard
          title="Customize your storefront"
          body="Sections, colours and type. Or describe the change and let Arya draft it."
          cta="Customize storefront"
          onCta={() => ui.ask('Help me customize my storefront')}
        >
          <div className="mx-auto w-full max-w-mock rounded-md bg-white p-2 shadow-card">
            <div className="truncate rounded-sm px-2 py-0.5 text-center text-2xs text-a-ink-500 shadow-card">{domain}</div>
            <div className="mt-1.5 h-16 rounded-sm bg-a-line-100" />
            <div className="mt-1.5 grid grid-cols-4 gap-1.5">
              {rows.slice(0, 4).map((p) => (
                <div key={p.id} className="flex aspect-square items-center justify-center overflow-hidden rounded-sm bg-a-line-100">
                  <Thumb src={p.imageUrl} size={40} />
                </div>
              ))}
            </div>
          </div>
        </ActionCard>
      </section>

      {/* setup guide */}
      {doneCount < setup.length && (
        <div className="fixed bottom-5 right-5 z-20">
          <SetupGuide steps={setup} done={doneCount} />
        </div>
      )}
    </div>
  );
};

const ActionCard = ({
  title,
  body,
  children,
  cta,
  onCta,
  arya,
}: {
  title: string;
  body?: ReactNode;
  children?: ReactNode;
  cta: string;
  onCta: () => void;
  arya?: boolean;
}) => (
  <div className="a-card relative flex min-h-card flex-col overflow-hidden rounded-xl p-5">
    <h3 className="text-lg font-semibold text-a-ink-900">{title}</h3>
    {body && <div className="mt-1.5 text-base leading-5 text-a-ink-600">{body}</div>}
    <div className="flex flex-1 flex-col justify-center py-5">{children}</div>
    <div>
      <Button variant={arya ? 'arya' : 'secondary'} icon={arya ? 'sparkle' : undefined} onClick={onCta}>
        {cta}
      </Button>
    </div>
  </div>
);

const SetupGuide = ({ steps, done }: { steps: { key: string; label: string; done: boolean; go: () => void }[]; done: number }) => {
  const ui = useUi();
  const [open, setOpen] = useState(false);
  return open ? (
    <div className="w-guide animate-up rounded-md bg-white shadow-pop">
      <div className="flex items-center justify-between px-4 pt-3.5">
        <span className="font-semibold text-a-ink-900">Setup guide</span>
        <button
          type="button"
          aria-label="Close setup guide"
          onClick={() => setOpen(false)}
          className="flex h-7 w-7 items-center justify-center rounded text-a-ink-500 hover:bg-a-line-100"
        >
          <Icon name="x" />
        </button>
      </div>
      <div className="px-4 pb-2 pt-1 text-xs text-a-ink-500">
        {done} of {steps.length} done
      </div>
      <div className="mx-4">
        <ProgressBar value={(done / steps.length) * 100} label="Setup progress" />
      </div>
      <ul className="p-2">
        {steps.map((s) => (
          <li key={s.key}>
            <button
              type="button"
              onClick={s.go}
              className="flex h-9 w-full items-center gap-2.5 rounded px-2 text-left text-base hover:bg-a-line-100"
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full ${s.done ? 'bg-a-blue text-white' : 'shadow-ring-line'}`}
              >
                {s.done && <Icon name="check" size={12} strokeWidth={3} />}
              </span>
              <span className={`flex-1 ${s.done ? 'text-a-ink-450 line-through' : 'text-a-ink-800'}`}>{s.label}</span>
              <Icon name="chevron" size={14} tone="faint" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2 border-t border-a-line-100 px-4 py-2.5 text-xs text-a-ink-500">
        <button type="button" onClick={() => ui.ask('What should I do first?')} className="text-a-blue hover:underline">
          Stuck? Ask Arya
        </button>
        to do any of these.
      </div>
    </div>
  ) : (
    <button type="button" onClick={() => setOpen(true)} className="flex h-9 items-center gap-2 rounded-md bg-white px-3 shadow-lift">
      <span className="h-1.5 w-1.5 rounded-full bg-a-blue" />
      <span className="text-base font-medium text-a-ink-900">Setup guide</span>
      <span className="rounded-sm bg-a-blue-100 px-1.5 text-xs font-medium tabular-nums text-a-blue">
        {done}/{steps.length}
      </span>
    </button>
  );
};

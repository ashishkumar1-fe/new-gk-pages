import type { ComponentType } from 'react';
import type { Product } from '@/domain/product/schema';
import type { Library } from '@/domain/library/schema';
import { dimensions, formatBytes, kindLabel, kindTone, usedInLabel } from '@/domain/library/format';
import { formatMoney } from '@/domain/shared/format';
import { flags } from '@/platform/flags';
import { Badge, Thumb } from '@/ui';
import { ExtensionPoint } from '@/extensions/ExtensionPoint';
import { CommandButtons } from '@/routes/_templates/CommandButtons';
import { useCommandContext } from '@/routes/_hooks/useCommandContext';

/** The one map from a ComponentId in a resource definition to a React component. Extension targets resolve here too. */
export interface SectionProps {
  record?: unknown;
  draft?: Record<string, unknown>;
  calc?: unknown;
}

const VariantsCard = ({ record }: SectionProps) => {
  const p = record as Product | undefined;
  if (!p) return <p className="text-sm text-muted">Variants appear after the product is created.</p>;
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs uppercase tracking-wide text-muted">
        <tr>
          <th className="py-1">Variant</th>
          <th className="py-1">SKU</th>
          <th className="py-1">Price</th>
          <th className="py-1">Stock</th>
        </tr>
      </thead>
      <tbody>
        {p.variants.map((v) => (
          <tr key={v.id} className="border-t border-line">
            <td className="py-2">{v.title}</td>
            <td className="py-2 font-mono text-xs">{v.sku ?? '—'}</td>
            <td className="py-2 tabular-nums">{formatMoney(v.price)}</td>
            <td className="py-2">
              {v.inventoryTracked ? <span className="tabular-nums">{v.inventoryQuantity}</span> : <Badge tone="neutral">Not tracked</Badge>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/** Per-location stock for a product without options. A v3 immediate write (inventory.adjust), not part of the editor draft. */
const InventorySection = ({ record }: SectionProps) => {
  const p = record as Product | undefined;
  const ctx = useCommandContext({ surface: 'button', record: p?.variants[0] });
  if (!p) return <p className="text-sm text-muted">Stock can be set after the product is created.</p>;
  const v = p.variants[0];
  if (!v?.inventoryTracked) return <p className="text-sm text-muted">Inventory is not tracked for this product.</p>;
  return (
    <div className="flex items-center justify-between text-sm">
      <span>
        Available across locations: <strong className="tabular-nums">{v.inventoryQuantity}</strong>
      </span>
      <CommandButtons ids={['inventory.adjust']} ctx={ctx} primaryLast={false} size="sm" />
    </div>
  );
};

/** Runtime custom fields for the owner type. Capability off until the metafield-definitions read is ported (no fixture yet). */
const CustomFieldsSection = () =>
  flags.isOn('custom-fields') ? <p className="text-sm text-muted">Custom fields for this record.</p> : null;

/** Design's insights strip. Capability off: no backend. */
const ProductInsightsStrip = () => (flags.isOn('product-insights') ? <p className="text-sm text-muted">Insights</p> : null);

const OrderSummary = ({ record }: SectionProps) => <pre className="text-xs">{JSON.stringify(record, null, 2)}</pre>;

/** Content library: the file itself (preview + facts). Read-only; the editor fields sit below it. */
const AssetPreview = ({ record }: SectionProps) => {
  const a = record as Library | undefined;
  if (!a) return null;
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="flex h-48 w-full shrink-0 items-center justify-center overflow-hidden rounded-md bg-a-page sm:w-64">
        {a.kind === 'image' ? (
          <img src={a.url} alt={a.altText ?? ''} className="max-h-full max-w-full object-contain" />
        ) : (
          <Thumb src={a.thumbnailUrl} size={84} />
        )}
      </div>
      <dl className="grid flex-1 gap-x-4 gap-y-1.5 text-sm" style={{ gridTemplateColumns: 'auto 1fr' }}>
        <dt className="text-a-ink-450">File</dt>
        <dd className="truncate font-mono text-xs text-a-ink-800">{a.fileName}</dd>
        <dt className="text-a-ink-450">Type</dt>
        <dd>
          <Badge tone={kindTone(a.kind)}>{kindLabel(a.kind)}</Badge>
        </dd>
        <dt className="text-a-ink-450">Size</dt>
        <dd className="tabular-nums">{formatBytes(a.sizeBytes)}</dd>
        <dt className="text-a-ink-450">Dimensions</dt>
        <dd className="tabular-nums">{dimensions(a)}</dd>
        <dt className="text-a-ink-450">MIME</dt>
        <dd className="text-a-ink-600">{a.mimeType}</dd>
      </dl>
    </div>
  );
};

/** Where the asset is referenced. The count comes from the service; the per-place list lands when usage lookups are ported. */
const AssetUsage = ({ record }: SectionProps) => {
  const a = record as Library | undefined;
  if (!a) return null;
  return a.usedIn === 0 ? (
    <p className="text-sm text-a-ink-500">Not used anywhere yet. Safe to delete.</p>
  ) : (
    <p className="text-sm text-a-ink-800">
      Referenced in <b className="font-semibold">{usedInLabel(a.usedIn)}</b>. Remove it there before deleting.
    </p>
  );
};

export const components: Record<string, ComponentType<SectionProps>> = {
  variantsCard: VariantsCard,
  inventorySection: InventorySection,
  customFields: CustomFieldsSection,
  productInsights: ProductInsightsStrip,
  orderSummary: OrderSummary,
  assetPreview: AssetPreview,
  assetUsage: AssetUsage,
};

const EXTENSION_PREFIX = 'extension:';
/** `extension:<target>` ids render that target's ExtensionPoint; anything else comes from the map. */
export const resolveComponent = (id: string): ComponentType<SectionProps> | undefined => {
  if (!id.startsWith(EXTENSION_PREFIX)) return components[id];
  const target = id.slice(EXTENSION_PREFIX.length);
  const Ext = ({ record }: SectionProps) => (
    <ExtensionPoint target={target} context={{ recordId: (record as { id?: string } | undefined)?.id }} />
  );
  Ext.displayName = `Extension(${target})`;
  return Ext;
};

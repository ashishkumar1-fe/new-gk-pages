import type { ComponentType } from 'react';
import type { Product } from '@/domain/product/schema';
import { formatMoney } from '@/domain/shared/format';
import { flags } from '@/platform/flags';
import { Badge } from '@/ui';
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

export const components: Record<string, ComponentType<SectionProps>> = {
  variantsCard: VariantsCard,
  inventorySection: InventorySection,
  customFields: CustomFieldsSection,
  productInsights: ProductInsightsStrip,
  orderSummary: OrderSummary,
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

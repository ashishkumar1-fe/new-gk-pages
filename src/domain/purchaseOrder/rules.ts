import type { PurchaseOrder } from './schema';
import { money, multiply, type Money } from '@/domain/shared/money';

// Pure rules, ported as today. Each cites the gk-pages source it came from (docs/architecture/domain/inventory.md#purchase-order).
// Unused-type guard for entities whose rules take narrower inputs:
export type { PurchaseOrder as _PurchaseOrder };

type PoStatus = PurchaseOrder['status'];
type PoLine = PurchaseOrder['lines'][number];

/** components/purchase-orders/purchase-order-form-components/PurchaseOrderItemsCard.tsx:107 — quantity × cost; tax excluded. */
export const poLineTotal = (l: Pick<PoLine, 'quantityOrdered' | 'costPerUnit'>): Money => multiply(l.costPerUnit, l.quantityOrdered);

/** purchase-orders/PurchaseOrderDetails.tsx:167; Σ line totals, tax excluded */
export const poTotals = (po: Pick<PurchaseOrder, 'lines'>): Money => money(po.lines.reduce((n, l) => n + poLineTotal(l).minor, 0));

const PO_STATUS: Record<string, PoStatus> = {
  Draft: 'draft',
  Ordered: 'ordered',
  Partially_Received: 'partially_received',
  Received: 'received',
  Closed: 'closed',
};

/** store/purchase-orders/index.ts:154 — exact (case-sensitive) wire values only; anything else → draft. */
export const poStatus = (wire: unknown): PoStatus =>
  typeof wire === 'string' && Object.prototype.hasOwnProperty.call(PO_STATUS, wire) ? (PO_STATUS[wire] as PoStatus) : 'draft';

/** store/purchase-orders/index.ts:179 — reference number, else `PO-` + first 8 chars of the id. */
export const poDisplayNumber = (po: Pick<PurchaseOrder, 'id' | 'referenceNumber'>): string =>
  po.referenceNumber || `PO-${po.id.substring(0, 8)}`;

export interface PoActions {
  primary?: string;
  more: string[];
}

/**
 * components/purchase-orders/PurchaseOrderDetails.tsx:804 (primary) and :687 / :714 (More actions).
 * draft: Mark as ordered; more edit, delete. ordered / partially received: Receive; more close.
 * received: Receive; more close (v1 choice — today :714 falls back to the draft menu; needs sign-off).
 * closed: no primary; more reopen. Export PDF is not a command and is left out.
 * Deviation from today (per docs/architecture/domain/inventory.md): gk-pages :700 / :705 also offer Edit for ordered / partially received.
 */
export const poActions = (po: Pick<PurchaseOrder, 'status'>): PoActions => {
  switch (po.status) {
    case 'draft':
      return { primary: 'purchaseOrder.markOrdered', more: ['purchaseOrder.update', 'purchaseOrder.delete'] };
    case 'ordered':
    case 'partially_received':
    case 'received':
      return { primary: 'purchaseOrder.openReceive', more: ['purchaseOrder.close'] };
    case 'closed':
      return { more: ['purchaseOrder.reopen'] };
  }
};

/** PurchaseOrderDetails.tsx:804 */
export const poPrimaryAction = (po: Pick<PurchaseOrder, 'status'>) => poActions(po).primary;

export interface PoDraft {
  supplierId?: string;
  destinationLocationId?: string;
  referenceNumber?: string; // optional: empty → auto PO-… number
  lines: { quantityOrdered: number; costPerUnit: Money }[];
}

/**
 * components/purchase-orders/purchase-order-form-components/ValidationSchemas.ts:36 (supplier), :37 (destination),
 * :48 (≥ 1 item), :16 (quantity ≥ 1), :19 (price ≥ 0). Returns field errors; empty object = valid.
 * Reference is not required (gk-pages pre-fills an auto number, so :35 never fires).
 */
export const poValidate = (d: PoDraft): Record<string, string> => {
  const e: Record<string, string> = {};
  if (!d.supplierId) e.supplier = 'Supplier is required';
  if (!d.destinationLocationId) e.destinationLocationId = 'Destination is required';
  if (d.lines.length < 1) e.lines = 'At least one item is required';
  d.lines.forEach((l, i) => {
    if (!(l.quantityOrdered >= 1)) e[`lines.${i}.quantityOrdered`] = 'Quantity must be at least 1';
    if (!(l.costPerUnit.minor >= 0)) e[`lines.${i}.costPerUnit`] = 'Price must be at least 0';
  });
  return e;
};

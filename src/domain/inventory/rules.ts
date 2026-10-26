import type { Inventory, MutableQuantityName, AdjustReason } from './schema';

// Pure rules, ported as today. Each cites the gk-pages source it came from (docs/architecture/domain/inventory.md).
// Unused-type guard for entities whose rules take narrower inputs:
export type { Inventory as _Inventory };

/** inventory/VariantAdjustPopover.tsx:64; incoming excluded */
export const onHand = (l: Pick<Inventory, 'available' | 'committed' | 'unavailable'>) =>
  l.available + l.committed + l.unavailable.reserved + l.unavailable.damaged + l.unavailable.safetyStock + l.unavailable.qualityControl;

/** store/inventory/index.ts:161 */
export const unavailableTotal = (l: Pick<Inventory, 'unavailable'>) =>
  l.unavailable.reserved + l.unavailable.damaged + l.unavailable.safetyStock + l.unavailable.qualityControl;

// ── Bulk edit (inventory list) ───────────────────────────────────────────────

export type BulkEditField = 'available' | 'onHand';
/** One edit per row; the last-touched field wins and the other column derives. */
export interface BulkEdit {
  field: BulkEditField;
  value: number | null;
}
type BulkEditLevel = { available?: number; onHand?: number };

/** components/ui/Modals/BulkInventoryEditModal.tsx:37 — committed + unavailable, fixed while editing; links the two numbers. */
export const bulkEditBuffer = (l: BulkEditLevel): number => (l.onHand ?? 0) - (l.available ?? 0);

/**
 * components/ui/Modals/BulkInventoryEditModal.tsx:37 (bufferOf) and :68 (previewFor).
 * Edit available → onHand = value + buffer; edit onHand → available = value − buffer. Negatives allowed.
 * Returns null when there is no edit or the value is empty / NaN.
 */
export const bulkEditDerive = (l: BulkEditLevel, edit: BulkEdit | undefined): { available: number; onHand: number } | null => {
  if (!edit || edit.value === null || Number.isNaN(edit.value)) return null;
  const buffer = bulkEditBuffer(l);
  if (edit.field === 'available') return { available: edit.value, onHand: edit.value + buffer };
  return { onHand: edit.value, available: edit.value - buffer };
};

/** BulkInventoryEditModal.tsx:76 (changedRows) — a row counts only when a derived number differs from today's. */
export const bulkEditChanged = (l: BulkEditLevel, edit: BulkEdit | undefined): boolean => {
  const p = bulkEditDerive(l, edit);
  if (!p) return false;
  return p.available !== (l.available ?? 0) || p.onHand !== (l.onHand ?? 0);
};

/** One row of the bulk write; both fields are absolute targets. store/inventory/index.ts:610 (BulkInventoryEditRow). */
export interface BulkEditRow {
  inventoryItemId: string;
  locationId?: string;
  onHand?: number;
  available?: number;
  compareAvailable?: number;
}

export const BULK_EDIT_NOTHING_CHANGED = 'Nothing to update — change at least one quantity';

/**
 * components/ui/Modals/BulkInventoryEditModal.tsx:100 (handleSave): turn the changed rows' edits into write rows.
 * available edit → { available, compareAvailable: today's available }; onHand edit → { onHand }.
 */
export const bulkEditRows = (
  rows: (BulkEditLevel & { id: string; inventoryItemId: string; locationId: string })[],
  edits: Record<string, BulkEdit | undefined>,
): { ok: true; rows: BulkEditRow[] } | { ok: false; message: typeof BULK_EDIT_NOTHING_CHANGED } => {
  const changed = rows.filter((r) => bulkEditChanged(r, edits[r.id]));
  if (changed.length === 0) return { ok: false, message: BULK_EDIT_NOTHING_CHANGED };
  return {
    ok: true,
    rows: changed.map((r) => {
      const edit = edits[r.id] as BulkEdit;
      return edit.field === 'available'
        ? { inventoryItemId: r.inventoryItemId, locationId: r.locationId, available: edit.value as number, compareAvailable: r.available }
        : { inventoryItemId: r.inventoryItemId, locationId: r.locationId, onHand: edit.value as number };
    }),
  };
};

export interface BulkEditWrite {
  reason: AdjustReason;
  setOnHand: { inventoryItemId: string; locationId: string; onHand: number }[];
  setQuantities: { inventoryItemId: string; locationId: string; quantityName: 'available'; quantity: number; compareQuantity?: number }[];
  skipped: number; // rows missing an item or location id
}

/**
 * store/inventory/index.ts:630 (updateInventoryItemsBulkAction; split at :644).
 * Rows lacking item or location (after falling back to the request location) are skipped.
 * A row with `available` goes to set-quantities with `compare_quantity`; on-hand-only rows go to set-on-hand;
 * `available` wins when both are present. Reason defaults to `correction`. Empty → 'Nothing to update'.
 */
export const bulkEditWrite = (
  items: BulkEditRow[],
  opts: { locationId?: string; reason?: AdjustReason } = {},
): { ok: true; write: BulkEditWrite } | { ok: false; message: 'Nothing to update' } => {
  const reason = opts.reason || 'correction';
  const locationOf = (r: BulkEditRow) => r.locationId || opts.locationId || '';
  const rows = items.filter((r) => r.inventoryItemId && locationOf(r));
  const setOnHand = rows
    .filter((r) => r.available === undefined && r.onHand !== undefined)
    .map((r) => ({ inventoryItemId: r.inventoryItemId, locationId: locationOf(r), onHand: r.onHand as number }));
  const setQuantities = rows
    .filter((r) => r.available !== undefined)
    .map((r) => ({
      inventoryItemId: r.inventoryItemId,
      locationId: locationOf(r),
      quantityName: 'available' as const,
      quantity: r.available as number,
      ...(r.compareAvailable !== undefined ? { compareQuantity: r.compareAvailable } : {}),
    }));
  if (!setOnHand.length && !setQuantities.length) return { ok: false, message: 'Nothing to update' };
  return { ok: true, write: { reason, setOnHand, setQuantities, skipped: items.length - rows.length } };
};

// ── Adjust popover (variant stock table / inventory list) ────────────────────

export type AdjustAction = 'set' | 'add' | 'remove';
export type AdjustableLevel = {
  available?: number;
  committed?: number;
  incoming?: number;
  unavailable?: Partial<Inventory['unavailable']>;
};

/** VariantAdjustPopover.tsx:64 (sumOnHand) — the popover sums buckets rather than reading the server on_hand. */
const adjustOnHand = (l: AdjustableLevel) =>
  (l.available ?? 0) +
  (l.committed ?? 0) +
  (l.unavailable?.reserved ?? 0) +
  (l.unavailable?.damaged ?? 0) +
  (l.unavailable?.safetyStock ?? 0) +
  (l.unavailable?.qualityControl ?? 0);

/** components/products/variantsComponents/VariantAdjustPopover.tsx:72 (currentBucketValue). */
export const adjustCurrent = (l: AdjustableLevel, bucket: MutableQuantityName): number => {
  switch (bucket) {
    case 'onHand':
      return adjustOnHand(l);
    case 'available':
      return l.available ?? 0;
    case 'incoming':
      return l.incoming ?? 0;
    default:
      return l.unavailable?.[bucket] ?? 0;
  }
};

export type AdjustWrite =
  | { kind: 'setOnHand'; onHand: number }
  | { kind: 'set'; quantityName: Exclude<MutableQuantityName, 'onHand'>; quantity: number }
  | { kind: 'adjust'; quantityName: Exclude<MutableQuantityName, 'onHand'>; delta: number };

/**
 * components/products/variantsComponents/VariantAdjustPopover.tsx:112 (preview) and :140 (write choice).
 * add / remove → delta (set → delta 0, after = value). On-hand is derived, so any on-hand action becomes a
 * set-on-hand absolute target (`after`). Returns null for an empty / NaN value.
 */
export const adjustPreview = (l: AdjustableLevel, bucket: MutableQuantityName, action: AdjustAction, value: number | null) => {
  if (value === null || Number.isNaN(value)) return null;
  const before = adjustCurrent(l, bucket);
  const delta = action === 'add' ? value : action === 'remove' ? -value : 0;
  const after = action === 'set' ? value : before + delta;
  const write: AdjustWrite =
    bucket === 'onHand'
      ? { kind: 'setOnHand', onHand: after }
      : action === 'set'
        ? { kind: 'set', quantityName: bucket, quantity: value }
        : { kind: 'adjust', quantityName: bucket, delta };
  return { before, after, delta, write };
};

/**
 * components/products/variantsComponents/VariantAdjustPopover.tsx:120 (handleSave guards, :121-:132). Returns the error message
 * or null. Negative targets are left to the backend (NEGATIVE_TARGET).
 */
export const adjustValidate = (action: AdjustAction, value: number | null): string | null => {
  if (value === null || Number.isNaN(value)) return 'Enter a quantity';
  if (!Number.isInteger(value)) return 'Quantity must be a whole number';
  if (action !== 'set' && value <= 0) return 'Enter a quantity greater than 0';
  return null;
};

// ── Receive (purchase order and transfer share the screen logic) ─────────────

export interface ReceiveLine {
  id: string;
  inventoryItemId?: string;
  quantityOrdered: number;
  quantityReceived?: number;
  quantityRejected?: number;
}
export interface ReceiveDraft {
  accept: number;
  reject: number;
}

const already = (l: ReceiveLine) => l.quantityOrdered - (l.quantityReceived || 0) - (l.quantityRejected || 0);

/**
 * pages/purchase-orders/ReceiveInventory.tsx:250 (Remaining column, :259); same at
 * pages/transfers/ReceiveTransferInventory.tsx:268. ordered − prev received − prev rejected − accept − reject, floor 0.
 */
export const receiveRemaining = (l: ReceiveLine, d: Partial<ReceiveDraft> = {}): number =>
  Math.max(0, already(l) - (d.accept || 0) - (d.reject || 0));

/**
 * pages/purchase-orders/ReceiveInventory.tsx:217 / :240 (InputNumber max): accept ≤ remaining − reject,
 * reject ≤ remaining − accept, each floored at 0.
 */
export const receiveCaps = (l: ReceiveLine, d: Partial<ReceiveDraft> = {}): { maxAccept: number; maxReject: number } => ({
  maxAccept: Math.max(0, already(l) - (d.reject || 0)),
  maxReject: Math.max(0, already(l) - (d.accept || 0)),
});

/**
 * pages/purchase-orders/ReceiveInventory.tsx:43 (handleQuantityChange) and :73 (handleRejectedChange).
 * Strings parse with parseFloat (else 0), nullish → 0. The changed field is stored as typed; the other field is
 * clamped down to what remains after it.
 */
export const receiveChange = (
  l: ReceiveLine,
  d: ReceiveDraft,
  field: keyof ReceiveDraft,
  raw: number | string | null | undefined,
): ReceiveDraft => {
  const value = typeof raw === 'number' ? raw : typeof raw === 'string' ? parseFloat(raw) || 0 : 0;
  const remainingAfter = Math.max(0, already(l) - value);
  if (field === 'accept') return { accept: value, reject: d.reject > remainingAfter ? remainingAfter : d.reject };
  return { reject: value, accept: d.accept > remainingAfter ? remainingAfter : d.accept };
};

/** pages/purchase-orders/ReceiveInventory.tsx:103 (statusBarData): totals including this session. */
export const receiveTotals = (lines: ReceiveLine[], drafts: Record<string, Partial<ReceiveDraft> | undefined>) => ({
  total: lines.reduce((n, l) => n + l.quantityOrdered, 0),
  received: lines.reduce((n, l) => n + (l.quantityReceived || 0) + (drafts[l.id]?.accept || 0), 0),
  rejected: lines.reduce((n, l) => n + (l.quantityRejected || 0) + (drafts[l.id]?.reject || 0), 0),
});

export interface ReceivePayloadLine {
  lineId: string;
  inventoryItemId?: string;
  quantityReceived: number;
  quantityRejected: number;
}

/**
 * Lines with accept > 0 or reject > 0 only; empty → nothing to send (navigate back).
 * Purchase order (pages/purchase-orders/ReceiveInventory.tsx:130-139): this session's deltas, with inventoryItemId ('' when missing).
 * Transfer (pages/transfers/ReceiveTransferInventory.tsx:132-145): cumulative totals (previous + this session).
 */
export const receivePayload = (
  kind: 'purchaseOrder' | 'transfer',
  lines: ReceiveLine[],
  drafts: Record<string, Partial<ReceiveDraft> | undefined>,
): ReceivePayloadLine[] =>
  lines
    .filter((l) => (drafts[l.id]?.accept || 0) > 0 || (drafts[l.id]?.reject || 0) > 0)
    .map((l) => {
      const accept = drafts[l.id]?.accept || 0;
      const reject = drafts[l.id]?.reject || 0;
      return kind === 'purchaseOrder'
        ? { lineId: l.id, inventoryItemId: l.inventoryItemId || '', quantityReceived: accept, quantityRejected: reject }
        : { lineId: l.id, quantityReceived: (l.quantityReceived || 0) + accept, quantityRejected: (l.quantityRejected || 0) + reject };
    });

import type { Order } from './schema';
import { money, subtract, multiply, type Money } from '@/domain/shared/money';

// Pure rules, ported as today. Each cites the gk-pages source it came from (docs/architecture/domain/orders.md).
// Source paths are relative to gk-pages `src/`.
// Unused-type guard for entities whose rules take narrower inputs:
export type { Order as _Order };

type LineItem = Order['lineItems'][number];
type DiscountApplication = NonNullable<Order['discountApplications']>[number];

/** Trimmed; empty, "null" and "undefined" read as absent. modules/order/transformer.ts:38 (normalizeOrderReference) */
const present = (value: unknown): boolean => {
  const s = String(value ?? '')
    .trim()
    .toLowerCase();
  return s !== '' && s !== 'null' && s !== 'undefined';
};

// ---- Status ----

/**
 * Cancelled when `cancelledAt` or `cancelReason` is set; archived when `closedAt` is set; else the wire status
 * lowercased, defaulting to open. Cancelled and archived are independent badges; this picks the one status value.
 * modules/order/transformer.ts:108 (normalizeOrderStatus)
 */
export const orderStatus = (o: {
  status?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  closedAt?: string | null;
}): Order['status'] | (string & NonNullable<unknown>) => {
  if (present(o.cancelledAt) || present(o.cancelReason)) return 'cancelled';
  if (present(o.closedAt)) return 'archived';
  const s = String(o.status ?? '')
    .trim()
    .toLowerCase();
  return !s || s === 'null' || s === 'undefined' ? 'open' : s;
};

/** os-order writes `partial` and `partially_fulfilled` for the same state. modules/order/fulfilmentStatus.ts:17 */
export const PARTIAL_FULFILMENT_VALUES = ['partial', 'partially_fulfilled', 'partially fulfilled'];

/**
 * `partial` / `partially fulfilled` → `partially_fulfilled`; null or empty → `unfulfilled`; else lowercased.
 * modules/order/fulfilmentStatus.ts:19 (isPartiallyFulfilled)
 */
export const normaliseFulfillment = (status: unknown): Order['fulfillmentStatus'] | (string & NonNullable<unknown>) => {
  const s = String(status ?? '')
    .trim()
    .toLowerCase();
  if (PARTIAL_FULFILMENT_VALUES.includes(s)) return 'partially_fulfilled';
  if (!s || s === 'null' || s === 'undefined') return 'unfulfilled';
  return s;
};

// ---- Payment ----

/** orders/OrderDetails.tsx:537 */
export const isCod = (o: Pick<Order, 'payment'>) => o.payment.method.toLowerCase().includes('cod');

// ---- Cancel ----

/** OrderDetails.tsx:525 */
export const anyFulfilled = (o: Pick<Order, 'fulfillmentStatus'>) =>
  ['fulfilled', 'partially_fulfilled', 'shipped', 'delivered'].includes(o.fulfillmentStatus);

/** OrderDetails.tsx:714 */
export const canCancel = (o: Pick<Order, 'status' | 'fulfillmentStatus'>) => o.status !== 'cancelled' && !anyFulfilled(o);

/**
 * Bulk cancel is offered only when EVERY selected order is cancellable: not cancelled, and not
 * fulfilled / partially fulfilled / shipped / delivered. An empty selection offers nothing.
 * components/ui/Headers/OrdersHeader.tsx:293
 */
export const canBulkCancel = (rows: { cancelledAt?: string | null; fulfillmentStatus?: string | null }[]): boolean =>
  rows.length > 0 &&
  rows.every(
    (o) =>
      !o.cancelledAt && !['fulfilled', 'partially_fulfilled', 'shipped', 'delivered'].includes(normaliseFulfillment(o.fulfillmentStatus)),
  );

/** orders/CancelOrderModal.tsx:46 */
export const autoRefundEligible = (o: Pick<Order, 'totals' | 'payment' | 'financialStatus'>) =>
  o.totals.total.minor > 0 && !isCod(o) && !['refunded', 'partially_refunded', 'refund_pending'].includes(o.financialStatus);

/** OrderDetails.tsx:546 */
export const refundBlockReason = (o: Pick<Order, 'payment' | 'financialStatus'>): string | undefined =>
  isCod(o)
    ? 'COD orders cannot be refunded — no payment was captured.'
    : o.financialStatus === 'refunded'
      ? 'This order has already been fully refunded.'
      : o.financialStatus === 'partially_refunded'
        ? 'This order has already been partially refunded.'
        : o.financialStatus === 'refund_pending'
          ? 'A refund for this order is already pending. Wait for it to settle before issuing another.'
          : undefined;

// ---- Edit ----

/** The `source` os-order stamps on discounts an edit session wrote. modules/order/constants.ts:111 */
export const ORDER_EDIT_DISCOUNT_SOURCE = 'os_order_edit_session';
const ORDER_SOURCE_DRAFT_ORDER = 'draft_order'; // modules/order/constants.ts:129

/** An order-level (`target_selection` 'all', the default) application not written by an edit session. modules/order/constants.ts:137 */
const isForeignOrderLevelDiscount = (a: DiscountApplication | null | undefined): boolean => {
  if (!a || typeof a !== 'object') return true;
  if (a.source === ORDER_EDIT_DISCOUNT_SOURCE) return false;
  return String(a.targetSelection ?? 'all').toLowerCase() === 'all';
};

/**
 * Any discount code blocks. Otherwise any application blocks unless an edit session wrote it or its type is
 * manual (empty type counts as manual). On a draft-converted order, any order-level application that is not
 * the edit session's also blocks. Mirrors os-order isOnlyOwnEditSessionDiscount.
 * modules/order/constants.ts:145
 */
export const hasEditBlockingDiscount = (o: Partial<Pick<Order, 'discountCodes' | 'discountApplications' | 'sourceName'>>): boolean => {
  if ((o.discountCodes ?? []).length > 0) return true;
  const applications = o.discountApplications ?? [];
  if (applications.length === 0) return false;
  const isDraftOrder =
    String(o.sourceName ?? '')
      .trim()
      .toLowerCase() === ORDER_SOURCE_DRAFT_ORDER;
  if (isDraftOrder && applications.some(isForeignOrderLevelDiscount)) return true;
  return !applications.every((a) => {
    if (!a || typeof a !== 'object') return false;
    if (a.source === ORDER_EDIT_DISCOUNT_SOURCE) return true;
    return String(a.type || 'manual').toLowerCase() === 'manual';
  });
};

/** OrderDetails.tsx:563; modules/order/constants.ts:173 */
export const editBlockReason = (
  o: Pick<Order, 'status' | 'fulfillmentStatus' | 'discountCodes'> & Partial<Pick<Order, 'discountApplications' | 'sourceName'>>,
): string | undefined =>
  o.status === 'cancelled'
    ? 'Cancelled orders cannot be edited.'
    : o.fulfillmentStatus === 'fulfilled'
      ? 'Fulfilled orders cannot be edited.'
      : hasEditBlockingDiscount(o)
        ? 'Orders with a discount applied cannot be edited.'
        : undefined;

/** components/orders/OrderDetails.tsx:60 */
export const SHOPIFY_ORDER_EDIT_BLOCK_MESSAGE = 'This order cannot be edited by this app.';

/** `source_name` is shopify (trimmed, case-insensitive): Edit shows SHOPIFY_ORDER_EDIT_BLOCK_MESSAGE. OrderDetails.tsx:145 */
export const isShopifySourced = (o: Pick<Order, 'sourceName'>): boolean =>
  String(o.sourceName ?? '')
    .trim()
    .toLowerCase() === 'shopify';

/**
 * Quantity increases are only accepted on unfulfilled COD orders that are not paid / partially paid.
 * modules/order/orderEditHelpers.ts:155
 */
export const canIncreaseQuantities = (o: Pick<Order, 'payment' | 'financialStatus' | 'fulfillmentStatus'>): boolean =>
  isCod(o) &&
  o.financialStatus !== 'paid' &&
  o.financialStatus !== 'partially_paid' &&
  normaliseFulfillment(o.fulfillmentStatus) === 'unfulfilled';

/** A line with any allocation above zero already carries a committed discount; no new line discount. modules/order/orderEditHelpers.ts:183 */
export const hasCommittedLineDiscount = (line: { discountAllocations?: { amount: Money }[] }): boolean =>
  (line.discountAllocations ?? []).some((a) => a.amount.minor > 0);

/** Label beside the preview's signed refund amount (shown as its absolute value). components/orders/EditOrder.tsx:1250 */
export const editAmountLabel = (refundAmount: Money): 'Refund owed' | 'Additional collection required' | 'No amount due' =>
  refundAmount.minor > 0 ? 'Refund owed' : refundAmount.minor < 0 ? 'Additional collection required' : 'No amount due';

// ---- Payment card ----

/**
 * Paid = total − outstanding (either sign: a refund owed means the customer paid more than the total).
 * Shown only when outstanding is non-zero; the outstanding row reads "Refund owed" when negative, else
 * "Amount to collect", with its absolute value. components/orders/PaymentSection.tsx:1522, :1552
 */
export const paid = (
  totals: Pick<Order['totals'], 'total' | 'outstanding'>,
): { paid: Money; label: 'Refund owed' | 'Amount to collect'; outstanding: Money } | undefined => {
  if (totals.outstanding.minor === 0) return undefined;
  return {
    paid: subtract(totals.total, totals.outstanding),
    label: totals.outstanding.minor < 0 ? 'Refund owed' : 'Amount to collect',
    outstanding: money(Math.abs(totals.outstanding.minor), totals.outstanding.currency),
  };
};

/** IGST applied by the local fallback. components/orders/PaymentSection.tsx:597 */
export const FALLBACK_TAX_RATE_PERCENT = 18;

/**
 * Tax shown on the payment card: a saved draft's tax wins, then the server's `total_tax`; otherwise 0 when
 * there are no items or taxes are off, else (subtotal − applied discount) × 18%, rounded to the paisa.
 * components/orders/PaymentSection.tsx:1240 (calculateTax); rate :597
 */
export const displayTax = (i: {
  savedTax?: Money;
  serverTax?: Money;
  hasItems: boolean;
  taxesApplied: boolean;
  subtotal: Money;
  appliedDiscount?: Money;
}): Money => {
  if (i.savedTax) return i.savedTax;
  if (i.serverTax) return i.serverTax;
  if (!i.hasItems || !i.taxesApplied) return money(0, i.subtotal.currency);
  const base = i.appliedDiscount ? subtract(i.subtotal, i.appliedDiscount) : i.subtotal;
  return money((base.minor * FALLBACK_TAX_RATE_PERCENT) / 100, base.currency);
};

// ---- Line items ----

const isRemoved = (l: Pick<LineItem, 'quantity' | 'currentQuantity' | 'originalQuantity'>) =>
  Number(l.currentQuantity ?? l.quantity ?? 0) === 0 && Number(l.originalQuantity ?? l.quantity ?? 0) > 0;

/** Lines an edit removed: current quantity 0 and original quantity above 0. components/orders/OrderDetails.tsx:155 */
export const removedLines = <L extends Pick<LineItem, 'quantity' | 'currentQuantity' | 'originalQuantity'>>(lines: L[]): L[] =>
  lines.filter(isRemoved);

/** Every line that is not removed. components/orders/OrderDetails.tsx:160 */
export const activeLines = <L extends Pick<LineItem, 'quantity' | 'currentQuantity' | 'originalQuantity'>>(lines: L[]): L[] =>
  lines.filter((l) => !isRemoved(l));

export interface LineGroup<L> {
  key: 'unfulfilled' | 'fulfilled' | 'items' | 'removed';
  label: 'Unfulfilled' | 'Fulfilled' | 'Items' | 'Removed';
  rows: { line: L; units: number }[];
}

const LABELS = { unfulfilled: 'Unfulfilled', fulfilled: 'Fulfilled', items: 'Items', removed: 'Removed' } as const;
const group = <L>(key: LineGroup<L>['key'], rows: LineGroup<L>['rows']): LineGroup<L> => ({ key, label: LABELS[key], rows });

/**
 * Status bands of the order summary; band rows add back up to the line quantity. With the fulfillment split:
 * Unfulfilled = fulfillable units, Fulfilled = quantity − fulfillable (clamped). Without it, one Items band of
 * quantity. Removed lines form their own band at their original quantity. Empty bands are omitted.
 * modules/order/lineItemGroups.ts:24
 */
export const lineGroups = <L extends Pick<LineItem, 'quantity' | 'fulfillableQuantity' | 'originalQuantity'>>(i: {
  lineItems?: L[];
  removedLineItems?: L[];
  fulfillmentSplitEnabled: boolean;
}): LineGroup<L>[] => {
  const lineItems = i.lineItems ?? [];
  const removed = i.removedLineItems ?? [];
  const groups: LineGroup<L>[] = [];
  if (i.fulfillmentSplitEnabled) {
    const unfulfilled = lineItems
      .filter((l) => Number(l.fulfillableQuantity ?? 0) > 0)
      .map((line) => ({ line, units: Number(line.fulfillableQuantity) }));
    const fulfilled = lineItems
      .map((line) => {
        const q = Number(line.quantity ?? 0);
        const f = Number(line.fulfillableQuantity ?? 0);
        return { line, units: Math.max(0, Math.min(q, q - f)) };
      })
      .filter(({ units }) => units > 0);
    if (unfulfilled.length) groups.push(group('unfulfilled', unfulfilled));
    if (fulfilled.length) groups.push(group('fulfilled', fulfilled));
  } else if (lineItems.length) {
    const rows = lineItems.map((line) => ({ line, units: Number(line.quantity ?? 0) })).filter(({ units }) => units > 0);
    if (rows.length) groups.push(group('items', rows));
  }
  if (removed.length)
    groups.push(
      group(
        'removed',
        removed.map((line) => ({ line, units: Number(line.originalQuantity ?? line.quantity ?? 0) })),
      ),
    );
  return groups;
};

/**
 * Price a band row shows net of its line discounts. Allocations (negative ones ignored) cover the line's current
 * quantity, so a row of `units` carries its share; a line with current quantity 0 carries none.
 * discounted unit = unit − allocations ÷ current quantity (rounded to the paisa here; gk-pages keeps the fraction
 * and rounds only on display); total = unit × units − round(allocations × units ÷ current quantity), floored at 0.
 * modules/order/lineItemGroups.ts:80
 */
export const rowPricing = (
  line: Pick<LineItem, 'unitPrice' | 'currentQuantity'> & { discountAllocations?: { amount: Money }[] },
  units: number,
): { unit: Money; discountedUnit: Money; total: Money; isDiscounted: boolean } => {
  const unit = line.unitPrice;
  const discount = (line.discountAllocations ?? []).reduce((sum, a) => sum + Math.max(0, a.amount.minor || 0), 0);
  const qty = Number(line.currentQuantity ?? 0) || 0;
  if (discount <= 0 || qty <= 0) return { unit, discountedUnit: unit, total: multiply(unit, units), isDiscounted: false };
  return {
    unit,
    discountedUnit: money(Math.max(0, unit.minor - discount / qty), unit.currency),
    total: money(Math.max(0, unit.minor * units - Math.round((discount * units) / qty)), unit.currency),
    isDiscounted: true,
  };
};

// ---- Fulfillment ----

/** Domain shape of a fulfillment hold, as far as the view reads it (docs/architecture/domain/orders.md#fulfillment). */
export interface FulfillmentHoldLike {
  isActive: boolean;
  scope: 'order' | 'line_items';
  /** Units per line; holds placed before quantities name lines in `lineItemIds` instead. */
  lineItems?: { lineItemId: string; quantity: number }[];
  lineItemIds?: string[];
}
export interface FulfillmentLineRef {
  lineItemId: string;
  quantity: number;
  locationId?: string | null;
}

export interface FulfilLineView<H> {
  lineItemId: string;
  /** Units that can ship now: fulfillable minus held. */
  remaining: number;
  /** Units an active hold covers. */
  heldQuantity: number;
  held: boolean;
  coveringHolds: H[];
  locationId: string | null;
}

export interface FulfillmentView<H, S> {
  status: string;
  lines: FulfilLineView<H>[];
  /** The Unfulfilled card: only shippable lines, grouped by location in first-seen order. */
  groups: { locationId: string | null; lines: FulfilLineView<H>[] }[];
  shipments: S[];
  activeHolds: H[];
  isLegacyExternallyFulfilled: boolean;
  unheldRemaining: number;
  canFulfil: boolean;
  canHold: boolean;
}

/** Floor; non-finite or negative → 0; capped at floor(remaining). modules/fulfillment/transformer.ts:81 */
export const clampQuantity = (value: unknown, remaining: number): number => {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, Math.max(0, Math.floor(Number(remaining) || 0)));
};

/** Active holds that are order-scoped, or line-scoped and name the line (by units or by id). modules/fulfillment/transformer.ts:62 */
export const coveringHolds = <H extends FulfillmentHoldLike>(lineItemId: string, holds: H[]): H[] =>
  holds.filter(
    (h) =>
      h.isActive !== false &&
      (h.scope === 'order' ||
        (h.scope === 'line_items' &&
          ((h.lineItemIds ?? []).some((id) => String(id) === String(lineItemId)) ||
            (h.lineItems ?? []).some((l) => String(l.lineItemId) === String(lineItemId))))),
  );

/**
 * Merge held and fulfillable lines into one row per line (a line can be in both server arrays). An order-scoped
 * hold covers every unit. Lines with nothing remaining and nothing held are dropped. Legacy externally fulfilled =
 * status 'fulfilled' with no shipments. Can fulfil / hold = not legacy, not cancelled, and unheld remaining > 0.
 * modules/fulfillment/transformer.ts:86 (deriveFulfillmentView)
 */
export const fulfillmentView = <H extends FulfillmentHoldLike, S>(
  data: {
    status?: string | null;
    fulfillments?: S[];
    holds?: H[];
    fulfillableLineItems?: FulfillmentLineRef[];
    heldLineItems?: FulfillmentLineRef[];
  },
  orderMeta: { cancelled?: boolean } = {},
): FulfillmentView<H, S> => {
  const activeHolds = (data.holds ?? []).filter((h) => h && h.isActive !== false);
  const shipments = (data.fulfillments ?? []).filter(Boolean);
  const heldRefs = (data.heldLineItems ?? []).filter(Boolean);
  const heldById = new Map<string, number>();
  heldRefs.forEach((ref) => {
    const key = String(ref.lineItemId);
    heldById.set(key, (heldById.get(key) ?? 0) + clampQuantity(ref.quantity, Number(ref.quantity)));
  });
  const toLine = (ref: FulfillmentLineRef, shippable: number): FulfilLineView<H> => {
    const key = String(ref.lineItemId);
    const covering = coveringHolds(key, activeHolds);
    const wholeOrderHeld = covering.some((h) => h.scope === 'order');
    const heldQuantity = wholeOrderHeld ? shippable + (heldById.get(key) ?? 0) : (heldById.get(key) ?? 0);
    return {
      lineItemId: ref.lineItemId,
      remaining: wholeOrderHeld ? 0 : shippable,
      heldQuantity,
      held: heldQuantity > 0 || covering.length > 0,
      coveringHolds: covering,
      locationId: ref.locationId || null,
    };
  };
  const seen = new Set<string>();
  const lines = [
    ...(data.fulfillableLineItems ?? []).filter(Boolean).map((ref) => toLine(ref, clampQuantity(ref.quantity, Number(ref.quantity)))),
    ...heldRefs.map((ref) => toLine(ref, 0)),
  ].filter((l) => {
    const key = String(l.lineItemId);
    if (seen.has(key)) return false;
    seen.add(key);
    return l.remaining > 0 || l.heldQuantity > 0;
  });
  const groups: FulfillmentView<H, S>['groups'] = [];
  lines
    .filter((l) => l.remaining > 0)
    .forEach((line) => {
      const g = groups.find((x) => x.locationId === line.locationId);
      if (g) g.lines.push(line);
      else groups.push({ locationId: line.locationId, lines: [line] });
    });
  const status = data.status || '';
  const isLegacyExternallyFulfilled = status === 'fulfilled' && shipments.length === 0;
  const unheldRemaining = lines.reduce((sum, l) => sum + l.remaining, 0);
  const open = !isLegacyExternallyFulfilled && !orderMeta.cancelled;
  return {
    status,
    lines,
    groups,
    shipments,
    activeHolds,
    isLegacyExternallyFulfilled,
    unheldRemaining,
    canFulfil: open && unheldRemaining > 0,
    canHold: open && unheldRemaining > 0,
  };
};

type BulkFulfilRow = { cancelledAt?: string | null; fulfillmentStatus?: string | null };

/** Some row is not cancelled and not fully fulfilled (fulfilled / shipped / delivered). modules/fulfillment/transformer.ts:426 */
export const canBulkFulfil = (rows: BulkFulfilRow[]): boolean =>
  rows.some((r) => !r.cancelledAt && !['fulfilled', 'shipped', 'delivered'].includes(String(r.fulfillmentStatus || '').toLowerCase()));

/**
 * Offer "Mark as fulfilled" when something is selected and either part of the selection is off the current page
 * (visible rows fewer than selected ids), or some visible row can be fulfilled. os-order skips and reports the rest.
 * modules/fulfillment/transformer.ts:443
 */
export const shouldOfferBulkFulfil = (selectedIds: unknown[], visibleRows: BulkFulfilRow[]): boolean => {
  if (!selectedIds.length) return false;
  if (visibleRows.length < selectedIds.length) return true;
  return canBulkFulfil(visibleRows);
};

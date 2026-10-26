import { describe, it, expect } from 'vitest';
import {
  canCancel,
  refundBlockReason,
  autoRefundEligible,
  editBlockReason,
  orderStatus,
  normaliseFulfillment,
  canBulkCancel,
  hasEditBlockingDiscount,
  isShopifySourced,
  SHOPIFY_ORDER_EDIT_BLOCK_MESSAGE,
  canIncreaseQuantities,
  hasCommittedLineDiscount,
  editAmountLabel,
  paid,
  displayTax,
  removedLines,
  activeLines,
  lineGroups,
  rowPricing,
  fulfillmentView,
  clampQuantity,
  canBulkFulfil,
  shouldOfferBulkFulfil,
  type FulfillmentHoldLike,
} from './rules';
import { money } from '@/domain/shared/money';

const base = {
  status: 'open' as const,
  fulfillmentStatus: 'unfulfilled' as const,
  financialStatus: 'paid' as const,
  payment: { method: 'UPI', gateways: [] },
  totals: { total: money(44900) } as never,
  discountCodes: [],
};
const cod = { method: 'Cash on Delivery (COD)', gateways: [] };

describe('order rules (pinned to gk-pages OrderDetails.tsx)', () => {
  it('COD orders cannot be refunded', () => {
    expect(refundBlockReason({ ...base, payment: cod })).toBe('COD orders cannot be refunded — no payment was captured.');
  });
  it('paid UPI order can be refunded', () => {
    expect(refundBlockReason(base)).toBeUndefined();
  });
  it('refund block messages', () => {
    expect(refundBlockReason({ ...base, financialStatus: 'refunded' })).toBe('This order has already been fully refunded.');
    expect(refundBlockReason({ ...base, financialStatus: 'partially_refunded' })).toBe('This order has already been partially refunded.');
    expect(refundBlockReason({ ...base, financialStatus: 'refund_pending' })).toBe(
      'A refund for this order is already pending. Wait for it to settle before issuing another.',
    );
  });
  it('fulfilled orders cannot be cancelled', () => {
    expect(canCancel({ ...base, fulfillmentStatus: 'fulfilled' })).toBe(false);
  });
  it('auto-refund needs a captured, unrefunded payment', () => {
    expect(autoRefundEligible(base)).toBe(true);
    expect(autoRefundEligible({ ...base, financialStatus: 'refund_pending' })).toBe(false);
  });
  it('a discount code blocks editing', () => {
    expect(editBlockReason({ ...base, discountCodes: [{ code: 'X', amount: money(1), type: 'fixed' }] })).toBe(
      'Orders with a discount applied cannot be edited.',
    );
  });
});

describe('orderStatus (modules/order/transformer.ts:108)', () => {
  it('cancelledAt or cancelReason → cancelled, even when closed', () => {
    expect(orderStatus({ status: 'open', cancelledAt: '2026-01-01', closedAt: '2026-01-02' })).toBe('cancelled');
    expect(orderStatus({ cancelReason: 'customer' })).toBe('cancelled');
  });
  it('"null" strings are absent', () => {
    expect(orderStatus({ status: 'open', cancelledAt: 'null', cancelReason: ' undefined ' })).toBe('open');
  });
  it('closedAt → archived', () => {
    expect(orderStatus({ status: 'open', closedAt: '2026-01-02' })).toBe('archived');
  });
  it('wire status lowercased, default open', () => {
    expect(orderStatus({ status: ' OPEN ' })).toBe('open');
    expect(orderStatus({ status: null })).toBe('open');
    expect(orderStatus({ status: 'null' })).toBe('open');
  });
});

describe('normaliseFulfillment (modules/order/fulfilmentStatus.ts)', () => {
  it('folds both partial spellings', () => {
    expect(normaliseFulfillment('partial')).toBe('partially_fulfilled');
    expect(normaliseFulfillment('Partially Fulfilled')).toBe('partially_fulfilled');
    expect(normaliseFulfillment('partially_fulfilled')).toBe('partially_fulfilled');
  });
  it('null / empty → unfulfilled; others lowercased', () => {
    expect(normaliseFulfillment(null)).toBe('unfulfilled');
    expect(normaliseFulfillment('')).toBe('unfulfilled');
    expect(normaliseFulfillment('Fulfilled')).toBe('fulfilled');
  });
});

describe('canBulkCancel (ui/Headers/OrdersHeader.tsx:293)', () => {
  it('needs a non-empty selection', () => {
    expect(canBulkCancel([])).toBe(false);
  });
  it('every row must be cancellable', () => {
    expect(canBulkCancel([{ fulfillmentStatus: 'unfulfilled' }, { fulfillmentStatus: null }])).toBe(true);
    expect(canBulkCancel([{ fulfillmentStatus: 'unfulfilled' }, { fulfillmentStatus: 'Partially fulfilled' }])).toBe(false);
    expect(canBulkCancel([{ fulfillmentStatus: 'unfulfilled', cancelledAt: '2026-01-01' }])).toBe(false);
    expect(canBulkCancel([{ fulfillmentStatus: 'delivered' }])).toBe(false);
  });
});

describe('hasEditBlockingDiscount (modules/order/constants.ts:145)', () => {
  it('no codes and no applications → not blocked', () => {
    expect(hasEditBlockingDiscount({})).toBe(false);
  });
  it('any code blocks', () => {
    expect(hasEditBlockingDiscount({ discountCodes: [{ code: 'X', amount: money(1), type: 'fixed' }] })).toBe(true);
  });
  it('manual (or untyped) and edit-session applications do not block', () => {
    expect(
      hasEditBlockingDiscount({ discountApplications: [{ type: 'manual' }, {}, { source: 'os_order_edit_session', type: 'script' }] }),
    ).toBe(false);
  });
  it('a non-manual application blocks', () => {
    expect(hasEditBlockingDiscount({ discountApplications: [{ type: 'automatic' }] })).toBe(true);
  });
  it('on a draft-converted order an order-level foreign application blocks, even if manual', () => {
    expect(hasEditBlockingDiscount({ sourceName: 'draft_order', discountApplications: [{ type: 'manual' }] })).toBe(true);
    expect(
      hasEditBlockingDiscount({ sourceName: 'draft_order', discountApplications: [{ type: 'manual', targetSelection: 'explicit' }] }),
    ).toBe(false);
    expect(hasEditBlockingDiscount({ sourceName: 'draft_order', discountApplications: [{ source: 'os_order_edit_session' }] })).toBe(false);
  });
  it('editBlockReason uses it, after cancelled and fulfilled', () => {
    expect(editBlockReason({ ...base, discountApplications: [{ type: 'automatic' }] })).toBe(
      'Orders with a discount applied cannot be edited.',
    );
    expect(editBlockReason({ ...base, status: 'cancelled', discountApplications: [{ type: 'automatic' }] })).toBe(
      'Cancelled orders cannot be edited.',
    );
    expect(editBlockReason({ ...base, fulfillmentStatus: 'fulfilled' })).toBe('Fulfilled orders cannot be edited.');
    expect(editBlockReason(base)).toBeUndefined();
  });
});

describe('isShopifySourced (OrderDetails.tsx:145)', () => {
  it('shopify source, any case', () => {
    expect(isShopifySourced({ sourceName: ' Shopify ' })).toBe(true);
    expect(isShopifySourced({ sourceName: 'draft_order' })).toBe(false);
    expect(isShopifySourced({})).toBe(false);
    expect(SHOPIFY_ORDER_EDIT_BLOCK_MESSAGE).toBe('This order cannot be edited by this app.');
  });
});

describe('canIncreaseQuantities (modules/order/orderEditHelpers.ts:155)', () => {
  it('COD, unpaid, unfulfilled only', () => {
    expect(canIncreaseQuantities({ payment: cod, financialStatus: 'pending', fulfillmentStatus: 'unfulfilled' })).toBe(true);
    expect(canIncreaseQuantities({ payment: cod, financialStatus: 'paid', fulfillmentStatus: 'unfulfilled' })).toBe(false);
    expect(canIncreaseQuantities({ payment: cod, financialStatus: 'partially_paid', fulfillmentStatus: 'unfulfilled' })).toBe(false);
    expect(canIncreaseQuantities({ payment: cod, financialStatus: 'pending', fulfillmentStatus: 'partially_fulfilled' })).toBe(false);
    expect(
      canIncreaseQuantities({ payment: { method: 'UPI', gateways: [] }, financialStatus: 'pending', fulfillmentStatus: 'unfulfilled' }),
    ).toBe(false);
  });
});

describe('hasCommittedLineDiscount (orderEditHelpers.ts:183)', () => {
  it('any allocation above zero', () => {
    expect(hasCommittedLineDiscount({ discountAllocations: [{ amount: money(0) }, { amount: money(100) }] })).toBe(true);
    expect(hasCommittedLineDiscount({ discountAllocations: [{ amount: money(0) }] })).toBe(false);
    expect(hasCommittedLineDiscount({})).toBe(false);
  });
});

describe('editAmountLabel (orders/EditOrder.tsx:1250)', () => {
  it('by sign of the preview refund', () => {
    expect(editAmountLabel(money(100))).toBe('Refund owed');
    expect(editAmountLabel(money(-100))).toBe('Additional collection required');
    expect(editAmountLabel(money(0))).toBe('No amount due');
  });
});

describe('paid (orders/PaymentSection.tsx:1522)', () => {
  it('hidden when nothing outstanding', () => {
    expect(paid({ total: money(1000), outstanding: money(0) })).toBeUndefined();
  });
  it('amount to collect', () => {
    expect(paid({ total: money(1000), outstanding: money(400) })).toEqual({
      paid: money(600),
      label: 'Amount to collect',
      outstanding: money(400),
    });
  });
  it('refund owed: paid exceeds total', () => {
    expect(paid({ total: money(1000), outstanding: money(-300) })).toEqual({
      paid: money(1300),
      label: 'Refund owed',
      outstanding: money(300),
    });
  });
});

describe('displayTax (PaymentSection.tsx:1240)', () => {
  const i = { hasItems: true, taxesApplied: true, subtotal: money(100000) };
  it('saved draft tax wins, then server tax', () => {
    expect(displayTax({ ...i, savedTax: money(5), serverTax: money(7) })).toEqual(money(5));
    expect(displayTax({ ...i, serverTax: money(0) })).toEqual(money(0));
  });
  it('fallback: (subtotal − discount) × 18%', () => {
    expect(displayTax({ ...i, appliedDiscount: money(10000) })).toEqual(money(16200));
  });
  it('zero without items or with taxes off', () => {
    expect(displayTax({ ...i, hasItems: false })).toEqual(money(0));
    expect(displayTax({ ...i, taxesApplied: false })).toEqual(money(0));
  });
});

const line = (
  over: Partial<{ id: string; quantity: number; currentQuantity: number; originalQuantity: number; fulfillableQuantity: number }>,
) => ({ id: 'l', quantity: 2, currentQuantity: 2, fulfillableQuantity: 2, ...over });

describe('removedLines (OrderDetails.tsx:155)', () => {
  it('current 0 and original > 0', () => {
    const lines = [
      line({ id: 'a' }),
      line({ id: 'b', currentQuantity: 0, originalQuantity: 3 }),
      line({ id: 'c', quantity: 0, currentQuantity: 0, originalQuantity: 0 }),
    ];
    expect(removedLines(lines).map((l) => l.id)).toEqual(['b']);
    expect(activeLines(lines).map((l) => l.id)).toEqual(['a', 'c']);
  });
  it('original falls back to quantity', () => {
    expect(removedLines([line({ currentQuantity: 0, quantity: 1 })])).toHaveLength(1);
  });
});

describe('lineGroups (modules/order/lineItemGroups.ts:24)', () => {
  it('split: unfulfilled = fulfillable, fulfilled = quantity − fulfillable', () => {
    const a = line({ id: 'a', quantity: 3, fulfillableQuantity: 1 });
    const b = line({ id: 'b', quantity: 2, fulfillableQuantity: 0 });
    const groups = lineGroups({ lineItems: [a, b], fulfillmentSplitEnabled: true });
    expect(groups.map((g) => [g.label, g.rows.map((r) => [r.line.id, r.units])])).toEqual([
      ['Unfulfilled', [['a', 1]]],
      [
        'Fulfilled',
        [
          ['a', 2],
          ['b', 2],
        ],
      ],
    ]);
  });
  it('no split: one Items band; removed band at original quantity', () => {
    const groups = lineGroups({
      lineItems: [line({ id: 'a' }), line({ id: 'z', quantity: 0 })],
      removedLineItems: [line({ id: 'r', currentQuantity: 0, originalQuantity: 4 })],
      fulfillmentSplitEnabled: false,
    });
    expect(groups.map((g) => [g.key, g.rows.map((r) => [r.line.id, r.units])])).toEqual([
      ['items', [['a', 2]]],
      ['removed', [['r', 4]]],
    ]);
  });
  it('no lines → no bands', () => {
    expect(lineGroups({ fulfillmentSplitEnabled: true })).toEqual([]);
  });
});

describe('rowPricing (lineItemGroups.ts:80)', () => {
  it('undiscounted', () => {
    expect(rowPricing({ unitPrice: money(1000), currentQuantity: 2 }, 2)).toEqual({
      unit: money(1000),
      discountedUnit: money(1000),
      total: money(2000),
      isDiscounted: false,
    });
  });
  it('allocations spread over current quantity', () => {
    expect(rowPricing({ unitPrice: money(1000), currentQuantity: 4, discountAllocations: [{ amount: money(400) }] }, 1)).toEqual({
      unit: money(1000),
      discountedUnit: money(900),
      total: money(900),
      isDiscounted: true,
    });
  });
  it('removed line (current 0) carries no discount', () => {
    expect(rowPricing({ unitPrice: money(1000), currentQuantity: 0, discountAllocations: [{ amount: money(400) }] }, 3).isDiscounted).toBe(
      false,
    );
  });
  it('floors at zero', () => {
    expect(rowPricing({ unitPrice: money(100), currentQuantity: 1, discountAllocations: [{ amount: money(500) }] }, 1).total).toEqual(
      money(0),
    );
  });
});

describe('fulfillmentView (modules/fulfillment/transformer.ts:86)', () => {
  const lineHold: FulfillmentHoldLike = { isActive: true, scope: 'line_items', lineItems: [{ lineItemId: 'a', quantity: 2 }] };
  it('merges a part-held line into one row', () => {
    const v = fulfillmentView({
      status: 'unfulfilled',
      holds: [lineHold],
      fulfillableLineItems: [{ lineItemId: 'a', quantity: 1, locationId: 'L1' }],
      heldLineItems: [{ lineItemId: 'a', quantity: 2 }],
    });
    expect(v.lines).toHaveLength(1);
    expect(v.lines[0]).toMatchObject({ lineItemId: 'a', remaining: 1, heldQuantity: 2, held: true, locationId: 'L1' });
    expect(v.groups).toEqual([{ locationId: 'L1', lines: [v.lines[0]] }]);
    expect(v.canFulfil).toBe(true);
    expect(v.canHold).toBe(true);
  });
  it('an order hold covers every unit', () => {
    const v = fulfillmentView({ holds: [{ isActive: true, scope: 'order' }], fulfillableLineItems: [{ lineItemId: 'a', quantity: 3 }] });
    expect(v.lines[0]).toMatchObject({ remaining: 0, heldQuantity: 3, held: true });
    expect(v.groups).toEqual([]);
    expect(v.canFulfil).toBe(false);
  });
  it('legacy ids-only holds still cover; inactive holds ignored', () => {
    const v = fulfillmentView({
      holds: [
        { isActive: true, scope: 'line_items', lineItemIds: ['a'] },
        { isActive: false, scope: 'order' },
      ],
      fulfillableLineItems: [{ lineItemId: 'a', quantity: 1 }],
    });
    expect(v.activeHolds).toHaveLength(1);
    expect(v.lines[0]).toMatchObject({ remaining: 1, heldQuantity: 0, held: true });
  });
  it('legacy externally fulfilled and cancelled orders cannot fulfil', () => {
    expect(fulfillmentView({ status: 'fulfilled', fulfillableLineItems: [{ lineItemId: 'a', quantity: 1 }] })).toMatchObject({
      isLegacyExternallyFulfilled: true,
      canFulfil: false,
      canHold: false,
    });
    expect(fulfillmentView({ fulfillableLineItems: [{ lineItemId: 'a', quantity: 1 }] }, { cancelled: true }).canFulfil).toBe(false);
  });
  it('drops empty lines', () => {
    expect(fulfillmentView({ fulfillableLineItems: [{ lineItemId: 'a', quantity: 0 }] }).lines).toEqual([]);
  });
  it('clampQuantity', () => {
    expect([clampQuantity(2.7, 5), clampQuantity(-1, 5), clampQuantity('x', 5), clampQuantity(9, 3)]).toEqual([2, 0, 0, 3]);
  });
});

describe('shouldOfferBulkFulfil (modules/fulfillment/transformer.ts:437)', () => {
  it('nothing selected → no', () => {
    expect(shouldOfferBulkFulfil([], [])).toBe(false);
  });
  it('selection partly off-page → yes', () => {
    expect(shouldOfferBulkFulfil(['1', '2'], [{ fulfillmentStatus: 'fulfilled' }])).toBe(true);
  });
  it('all visible: yes only if some row is fulfillable', () => {
    expect(shouldOfferBulkFulfil(['1'], [{ fulfillmentStatus: 'Delivered' }])).toBe(false);
    expect(shouldOfferBulkFulfil(['1'], [{ fulfillmentStatus: 'unfulfilled', cancelledAt: '2026-01-01' }])).toBe(false);
    expect(shouldOfferBulkFulfil(['1', '2'], [{ fulfillmentStatus: 'fulfilled' }, { fulfillmentStatus: 'Partially fulfilled' }])).toBe(
      true,
    );
    expect(canBulkFulfil([])).toBe(false);
  });
});

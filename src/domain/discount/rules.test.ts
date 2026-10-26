import { describe, it, expect } from 'vitest';
import { money } from '@/domain/shared/money';
import * as rules from './rules';
import type { DiscountWizardInput } from './rules';
import type { CrossDomainEffect } from './schema';

const base: DiscountWizardInput = {
  kind: 'cart',
  method: 'code',
  title: 'Summer',
  code: 'SUMMER',
  description: 'Save big',
  value: { type: 'percentage', percent: 10 },
  limits: {},
  devices: ['website'],
  visibility: 'always',
  startsAt: '2026-01-01T00:00:00Z',
};
const v = (patch: Partial<DiscountWizardInput>) => rules.wizardValidation({ ...base, ...patch });

describe('displayStatus / statusTargets', () => {
  it('prefers effectiveStatus', () => {
    expect(rules.displayStatus({ status: 'published', effectiveStatus: 'scheduled' })).toBe('scheduled');
  });
  it('offers the other statuses', () => {
    expect(rules.statusTargets({ status: 'draft' })).toEqual(['published', 'inactive']);
  });
  it('offers none when scheduled or expired', () => {
    expect(rules.statusTargets({ status: 'published', effectiveStatus: 'expired' })).toEqual([]);
  });
});

describe('wizardValidation', () => {
  it('a complete cart discount is valid', () => {
    expect(v({})).toEqual({});
  });
  it('title is required', () => {
    expect(v({ title: '' }).title).toBe('Title is required');
  });
  it('code must be ≥ 3 chars, even in automatic mode, without trimming', () => {
    expect(v({ code: 'AB', method: 'automatic' }).code).toBe('Coupon code must be at least 3 characters');
    expect(v({ code: undefined }).code).toBe('Coupon code must be at least 3 characters');
    expect(v({ code: '   ' }).code).toBeUndefined();
  });
  it('needs at least one device', () => {
    expect(v({ devices: [] }).devices).toBe('Pick at least one device');
  });
  it('usage limits are integers ≥ 1 or empty', () => {
    expect(v({ limits: { total: 0 } })['limits.total']).toBe('Must be at least 1');
    expect(v({ limits: { perCustomer: 1.5 } })['limits.perCustomer']).toBe('Expected integer, received float');
    expect(v({ limits: { perOrder: 2 } })['limits.perOrder']).toBeUndefined();
  });
  it('cart amount must be above zero (paise for fixed)', () => {
    expect(v({ value: null }).value).toBe('Amount is required');
    expect(v({ value: { type: 'percentage', percent: 0 } }).value).toBe('Number must be greater than 0');
    expect(v({ value: { type: 'fixed', amount: money(0) } }).value).toBe('Number must be greater than 0');
    expect(v({ value: { type: 'fixed', amount: money(5000) } }).value).toBeUndefined();
  });
  it('specific scope needs a product or collection', () => {
    expect(v({ appliesTo: { productIds: [], collectionIds: [] } }).appliesTo).toBe('Select at least one product or collection');
    expect(v({ appliesTo: { collectionIds: ['c1'] } }).appliesTo).toBeUndefined();
    expect(v({ appliesTo: { all: true } }).appliesTo).toBeUndefined();
  });
  it('BXGY needs a buy rule, get quantity ≥ 1 and an amount unless free', () => {
    const m = { by: 'product' as const, ids: ['p1'] };
    expect(v({ kind: 'buy_x_get_y', buyXGetY: { buy: [m], get: m, getQuantity: 1, reward: 'free' } })).toEqual({});
    const e = v({ kind: 'buy_x_get_y', buyXGetY: { buy: [], get: m, getQuantity: 0, reward: { type: 'percentage', percent: undefined } } });
    expect(e['buyXGetY.buy']).toBe('At least one buy rule is required');
    expect(e['buyXGetY.getQuantity']).toBe('Get quantity must be at least 1');
    expect(e['buyXGetY.amount']).toBe('Amount is required for % off or flat off rewards');
    expect(v({ kind: 'buy_x_get_y', buyXGetY: {} })['buyXGetY.reward']).toBe('Reward method is required');
  });
  it('bundle needs a tier with size and price above zero', () => {
    expect(v({ kind: 'bundle', bundle: { scope: { all: true }, tiers: [] } })['bundle.tiers']).toBe('Add at least one bundle tier');
    const e = v({ kind: 'bundle', bundle: { scope: { productIds: [] }, tiers: [{ quantity: 0, fixedPrice: null }] } });
    expect(e['bundle.tiers.0.quantity']).toBe('Bundle size must be greater than 0');
    expect(e['bundle.tiers.0.fixedPrice']).toBe('Capped value is required');
    expect(e['bundle.scope']).toBe('Select at least one product or collection');
    expect(v({ kind: 'bundle', bundle: { scope: { all: true }, tiers: [{ quantity: 2, fixedPrice: money(99900) }] } })).toEqual({});
  });
  it('dynamic tier amounts must be above zero', () => {
    expect(v({ kind: 'dynamic_tier', dynamicTier: { method: 'percentage', tiers: [] } })['dynamicTier.tiers']).toBe(
      'At least one tier is required',
    );
    const e = v({ kind: 'dynamic_tier', dynamicTier: { tiers: [{ min: null, max: 0, amount: 0, maxDiscount: money(0) }] } });
    expect(e).toMatchObject({
      'dynamicTier.method': 'Discount method is required',
      'dynamicTier.tiers.0.min': 'Min cart value is required',
      'dynamicTier.tiers.0.max': 'Max cart value must be greater than 0',
      'dynamicTier.tiers.0.amount': 'Discount amount must be greater than 0',
      'dynamicTier.tiers.0.maxDiscount': 'Max discount cap must be greater than 0',
    });
  });
  it('free gift needs a product (inline) or a get rule and quantity (catalogue)', () => {
    expect(v({ kind: 'free_gift', freeGift: null }).freeGift).toBe('Gift mode is required');
    expect(v({ kind: 'free_gift', freeGift: { gift: { productId: undefined } } })['freeGift.gift']).toBe(
      'Gift product is required for inline mode',
    );
    expect(
      v({ kind: 'free_gift', freeGift: { gift: { productId: 'p', variantId: 'v', name: 'Mug', unitPrice: money(0), quantity: 1 } } }),
    ).toEqual({});
    expect(v({ kind: 'free_gift', freeGift: { gift: { productId: 'p', name: 'Mug', unitPrice: money(-1) } } })).toMatchObject({
      'freeGift.gift.variantId': 'Gift product variant_id is required',
      'freeGift.gift.unitPrice': 'Unit price must be 0 or greater',
    });
    const e = v({ kind: 'free_gift', freeGift: { get: null, getQuantity: null } });
    expect(e['freeGift.get']).toBe('Get rule is required for catalogue mode');
    expect(e['freeGift.getQuantity']).toBe('Get quantity is required for catalogue mode');
  });
  it('end must be after start', () => {
    expect(v({ endsAt: '2026-01-01T00:00:00Z' }).endsAt).toBe('End must be after start');
    expect(v({ endsAt: '2026-02-01T00:00:00Z' }).endsAt).toBeUndefined();
  });
  it('description is required when visible, not when hidden', () => {
    expect(v({ description: '  ', visibility: 'eligible' }).description).toBe('Description is required when the offer is visible');
    expect(v({ description: '', visibility: 'hidden' }).description).toBeUndefined();
  });
  it('minimum value is required when a minimum is set', () => {
    expect(v({ minimum: { subtotal: null, reference: 'subtotal' } }).minimum).toBe('Minimum value is required');
    expect(v({ minimum: { quantity: null } }).minimum).toBe('Minimum items is required');
    expect(v({ minimum: { quantity: 2 } }).minimum).toBeUndefined();
  });
});

describe('draftValidation', () => {
  it('needs only kind and title', () => {
    expect(rules.draftValidation({ kind: 'cart', title: 'x' })).toEqual({});
    expect(rules.draftValidation({ title: '' })).toEqual({ kind: 'Required', title: 'Title is required' });
  });
});

describe('codeUnique', () => {
  it('checks a non-empty trimmed code that differs from the loaded one', () => {
    expect(rules.shouldCheckCode(' NEW ', null)).toBe(true);
    expect(rules.shouldCheckCode('OLD', 'OLD')).toBe(false);
    expect(rules.shouldCheckCode('  ', null)).toBe(false);
  });
  it('a taken code blocks; a failed check does not', () => {
    expect(rules.codeCheckOutcome({ exists: true })).toEqual({
      block: true,
      fieldError: 'This coupon code is already in use — pick another one.',
      warning: 'That coupon code already exists. Please choose a different one.',
    });
    expect(rules.codeCheckOutcome({ exists: false })).toEqual({ block: false });
    expect(rules.codeCheckOutcome('failed')).toEqual({ block: false });
  });
});

describe('modeFixed', () => {
  it('method is fixed on edit, free on create; missing mode reads as code', () => {
    expect(rules.modeFixed(true)).toBe(true);
    expect(rules.modeFixed(false)).toBe(false);
    expect(rules.methodOf(undefined)).toBe('code');
    expect(rules.methodOf('automatic')).toBe('automatic');
  });
});

describe('legacyValidation', () => {
  const ok = {
    title: 'Summer',
    description: 'd',
    code: 'SUMMER-25',
    value: { type: 'percentage' as const, percent: 50 },
    startsAt: '2026-01-01T00:00:00Z',
  };
  it('a valid v1 discount passes', () => {
    expect(rules.legacyValidation(ok)).toEqual({});
  });
  it('title and code rules', () => {
    expect(rules.legacyValidation({ ...ok, title: 'ab' }).title).toBe('Title must be at least 3 characters');
    expect(rules.legacyValidation({ ...ok, title: '' }).title).toBe('Please enter a title');
    expect(rules.legacyValidation({ ...ok, code: 'summer' }).code).toBe('Code can only contain uppercase letters, numbers, and hyphens');
    expect(rules.legacyValidation({ ...ok, code: 'A'.repeat(21) }).code).toBe('Code cannot exceed 20 characters');
    expect(rules.legacyValidation({ ...ok, code: 'AB' }).code).toBe('Code must be at least 3 characters');
  });
  it('percent 0–100; fixed ₹0–10000 checked in paise', () => {
    expect(rules.legacyValidation({ ...ok, value: { type: 'percentage', percent: 101 } }).value).toBe('Value must be between 0 and 100');
    expect(rules.legacyValidation({ ...ok, value: { type: 'fixed', amount: money(1_000_001) } }).value).toBe(
      'Value must be between 0 and 10000',
    );
    expect(rules.legacyValidation({ ...ok, value: { type: 'fixed', amount: money(1_000_000) } }).value).toBeUndefined();
  });
  it('end not before start; equal is fine', () => {
    expect(rules.legacyValidation({ ...ok, endsAt: '2025-12-31T00:00:00Z' }).endsAt).toBe(
      'End date and time cannot be before start date and time',
    );
    expect(rules.legacyValidation({ ...ok, endsAt: ok.startsAt }).endsAt).toBeUndefined();
  });
  it('BXGY quantities 1–1000, ≤ 100 items', () => {
    const e = rules.legacyValidation({
      ...ok,
      buyXGetY: { buyQuantity: 0, getQuantity: 1001, productIds: Array.from({ length: 101 }, (_, i) => `p${i}`) },
    });
    expect(e['buyXGetY.buyQuantity']).toBe('Quantity must be between 1 and 1,000');
    expect(e['buyXGetY.getQuantity']).toBe('Quantity must be between 1 and 1,000');
    expect(e['buyXGetY.productIds']).toBe('You can select up to 100 products');
  });
});

describe('unlimited', () => {
  it('V2: absent, int64-max or negative read as unlimited; 0 is kept', () => {
    expect(rules.v2UsesOrUnlimited(undefined)).toBeUndefined();
    expect(rules.v2UsesOrUnlimited(2 ** 63 - 1)).toBeUndefined();
    expect(rules.v2UsesOrUnlimited(-1)).toBeUndefined();
    expect(rules.v2UsesOrUnlimited(0)).toBe(0);
    expect(rules.v2UsesOrUnlimited(5)).toBe(5);
  });
  it('list column: V2 0 is unlimited; legacy ≥ 1,000,000 is unlimited', () => {
    expect(rules.listUsageLimit({ v2TotalUses: 0 })).toBeUndefined();
    expect(rules.listUsageLimit({ v2TotalUses: 10 })).toBe(10);
    expect(rules.listUsageLimit({ legacyAvailable: 1_000_000 })).toBeUndefined();
    expect(rules.listUsageLimit({ legacyAvailable: 999_999 })).toBe(999_999);
  });
  it('v1 uses 1,000,000', () => {
    expect(rules.toV1Limit(undefined)).toBe(1_000_000);
    expect(rules.toV1Limit(0)).toBe(0);
    expect(rules.fromV1Limit(1_000_000)).toBeUndefined();
    expect(rules.fromV1Limit(50)).toBe(50);
    expect(rules.toV1PerCustomer(3)).toBe(1);
    expect(rules.toV1PerCustomer(undefined)).toBe(1_000_000);
    expect(rules.fromV1PerCustomer(1)).toBe(1);
    expect(rules.fromV1PerCustomer(1_000_000)).toBeUndefined();
  });
});

describe('noEndDate', () => {
  it('V2 omits; v1 sends 9999-12-31T23:59:59Z', () => {
    expect(rules.toV2EndDate('')).toBeUndefined();
    expect(rules.toV1EndDate(undefined)).toBe('9999-12-31T23:59:59Z');
    expect(rules.toV1EndDate('2026-03-01T00:00:00Z')).toBe('2026-03-01T00:00:00Z');
    expect(rules.fromV1EndDate('9999-12-31T23:59:59Z')).toBeUndefined();
    expect(rules.fromV1EndDate('2026-03-01T00:00:00Z')).toBe('2026-03-01T00:00:00Z');
  });
});

describe('tierOrder', () => {
  const tiers = [{ min: 500 }, { min: 100 }, { min: 1000 }];
  it('stored highest first, shown lowest first, without mutating', () => {
    expect(rules.tiersForStorage(tiers).map((t) => t.min)).toEqual([1000, 500, 100]);
    expect(rules.tiersForDisplay(tiers).map((t) => t.min)).toEqual([100, 500, 1000]);
    expect(tiers.map((t) => t.min)).toEqual([500, 100, 1000]);
  });
});

describe('codFlags', () => {
  const legacyBlock: CrossDomainEffect = { domain: 'payment', effect: 'block', filter: { types: ['COD'] } };
  const legacyExclude: CrossDomainEffect = { domain: 'payment', effect: 'exclude', filter: { types: ['cod'], scope: 'x' } };
  const prepaid: CrossDomainEffect = { domain: 'payment', effect: 'block', filter: { scope: 'prepaid_discount' } };
  const shipping: CrossDomainEffect = { domain: 'shipping', effect: 'set_value' };
  it('detects all three COD shapes and the prepaid block', () => {
    expect(rules.isCodDisableEffect(legacyBlock)).toBe(true);
    expect(rules.isCodDisableEffect(legacyExclude)).toBe(true);
    expect(rules.isPrepaidBlockEffect(prepaid)).toBe(true);
    expect(rules.isCodDisableEffect(shipping)).toBe(false);
  });
  it('splits flags out on read and writes EXCLUDE + ids ["COD"]', () => {
    expect(rules.splitPaymentEffects([legacyBlock, prepaid, shipping])).toEqual({
      payment: { disableForCod: true, disableForPrepaid: true },
      rest: [shipping],
    });
    expect(rules.withPaymentEffects([shipping], { disableForCod: true, disableForPrepaid: true })).toEqual([
      shipping,
      { domain: 'payment', effect: 'exclude', filter: { ids: ['COD'] }, reason: 'COD not available with this discount', priority: 1 },
      { domain: 'payment', effect: 'block', filter: { scope: 'prepaid_discount' } },
    ]);
  });
});

describe('legacyBxgyQuantity', () => {
  it('v1 write stores X + Y', () => {
    expect(rules.toV1BxgyMinCartQuantity(2, '1')).toBe(3);
    expect(rules.toV1BxgyMinCartQuantity(undefined, 1)).toBe(1);
  });
  it('v1 read subtracts Y from min_cart_quantity; Shopify-synced rows store X', () => {
    expect(rules.fromV1BxgyBuyQuantity({ minCartQuantity: 3 }, 1)).toBe(2);
    expect(rules.fromV1BxgyBuyQuantity({ minProductQuantity: 2 }, 1)).toBe(2);
    expect(rules.fromV1BxgyBuyQuantity({}, 1)).toBeUndefined();
  });
});

import type { Money } from '@/domain/shared/money';
import type { CrossDomainEffect, Discount, Matcher, Scope } from './schema';

// Pure rules, ported as today. Each cites the gk-pages source it came from (docs/architecture/domain/discounts.md).
// gk-pages paths are relative to gk-pages/src/. Messages are verbatim, including zod defaults where gk-pages relied on them.
// Unused-type guard for entities whose rules take narrower inputs:
export type { Discount as _Discount };

/** Field path → first message, the same shape as CommandResult's `invalid.fieldErrors`. Empty = valid. */
export type FieldErrors = Record<string, string>;

/** components/discounts/DiscountsTable.tsx:66 */
export const displayStatus = (d: Pick<Discount, 'status' | 'effectiveStatus'>) => d.effectiveStatus ?? d.status;

/** components/discounts/DiscountsTable.tsx:13 */
export const statusTargets = (d: Pick<Discount, 'status' | 'effectiveStatus'>) =>
  ['scheduled', 'expired'].includes(displayStatus(d))
    ? []
    : (['published', 'draft', 'inactive'] as const).filter((s) => s !== displayStatus(d));

/** schemas/discountWizard.ts:13; ≥ 3 chars even in automatic mode. Note: trims, whereas wizardValidation (like gk-pages) does not. */
export const codeValid = (code: string) => code.trim().length >= 3;

// ---------------------------------------------------------------------------
// wizardValidation — schemas/discountWizard.ts
// ---------------------------------------------------------------------------

type Partial2<T> = { [K in keyof T]?: T[K] | null };
type WizardValue = { type: 'percentage'; percent?: number | null; maxDiscount?: Money } | { type: 'fixed'; amount?: Money | null };
type WizardMatcher = Partial2<Matcher>;
type WizardGift = { productId?: string; variantId?: string; name?: string; unitPrice?: Money | null; imageUrl?: string; quantity?: number };

/** A half-filled wizard: the domain Discount with every value the merchant types allowed to be missing. */
export interface DiscountWizardInput {
  kind: Discount['kind'];
  method?: Discount['method'];
  title?: string | null;
  code?: string | null;
  description?: string | null;
  value?: WizardValue | null; // cart
  appliesTo?: Scope | null; // cart, dynamic tier
  buyXGetY?: {
    buy?: WizardMatcher[];
    get?: WizardMatcher | null;
    getQuantity?: number | null;
    reward?: 'free' | WizardValue | null;
  } | null;
  bundle?: { scope?: Scope | null; tiers?: { quantity?: number | null; fixedPrice?: Money | null }[] } | null;
  dynamicTier?: {
    method?: 'percentage' | 'fixed' | null;
    tiers?: { min?: number | null; max?: number | null; amount?: number | null; maxDiscount?: Money | null }[];
  } | null;
  /** `{ gift }` is inline mode; `{ get, getQuantity }` is catalogue mode. */
  freeGift?:
    { gift: WizardGift | null | undefined } | { get?: WizardMatcher | null; getQuantity?: number | null; autoAddFreebie?: boolean } | null;
  /** `{ subtotal }` is a cart-amount minimum; `{ quantity }` an item minimum; undefined = no minimum. */
  minimum?: { subtotal?: Money | null; reference?: 'subtotal' | 'to_pay' } | { quantity: number | null | undefined } | null;
  limits?: { total?: number | null; perCustomer?: number | null; perOrder?: number | null };
  devices?: Discount['devices'];
  visibility?: Discount['visibility'];
  startsAt?: string | null;
  endsAt?: string | null;
}

const set = (e: FieldErrors, path: string, msg: string) => {
  if (!(path in e)) e[path] = msg;
};
const isSpecificWithoutSelection = (s?: Scope | null) => !!s && !('all' in s) && !s.productIds?.length && !s.collectionIds?.length;
const SCOPE_MSG = 'Select at least one product or collection';
/** zod's default `.positive()` message, which gk-pages shows for amounts ≤ 0 without a custom message. */
const ZOD_POSITIVE = 'Number must be greater than 0';
const ZOD_INT = 'Expected integer, received float';

/** A z.number({ required_error }).positive(msg) field. */
const positive = (e: FieldErrors, path: string, v: number | null | undefined, required: string | null, notPositive: string) => {
  if (v == null) {
    if (required) set(e, path, required);
    return;
  }
  if (!(v > 0)) set(e, path, notPositive);
};
/** z.number().int().min(1, msg). */
const intAtLeastOne = (e: FieldErrors, path: string, v: number | null | undefined, msg: string) => {
  if (v == null) return;
  if (!Number.isInteger(v)) set(e, path, ZOD_INT);
  else if (v < 1) set(e, path, msg);
};

const valueAmount = (v: WizardValue): number | null | undefined => (v.type === 'percentage' ? v.percent : v.amount?.minor);

/**
 * Full validation of the V2 discount wizard on publish. Returns one message per field path, verbatim from gk-pages.
 * - title required — schemas/discountWizard.ts:12
 * - code ≥ 3 chars, no trim, also in automatic mode — :13
 * - ≥ 1 device — :23
 * - usage limits integers ≥ 1 or empty — :28-30
 * - specific scope needs a product or collection — :40 (cart :58, dynamic tier :107)
 * - cart amount > 0 — :53
 * - BXGY: reward method, ≥ 1 buy rule, get rule, get quantity ≥ 1, amount unless free — :62-73
 * - bundle: ≥ 1 tier, size and capped price > 0, specific scope selection — :77-89
 * - dynamic tier: method, ≥ 1 tier, min and amount > 0, max and cap > 0 when set — :93-102
 * - free gift: inline needs a product, catalogue needs a get rule and quantity — :110-147
 * - end after start (ISO string comparison, as today) — :157
 * - description when visible ('always' | 'eligible'); trims — :161
 * - minimum value when a minimum is set — :166
 * Money is paise: a fixed amount of 0 paise fails, as ₹0 did.
 */
export const wizardValidation = (d: DiscountWizardInput): FieldErrors => {
  const e: FieldErrors = {};
  if (!d.title) set(e, 'title', 'Title is required');
  if ((d.code ?? '').length < 3) set(e, 'code', 'Coupon code must be at least 3 characters');
  if (!d.devices || d.devices.length < 1) set(e, 'devices', 'Pick at least one device');
  intAtLeastOne(e, 'limits.total', d.limits?.total, 'Must be at least 1');
  intAtLeastOne(e, 'limits.perCustomer', d.limits?.perCustomer, 'Must be at least 1');
  intAtLeastOne(e, 'limits.perOrder', d.limits?.perOrder, 'Must be at least 1');

  switch (d.kind) {
    case 'cart': {
      positive(e, 'value', d.value ? valueAmount(d.value) : undefined, 'Amount is required', ZOD_POSITIVE);
      if (isSpecificWithoutSelection(d.appliesTo)) set(e, 'appliesTo', SCOPE_MSG);
      break;
    }
    case 'buy_x_get_y': {
      const b = d.buyXGetY ?? {};
      if (b.reward == null) set(e, 'buyXGetY.reward', 'Reward method is required');
      if (!b.buy || b.buy.length < 1) set(e, 'buyXGetY.buy', 'At least one buy rule is required');
      if (!b.get) set(e, 'buyXGetY.get', 'Required');
      if (b.getQuantity == null) set(e, 'buyXGetY.getQuantity', 'Required');
      else intAtLeastOne(e, 'buyXGetY.getQuantity', b.getQuantity, 'Get quantity must be at least 1');
      if (b.reward != null && b.reward !== 'free') {
        const amount = valueAmount(b.reward);
        if (!(amount != null && amount > 0)) set(e, 'buyXGetY.amount', 'Amount is required for % off or flat off rewards');
      }
      break;
    }
    case 'bundle': {
      const b = d.bundle ?? {};
      if (isSpecificWithoutSelection(b.scope)) set(e, 'bundle.scope', SCOPE_MSG);
      const tiers = b.tiers ?? [];
      if (tiers.length < 1) set(e, 'bundle.tiers', 'Add at least one bundle tier');
      tiers.forEach((t, i) => {
        positive(e, `bundle.tiers.${i}.quantity`, t.quantity, 'Bundle size is required', 'Bundle size must be greater than 0');
        positive(e, `bundle.tiers.${i}.fixedPrice`, t.fixedPrice?.minor, 'Capped value is required', 'Capped value must be greater than 0');
      });
      break;
    }
    case 'dynamic_tier': {
      const t = d.dynamicTier ?? {};
      if (t.method == null) set(e, 'dynamicTier.method', 'Discount method is required');
      const tiers = t.tiers ?? [];
      if (tiers.length < 1) set(e, 'dynamicTier.tiers', 'At least one tier is required');
      tiers.forEach((x, i) => {
        positive(e, `dynamicTier.tiers.${i}.min`, x.min, 'Min cart value is required', 'Min cart value must be greater than 0');
        positive(e, `dynamicTier.tiers.${i}.max`, x.max, null, 'Max cart value must be greater than 0');
        positive(e, `dynamicTier.tiers.${i}.amount`, x.amount, 'Discount amount is required', 'Discount amount must be greater than 0');
        positive(e, `dynamicTier.tiers.${i}.maxDiscount`, x.maxDiscount?.minor, null, 'Max discount cap must be greater than 0');
      });
      if (isSpecificWithoutSelection(d.appliesTo)) set(e, 'appliesTo', SCOPE_MSG);
      break;
    }
    case 'free_gift': {
      const f = d.freeGift;
      if (!f) {
        set(e, 'freeGift', 'Gift mode is required');
        break;
      }
      if ('gift' in f) {
        const g = f.gift;
        // gk-pages treats an all-undefined gift object as absent (discountWizard.ts:124).
        if (!g || !Object.values(g).some((x) => x !== undefined)) {
          set(e, 'freeGift.gift', 'Gift product is required for inline mode');
          break;
        }
        if (!g.productId) set(e, 'freeGift.gift.productId', 'Gift product id is required');
        if (!g.variantId) set(e, 'freeGift.gift.variantId', 'Gift product variant_id is required');
        if (!g.name) set(e, 'freeGift.gift.name', 'Gift product name is required');
        if (g.unitPrice == null) set(e, 'freeGift.gift.unitPrice', 'Required');
        else if (g.unitPrice.minor < 0) set(e, 'freeGift.gift.unitPrice', 'Unit price must be 0 or greater');
      } else {
        if (!f.get) set(e, 'freeGift.get', 'Get rule is required for catalogue mode');
        if (f.getQuantity == null) set(e, 'freeGift.getQuantity', 'Get quantity is required for catalogue mode');
        else intAtLeastOne(e, 'freeGift.getQuantity', f.getQuantity, 'Get quantity must be at least 1');
      }
      break;
    }
  }

  if (d.endsAt && d.startsAt != null && !(d.endsAt > d.startsAt)) set(e, 'endsAt', 'End must be after start');
  if ((d.visibility === 'always' || d.visibility === 'eligible') && (!d.description || !d.description.trim()))
    set(e, 'description', 'Description is required when the offer is visible');
  const m = d.minimum;
  if (m) {
    if ('quantity' in m) {
      if (m.quantity == null) set(e, 'minimum', 'Minimum items is required');
    } else if (m.subtotal == null) set(e, 'minimum', 'Minimum value is required');
  }
  return e;
};

/** schemas/discountWizard.ts:175 — a draft needs only kind and title. */
export const draftValidation = (d: { kind?: Discount['kind'] | null; title?: string | null }): FieldErrors => {
  const e: FieldErrors = {};
  if (d.kind == null) e.kind = 'Required';
  if (!d.title) e.title = 'Title is required';
  return e;
};

// ---------------------------------------------------------------------------
// codeUnique — pages/discounts/CreateDiscountWizard.tsx:150-170
// ---------------------------------------------------------------------------

/** CreateDiscountWizard.tsx:152-153 — on leaving the Details step, check only a non-empty trimmed code that differs from the loaded one. */
export const shouldCheckCode = (code: string | null | undefined, loadedCode: string | null | undefined): boolean => {
  const c = (code || '').trim();
  return c !== '' && c !== (loadedCode ?? null);
};

export type CodeCheckOutcome = { block: false } | { block: true; fieldError: string; warning: string };
/** CreateDiscountWizard.tsx:156-166 — taken blocks with a field error and toast; a failed check does not block (create validates server-side). */
export const codeCheckOutcome = (result: { exists: boolean } | 'failed'): CodeCheckOutcome =>
  result !== 'failed' && result.exists
    ? {
        block: true,
        fieldError: 'This coupon code is already in use — pick another one.',
        warning: 'That coupon code already exists. Please choose a different one.',
      }
    : { block: false };

// ---------------------------------------------------------------------------
// modeFixed — components/discounts/wizard/StepDetails.tsx:36
// ---------------------------------------------------------------------------

export const METHOD_FIXED_HELP = 'This cannot be changed after the discount is created — create a new discount instead.';
/** components/discounts/wizard/StepDetails.tsx:36, :45 — `method` (wire `mode`) is editable on create only. */
export const modeFixed = (isEdit: boolean): boolean => isEdit;
/** modules/discounts/v2/transformer.ts:290 — rows without a mode are treated as code (MANUAL). */
export const methodOf = (method?: Discount['method'] | null): Discount['method'] => method ?? 'code';

// ---------------------------------------------------------------------------
// legacyValidation — v1 forms (sets, AI create)
// ---------------------------------------------------------------------------

export interface LegacyDiscountInput {
  title?: string | null;
  description?: string | null;
  code?: string | null;
  value?: { type: 'percentage'; percent?: number | null } | { type: 'fixed'; amount?: Money | null } | null;
  startsAt?: string | null;
  endsAt?: string | null; // only when "set end date" is on
  buyXGetY?: { buyQuantity?: number | null; getQuantity?: number | null; productIds?: string[]; collectionIds?: string[] } | null;
}

const CODE_PATTERN = /^[A-Z0-9-]+$/;
const CODE_PATTERN_MSG = 'Code can only contain uppercase letters, numbers, and hyphens';
const empty = (s?: string | null) => s == null || s === '';
const between = (v: number | null | undefined, lo: number, hi: number) => v == null || (v >= lo && v <= hi);

/**
 * v1 discount forms (antd rules; the first failing rule per field is returned).
 * - title: required, ≥ 3, ≤ 50 — components/discounts/DiscountForm.tsx:250-252
 * - description: required, ≤ 500 — DiscountForm.tsx:269-270
 * - code: required, 3–20, `^[A-Z0-9-]+$` — DiscountForm.tsx:299-304
 * - percent required, 0–100 — DiscountForm.tsx:518-523; fixed required, ₹0–10000 (checked in paise: 0–1,000,000) — DiscountForm.tsx:542-547
 * - end not before start (equal is fine) — DiscountForm.tsx:1088-1095
 * - BXGY buy and get quantities 1–1000, ≤ 100 products or collections — components/discounts/BuyXGetYDiscountForm.tsx:300, :320, :341-347, :451-456
 */
export const legacyValidation = (d: LegacyDiscountInput): FieldErrors => {
  const e: FieldErrors = {};
  const t = d.title ?? '';
  if (empty(t)) e.title = 'Please enter a title';
  else if (t.length < 3) e.title = 'Title must be at least 3 characters';
  else if (t.length > 50) e.title = 'Title cannot exceed 50 characters';
  const desc = d.description ?? '';
  if (empty(desc)) e.description = 'Please enter a description';
  else if (desc.length > 500) e.description = 'Description cannot exceed 500 characters';
  const c = d.code ?? '';
  if (empty(c)) e.code = 'Please enter a discount code';
  else if (c.length < 3) e.code = 'Code must be at least 3 characters';
  else if (c.length > 20) e.code = 'Code cannot exceed 20 characters';
  else if (!CODE_PATTERN.test(c)) e.code = CODE_PATTERN_MSG;
  if (d.value?.type === 'percentage') {
    if (d.value.percent == null) e.value = 'Please enter a discount %';
    else if (!between(d.value.percent, 0, 100)) e.value = 'Value must be between 0 and 100';
  } else if (d.value?.type === 'fixed') {
    if (d.value.amount == null) e.value = 'Please enter a discount value';
    else if (!between(d.value.amount.minor, 0, 1_000_000)) e.value = 'Value must be between 0 and 10000';
  }
  if (d.endsAt && d.startsAt && Date.parse(d.endsAt) < Date.parse(d.startsAt))
    e.endsAt = 'End date and time cannot be before start date and time';
  const b = d.buyXGetY;
  if (b) {
    if (b.buyQuantity == null) e['buyXGetY.buyQuantity'] = 'Please enter the minimum total quantity in cart';
    else if (!between(b.buyQuantity, 1, 1000)) e['buyXGetY.buyQuantity'] = 'Quantity must be between 1 and 1,000';
    if (b.getQuantity == null) e['buyXGetY.getQuantity'] = 'Please enter free quantity';
    else if (!between(b.getQuantity, 1, 1000)) e['buyXGetY.getQuantity'] = 'Quantity must be between 1 and 1,000';
    if ((b.productIds?.length ?? 0) > 100) e['buyXGetY.productIds'] = 'You can select up to 100 products';
    if ((b.collectionIds?.length ?? 0) > 100) e['buyXGetY.collectionIds'] = 'You can select up to 100 collections';
  }
  return e;
};

// ---------------------------------------------------------------------------
// unlimited / noEndDate
// ---------------------------------------------------------------------------

/** v1 sentinel: a limit ≥ 1,000,000 is unlimited. modules/discounts/transformer.ts:136 */
export const V1_UNLIMITED = 1_000_000;
/** v1 sentinel for "no end date". modules/discounts/transformer.ts:149 */
export const V1_NO_END_DATE = '9999-12-31T23:59:59Z';

/** modules/discounts/v2/transformer.ts:80 — V2: absent, beyond safe-integer (int64-max) or negative reads as unlimited (undefined). 0 is kept. */
export const v2UsesOrUnlimited = (n?: number | null): number | undefined =>
  n == null || n > Number.MAX_SAFE_INTEGER || n < 0 ? undefined : n;

/** modules/discounts/v2/transformer.ts:87 — list "Available" column: V2 total (0 also unlimited), else legacy available_coupons < 1,000,000. undefined = "Unlimited". */
export const listUsageLimit = (row: { v2TotalUses?: number | null; legacyAvailable?: number | null }): number | undefined => {
  const v2 = v2UsesOrUnlimited(row.v2TotalUses);
  if (v2 !== undefined) return v2 === 0 ? undefined : v2;
  const legacy = row.legacyAvailable;
  return legacy != null && legacy < V1_UNLIMITED ? legacy : undefined;
};

/** modules/discounts/transformer.ts:133-137 — v1 write: undefined (unlimited) → 1,000,000. */
export const toV1Limit = (n?: number): number => (n === undefined ? V1_UNLIMITED : n);
/** modules/discounts/transformer.ts:628 — v1 read: < 1,000,000 is a limit, otherwise unlimited. */
export const fromV1Limit = (n: number): number | undefined => (n < V1_UNLIMITED ? n : undefined);
/** modules/discounts/transformer.ts:139-143 — v1 per-customer is a "once per customer" toggle: any limit sends 1, none sends 1,000,000. */
export const toV1PerCustomer = (perCustomer?: number): number => (perCustomer ? 1 : V1_UNLIMITED);
/** modules/discounts/transformer.ts:637 — v1 per-customer reads 1 as once, anything else as unlimited. */
export const fromV1PerCustomer = (n: number): number | undefined => (n === 1 ? 1 : undefined);

/** modules/discounts/v2/transformer.ts:294 — V2 omits the end date when there is none (empty string too). */
export const toV2EndDate = (endsAt?: string | null): string | undefined => endsAt || undefined;
/** modules/discounts/transformer.ts:146-150 — v1 sends 9999-12-31T23:59:59Z when there is no end date. */
export const toV1EndDate = (endsAt?: string | null): string => endsAt || V1_NO_END_DATE;
/** modules/discounts/transformer.ts:620 — v1 read: the sentinel or a missing date means no end date. */
export const fromV1EndDate = (endDate?: string | null): string | undefined => (endDate && endDate !== V1_NO_END_DATE ? endDate : undefined);

// ---------------------------------------------------------------------------
// tierOrder — modules/discounts/v2/transformer.ts:195, :380
// ---------------------------------------------------------------------------

/** v2/transformer.ts:195 — the engine requires highest threshold first (INVALID_TIER_ORDER otherwise). Missing min sorts as 0. Does not mutate. */
export const tiersForStorage = <T extends { min?: number | null }>(tiers: readonly T[]): T[] =>
  [...tiers].sort((a, b) => (b.min ?? 0) - (a.min ?? 0));
/** v2/transformer.ts:380 — the wizard shows lowest first. Does not mutate. */
export const tiersForDisplay = <T extends { min?: number | null }>(tiers: readonly T[]): T[] =>
  [...tiers].sort((a, b) => (a.min ?? 0) - (b.min ?? 0));

// ---------------------------------------------------------------------------
// codFlags — modules/discounts/v2/transformer.ts:28-35, :261-277, :472-475
// ---------------------------------------------------------------------------

const hasCod = (arr: unknown): boolean => Array.isArray(arr) && arr.map((t) => String(t).toLowerCase()).includes('cod');
/** v2/transformer.ts:30 — PAYMENT block or exclude whose filter types or ids include cod (any case). */
export const isCodDisableEffect = (e: CrossDomainEffect): boolean =>
  e.domain === 'payment' && (e.effect === 'block' || e.effect === 'exclude') && (hasCod(e.filter?.types) || hasCod(e.filter?.ids));
/** v2/transformer.ts:34 — PAYMENT block scoped to prepaid_discount. */
export const isPrepaidBlockEffect = (e: CrossDomainEffect): boolean =>
  e.domain === 'payment' && e.effect === 'block' && e.filter?.scope === 'prepaid_discount';

/** v2/transformer.ts:472-475 — read: lift the payment flags out of the effects; the rest round-trip untouched. */
export const splitPaymentEffects = (
  effects: readonly CrossDomainEffect[],
): { payment: Discount['payment']; rest: CrossDomainEffect[] } => ({
  payment: { disableForCod: effects.some(isCodDisableEffect), disableForPrepaid: effects.some(isPrepaidBlockEffect) },
  rest: effects.filter((e) => !isCodDisableEffect(e) && !isPrepaidBlockEffect(e)),
});

/** v2/transformer.ts:261-277 — write: append the flags as effects. New saves use EXCLUDE + ids ["COD"]. */
export const withPaymentEffects = (rest: readonly CrossDomainEffect[], payment: Discount['payment']): CrossDomainEffect[] => {
  const out = [...rest];
  if (payment.disableForCod)
    out.push({
      domain: 'payment',
      effect: 'exclude',
      filter: { ids: ['COD'] },
      reason: 'COD not available with this discount',
      priority: 1,
    });
  if (payment.disableForPrepaid) out.push({ domain: 'payment', effect: 'block', filter: { scope: 'prepaid_discount' } });
  return out;
};

// ---------------------------------------------------------------------------
// legacyBxgyQuantity — modules/discounts/transformer.ts:293-298, :1009-1018
// ---------------------------------------------------------------------------

/** transformer.ts:293-298 — v1 write stores Buy X / Get Y as min_cart_quantity = X + Y (non-numbers count as 0). */
export const toV1BxgyMinCartQuantity = (buy: unknown, get: unknown): number => (Number(buy) || 0) + (Number(get) || 0);

/** transformer.ts:1009-1018 — v1 read: gk-pages rows store X + Y in min_cart_quantity (subtract Y); Shopify-synced rows store X in min_qty / min_product_quantity. */
export const fromV1BxgyBuyQuantity = (
  cond: { minCartQuantity?: unknown; minQty?: unknown; minProductQuantity?: unknown },
  getQuantity: number,
): number | undefined => {
  if (cond.minCartQuantity != null) {
    const combined = Number(cond.minCartQuantity);
    return Number.isFinite(combined) ? combined - getQuantity : undefined;
  }
  const buyOnly = Number(cond.minQty || cond.minProductQuantity);
  return Number.isFinite(buyOnly) ? buyOnly : undefined;
};

# Discounts

[← Domain](README.md) · Wire: [gateway › discount](../gateway/discount.md)

Discounts use Discount Service V2; discount sets and AI create still use os-discount v1. One domain model, one transformer per API.

## Discount

```ts
type DiscountKind = 'cart' | 'buy_x_get_y' | 'bundle' | 'dynamic_tier' | 'free_gift';        // V2 (wizard)
type LegacyDiscountKind = 'order' | 'product' | 'buy_x_get_y' | 'gift_with_purchase';      // v1: sets, AI create

type DiscountValue =
  | { type: 'percentage'; percent: number; maxDiscount?: Money }
  | { type: 'fixed'; amount: Money };

type Matcher = { by: 'product' | 'variant' | 'collection' | 'tag'; ids: Id[]; minQuantity?: number };
type GiftProduct = { productId: Id; variantId: Id; name: string; unitPrice: Money; imageUrl?: string; quantity: number };

interface Discount extends Entity {
  title: string;
  displayName?: string;
  description?: string;
  terms: string[];
  kind: DiscountKind;
  method: 'code' | 'automatic';      // fixed after create; legacy rows without a mode → code
  code?: string;
  status: 'draft' | 'published' | 'inactive' | 'deleted';   // v1 also sends 'active'
  effectiveStatus?: string;          // engine-computed: scheduled, expired…
  priority?: number;

  // offer, by kind
  value?: DiscountValue;                                   // cart
  discountBase?: 'cart' | 'product';                       // cart: whole cart vs matched lines only
  appliesTo?: { all: true } | { productIds?: Id[]; collectionIds?: Id[] };
  buyXGetY?: { buy: Matcher[]; get: Matcher; getQuantity: number; reward: 'free' | DiscountValue; autoAddFreebie: boolean };
  bundle?: { scope: { all: true } | { productIds?: Id[]; collectionIds?: Id[] }; tiers: { quantity: number; fixedPrice: Money }[] };
  dynamicTier?: { basis: 'amount' | 'quantity'; method: 'percentage' | 'fixed'; tiers: { min: number; max?: number; amount: number; maxDiscount?: Money }[] };
  freeGift?: { gift: GiftProduct } | { get: Matcher; getQuantity: number; autoAddFreebie: boolean };
  giftTopUp?: GiftProduct[];                                // free gift added to any kind

  // conditions
  minimum?: { subtotal: Money; reference: 'subtotal' | 'to_pay' } | { quantity: number };
  eligibility:
    | { type: 'all' } | { type: 'new' } | { type: 'returning' }
    | { type: 'customers'; ids: Id[]; exclude?: boolean }  // customer ids today
    | { type: 'segments'; ids: Id[] };                     // v1 forms (sets)
  limits: { total?: number; perCustomer?: number; perOrder?: number };   // undefined = unlimited
  devices: ('website' | 'app')[];    // ≥ 1
  visibility: 'always' | 'hidden' | 'eligible';
  startsAt: DateTime;
  endsAt?: DateTime;                 // undefined = no end date

  // engine behaviour, round-tripped (hidden in today's wizard)
  stacking: StackingConfig;
  crossDomainEffects: CrossDomainEffect[];
  payment: { disableForCod: boolean; disableForPrepaid: boolean };   // from PAYMENT effects (v1: payment_flags)
  mustApply?: boolean;               // v1 only
  bulkCampaign?: BulkCodeCampaign;   // discount sets only
}

interface StackingConfig {
  enabled: boolean;
  maxStackCount?: number;
  basis?: 'subtotal' | 'to_pay';
  rules?: { by: 'mode' | 'type' | 'discount'; allowed?: string[][]; blocked?: string[][] }[];
  maxDiscountCap?: { enabled: boolean; type: 'percentage' | 'fixed'; value: number; basis?: 'subtotal' | 'to_pay' };
}

interface CrossDomainEffect {
  domain: 'discount' | 'shipping' | 'rewards' | 'payment';
  effect: 'block' | 'allow' | 'exclude' | 'set_value' | 'add_value';
  value?: { value: number; unit: string; label?: string };
  filter?: Record<string, unknown>;
  reason?: string;
  priority?: number;
}

interface BulkCodeCampaign {
  id: Id;
  title?: string;
  prefix?: string; suffix?: string;
  codeLength: number;
  totalCodes: number;
  usesPerCode: number;
  status: 'initiated' | 'completed' | string;   // job_status
  codesFileKey?: string;             // storage key; presigned before download
  endsAt?: DateTime;
  createdAt: DateTime;
}

interface DiscountApplication {      // on orders and drafts
  title: string;
  description?: string;
  code?: string;
  value: DiscountValue;
  amount: Money;
}
```

## Rules

As today. Source paths are in gk-pages `src/`.

| Rule | What | gk-pages source |
|---|---|---|
| `statusTargets` | offer published, draft and inactive, minus the current `effectiveStatus ?? status`; none when scheduled or expired; delete = status `deleted` | `components/discounts/DiscountsTable.tsx:13`, `:166` |
| `displayStatus` | `effectiveStatus ?? status` | `DiscountsTable.tsx:66` |
| `wizardValidation` | title required; code ≥ 3 chars (also automatic mode); cart and tier amounts > 0; "specific" scope needs ≥ 1 product or collection; BXGY ≥ 1 buy rule, get quantity ≥ 1, amount unless free; bundle ≥ 1 tier, size and price > 0; free gift needs a product (inline) or get rule and quantity (catalogue); end after start; description required when visible; minimum value required when a minimum is set; usage limits integers ≥ 1 or empty; ≥ 1 device | `schemas/discountWizard.ts` |
| `draftValidation` | a draft needs only kind and title | `discountWizard.ts:175` |
| `codeUnique` | checked on leaving step 2 when the code differs from the loaded one; a failed check does not block | `pages/discounts/CreateDiscountWizard.tsx:156` |
| `modeFixed` | mode can't change after create | `components/discounts/wizard/StepDetails.tsx:45` |
| `legacyValidation` | code 3–20 chars `^[A-Z0-9-]+$`; title ≥ 3; percent 0–100; end not before start; BXGY quantities 1–1000, ≤ 100 items | `components/discounts/DiscountForm.tsx:251`, `:300`, `:485`, `:1088`; `BuyXGetYDiscountForm.tsx:256` |
| `discountSetValidation` | codes 1–1,000,000; prefix and suffix ≤ 20 `^[A-Z0-9-]+$`; length 1–100; prefix + length + suffix ≥ 10 | `components/discounts/OrderDisountForm.tsx:265`, `:286`, `:333` |
| `unlimited` | V2: field omitted, or int64-max / negative read back as unlimited; v1: 1,000,000 | `modules/discounts/v2/transformer.ts:85`; `modules/discounts/transformer.ts:136` |
| `noEndDate` | V2: omitted; v1: `9999-12-31T23:59:59Z` | `modules/discounts/transformer.ts:149` |
| `tierOrder` | stored highest first, shown lowest first | `v2/transformer.ts:189`, `:372` |
| `codFlags` | COD = PAYMENT block or exclude with `cod`; prepaid = PAYMENT block scoped `prepaid_discount` | `v2/transformer.ts:28`, `:259` |
| `legacyBxgyQuantity` | v1 stores X + Y as `min_cart_quantity`; Shopify-synced stores X | `modules/discounts/transformer.ts:293` |

## Not in v1

Gift cards (no backend). Free-shipping effects are round-tripped but not editable.

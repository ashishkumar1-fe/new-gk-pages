# Discounts

[← Schema](README.md)

Services:

- **Discount Service V2**, through the gateway (`{BASE}/dashboard/v2/discount/*`), for discounts: list, get, create, edit, status. It stores a top-level `type` + `actions[]` + `cart_conditions` + `targeting` + `usage_limit` + `stacking_config` + `cross_domain_effects`.
- **os-discount** (`/api/v1/admin/os-discount/*`) for discount sets and AI create. It stores a rules engine (`rules[].conditions[]` / `actions[]`).

The domain model is typed by discount kind; one transformer per API maps to and from it, so this complexity stays in two files.

## Discount

```ts
type DiscountKind =               // V2 `type` (wizard)
  | 'cart'                        // CART: fixed or % off the cart, optionally scoped to products/collections (action CART or PRODUCT)
  | 'buy_x_get_y'                 // BXGY
  | 'bundle'                      // BUNDLE: quantity tiers with capped value
  | 'dynamic_tier'                // DYNAMICTIER: tiers by cart amount or quantity
  | 'free_gift';                  // stored as type CART + FREE_GIFT action

type LegacyDiscountKind =         // os-discount v1: discount sets, AI create
  | 'order'                       // fixed or % off the cart
  | 'product'                     // fixed or % off variants/collections
  | 'buy_x_get_y'
  | 'gift_with_purchase';         // free item(s) with cart

type DiscountValue =
  | { type: 'percentage'; percent: number }
  | { type: 'fixed'; amount: Money };

interface StackingConfig {          // V2 stacking_config
  enabled: boolean;
  maxStackCount?: number;
  basis?: 'subtotal' | 'to_pay';
  rules?: { by: 'mode' | 'type' | 'discount'; allowed?: string[][]; blocked?: string[][] }[];
  maxDiscountCap?: { type: 'percentage' | 'fixed'; value: number; basis?: 'subtotal' | 'to_pay' };
}

interface CrossDomainEffect {       // V2 cross_domain_effects
  domain: 'discount' | 'shipping' | 'rewards' | 'payment';
  effect: 'block' | 'allow' | 'exclude' | 'set_value' | 'add_value';
  value?: { value: number; unit: string; label?: string };
  filter?: Record<string, unknown>;
  reason?: string;
  priority?: number;
}

interface Discount extends Entity {
  title: string;
  description?: string;
  terms: string[];
  kind: DiscountKind;
  method: 'code' | 'automatic';      // V2 mode MANUAL | AUTOMATIC, fixed after create; v1 auto_apply
  code?: string;
  status: 'draft' | 'published' | 'inactive' | 'deleted';               // delete = status 'deleted'
  effectiveStatus?: Discount['status'] | 'scheduled' | 'expired';      // engine-computed; list shows effectiveStatus ?? status
  value?: DiscountValue;             // cart (v1: order, product)
  appliesTo?: { variantIds?: Id[]; collectionIds?: Id[] };
  buyXGetY?: {
    buy: { quantity: number; variantIds?: Id[]; collectionIds?: Id[] };
    get: { quantity: number; variantIds: Id[] };     // free
  };
  gifts?: { variantIds: Id[] };
  tiers?: { min: number; max?: number; value: DiscountValue; cap?: Money }[];   // bundle, dynamic_tier
  giftTopUp?: { variantId: Id; quantity: number }[];   // free gift added to any kind
  minimum?: { subtotal?: Money; quantity?: number; reference: 'subtotal' | 'to_pay' };
  eligibility:
    | { type: 'all' }
    | { type: 'new' }
    | { type: 'returning' }
    | { type: 'customers'; phones: string[]; exclude?: boolean }   // V2 targeting by phone
    | { type: 'segments'; ids: Id[] };                            // v1 forms only (sets)
  stacking: StackingConfig;          // V2 stacking_config (v1: can_club_with_other_discounts)
  limits: { total?: number; perCustomer?: number; perOrder?: number };   // V2: omitted = unlimited; v1: 1000000 → undefined
  device: 'website' | 'app' | 'all';
  visibility: 'always' | 'hidden' | 'eligible';
  mustApply: boolean;
  payment: { disableForCod: boolean; disableForPrepaid: boolean };   // V2: cross_domain_effects PAYMENT
  crossDomainEffects: CrossDomainEffect[];   // V2: PAYMENT / SHIPPING / REWARDS / DISCOUNT
  startsAt: DateTime;
  endsAt?: DateTime;                 // V2: valid_until omitted; v1: 9999-12-31 → undefined
  bulkCampaign?: BulkCodeCampaign;   // discount sets only
}
```

The transformers write exactly what today's UI writes, quirks included. Discount behaviour does not change.

- **V2** (`formToV2Payload`): money in paise; free gift as `CART` + `FREE_GIFT` action; unlimited and no end date omitted.
- **Legacy v1**: buy X get Y stores `X + Y` as `min_cart_quantity` (Shopify-synced discounts store `X` as `min_product_quantity`).

One route for every kind today (`/discounts/new`, edit at `/discounts/:id`). API types per kind:

| Kind | V2 `type` / action |
|---|---|
| `cart` | `CART` + `CART` (or `PRODUCT` when product-based) |
| `buy_x_get_y` | `BXGY` + `BXGY` (`buy_rules[]`, `get_rule`, `get_quantity`) |
| `bundle` | `BUNDLE` + `BUNDLE` (capped) |
| `dynamic_tier` | `DYNAMICTIER` + one action per tier |
| `free_gift` | `CART` + `FREE_GIFT` |

Legacy (discount sets, AI create):

| Kind | Route slug (today) | API `discount_type` / action |
|---|---|---|
| `product` | `amount_off_products` | `CartDiscount` + `product_discount` |
| `order` | `amount_off_order` | `CartDiscount` + `cart_fixed_discount` / `cart_percentage_discount` |
| `buy_x_get_y` | `buy_x_get_y` | `BxGy` |
| `gift_with_purchase` | `gift_with_cart` | `gift_with_cart` |

## Bulk codes (discount sets)

A discount with many unique generated codes.

```ts
interface BulkCodeCampaign {
  id: Id;                            // campaign_id
  discountId: Id;
  prefix?: string; suffix?: string;
  codeLength: number;
  totalCodes: number;
  usesPerCode: number;
  status: 'initiated' | 'completed';
  codesFileUrl?: string;
  createdAt: DateTime;
}
```

## On orders

```ts
interface DiscountApplication {
  title: string;
  description?: string;
  code?: string;
  value: DiscountValue;
  amount: Money;
}
```

## Not in v1

Gift cards: not in today's backend. Free shipping: V2 supports SHIPPING cross-domain effects; gk-pages hides the per-discount editor and round-trips the value.

## Assistant note

os-discount already has an AI session API (`/os-discount/sessions/*`). The assistant should reuse it for discount creation rather than build a second path. Today that flow saves through the legacy v1 create, not V2.

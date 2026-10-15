# Discounts

[← Schema](README.md)

Service: os-discount (`/api/v1/admin/os-discount/*`). The backend stores discounts as a rules engine (`rules[].conditions[]` / `actions[]`). The domain model is typed by discount kind; the transformer maps to and from rules, so this complexity stays in one file.

## Discount

```ts
type DiscountKind =
  | 'order'                  // fixed or % off the cart
  | 'product'                // fixed or % off variants/collections
  | 'buy_x_get_y'
  | 'gift_with_purchase';    // free item(s) with cart

type DiscountValue =
  | { type: 'percentage'; percent: number }
  | { type: 'fixed'; amount: Money };

interface Discount extends Entity {
  title: string;
  description?: string;
  terms: string[];
  kind: DiscountKind;
  method: 'code' | 'automatic';      // auto_apply
  code?: string;
  status: 'draft' | 'published' | 'inactive' | 'scheduled' | 'expired';   // last two set by system
  value?: DiscountValue;             // order, product
  appliesTo?: { variantIds?: Id[]; collectionIds?: Id[] };
  buyXGetY?: {
    buy: { quantity: number; variantIds?: Id[]; collectionIds?: Id[] };
    get: { quantity: number; variantIds: Id[] };     // free
  };
  gifts?: { variantIds: Id[] };
  minimum?: { subtotal?: Money; quantity?: number };
  eligibility:
    | { type: 'all' }
    | { type: 'customers'; ids: Id[]; exclude?: boolean }
    | { type: 'segments'; ids: Id[] };
  combinable: boolean;               // can_club_with_other_discounts
  limits: { total?: number; perCustomer?: number };   // 1000000 → undefined
  device: 'website' | 'app' | 'all';
  visibility: 'always' | 'hidden' | 'eligible';
  mustApply: boolean;
  payment: { disableForCod: boolean; disableForPrepaid: boolean };
  startsAt: DateTime;
  endsAt?: DateTime;                 // 9999-12-31 → undefined
  bulkCampaign?: BulkCodeCampaign;   // discount sets only
}
```

The transformer must write exactly what today's UI writes, including its quirks. For buy X get Y, today's UI stores `X + Y` as `min_cart_quantity` (Shopify-synced discounts store `X` as `min_product_quantity`). Discount behaviour does not change.

Route slugs and API types per kind:

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

Free shipping discounts and gift cards: not in today's backend.

## Assistant note

os-discount already has an AI session API (`/os-discount/sessions/*`). The assistant should reuse it for discount creation rather than build a second path.

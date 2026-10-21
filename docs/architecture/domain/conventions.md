# Conventions

[← Domain](README.md)

Shared building blocks used by every entity. The domain is consistent even where the backend is not; transformers normalise at the boundary ([service API](../service-api/README.md#what-transformers-normalise)).

## Identity

```ts
type Id = string;            // opaque; never parse or build IDs in the UI
type Handle = string;        // URL-safe slug, unique per store per entity type
```

- Some services brand ids with a prefix (inventory `invi_`, `iloc_`); still opaque, typed per entity (`LocationId`).
- Tenant: **`storeId`**, the merchant's string `m_id`. Entities don't carry it; backend names for it stay in the service API.

## Naming

One name per concept across the frontend. Where a choice is open, follow the Shopify Admin vocabulary:

| Concept | Name | Not |
|---|---|---|
| Tenant | `storeId` | merchantId, mid, shop |
| Write that changes an existing record | `resource.update` (Shopify `productUpdate`) | `.save`, `.edit` |
| Create / delete | `resource.create` / `resource.delete` | `.add`, `.remove` |
| Permission | Shopify-style scope `read_products`, `write_orders` | `products:view` |
| Service ids in definitions | lowercase, as in [gateway services](../gateway/README.md#services) (`'item'`, `'os-order'`) | `'ITEM'` |

Backend names that differ are converted once in the service's API module.

## Money

```ts
type CurrencyCode = 'INR' | string;   // ISO 4217
interface Money {
  minor: number;            // integer paise. ₹449.00 → 44900
  currency: CurrencyCode;
}
```

- Never a float, never a string: transformers turn wire strings and rupees into integer paise.
- Helpers add, subtract, multiply by quantity and format.

## Dates

```ts
type DateTime = string;      // ISO 8601, UTC
type DateOnly = string;      // "2026-10-14"
```

- Epoch timestamps (timeline) become `DateTime` at the boundary.
- Display uses the store time zone; no wire field carries one, so v1 uses `Asia/Kolkata`.

## Common fields

```ts
interface Entity {
  id: Id;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

## Lists

```ts
interface Page<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
}

```

## References vs snapshots

| Use | When |
|---|---|
| **Reference** (`productId`) | Live relationship (collection → products) |
| **Snapshot** (copied fields) | Historical record (order line item title and price) |

## Shared value types

```ts
interface Address {
  firstName?: string; lastName?: string; company?: string;
  address1: string; address2?: string;
  city: string; province?: string; provinceCode?: string;   // state; "MH"
  zip: string;                                             // pincode
  country: string; countryCode: string;                    // "IN"
  phone?: string;
}

interface Image {
  id: Id; url: string; altText?: string; width?: number; height?: number;
}

interface Weight { value: number; unit: 'g' | 'kg' | 'lb' | 'oz' }

```

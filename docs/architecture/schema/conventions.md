# Conventions

[← Schema](README.md)

Shared building blocks used by every entity. The UI domain model is consistent even where the backend is not; API modules normalize at the boundary.

## What the backend looks like today

| Concern | Backend today | Domain model |
|---|---|---|
| Field case | Mixed by service: os-item, os-order, os-discount, inventory use snake_case; os-customer, os-resources, apps, collections use camelCase | camelCase |
| Envelope | Varies: `{products}`, `{items}`, `{data}`, `{results}`, `{data:{customers}}` | `Page<T>` |
| Pagination | Page + limit everywhere (variants use offset); field names vary (`totalPages` / `total_pages`) | `Page<T>` with page info |
| Money | Mostly integer paise (products, orders, discounts, refunds). Exceptions: customer `totalSpent` in rupees, PO costs as decimal strings | `Money` in paise |
| Status values | Lowercase, PascalCase (`Partially_Received`) or display strings (cancel reasons) | lowercase snake_case unions |
| Sentinels | `end_date: 9999-12-31`, `available_coupons: 1000000` mean "none" | `undefined` |

## Identity

```ts
type Id = string;            // opaque; never parse or build IDs in the UI
type Handle = string;        // URL-safe slug, unique per store per entity type
```

Tenant: **`storeId`**, the merchant's `m_id`.

| Where | Name |
|---|---|
| Frontend: URL `/store/$storeId`, query keys, command context | `storeId` |
| Backend | `merchant_id`, `merchantId`, `store_id`, `storeId`; headers `merchant-mid`, `gk-merchant-id` |

- The API client maps `storeId` to each service's name on the way out; nothing above `api/` sees the backend names.
- Entities don't carry it.

## Naming

One name per concept across the frontend. Where a choice is open, follow the Shopify Admin vocabulary:

| Concept | Name | Not |
|---|---|---|
| Tenant | `storeId` | merchantId, mid, shop |
| Write that changes an existing record | `resource.update` (Shopify `productUpdate`) | `.save`, `.edit` |
| Create / delete | `resource.create` / `resource.delete` | `.add`, `.remove` |
| Permission | Shopify-style scope `read_products`, `write_orders` | `products:view` |
| Service ids in definitions | lowercase, as in [services](../platform/api-client.md#services) (`'item'`, `'os-order'`) | `'ITEM'` |

Backend names that differ are converted once in the service's API module.

## Data flow: transform once, never mutate

1. **At the boundary** (`api/<service>/transformer.ts`): parse the response with its schema and build a **new** domain object (camelCase, `Money`, `Page<T>`). This is the only place backend shapes change, and only for consistency.
2. **Everywhere above**: domain objects are read-only. Code never mutates query data, never reshapes it in hooks, never stores a copy.
3. **At the point of display**: anything a screen needs in another form (labels, formatted money, grouped rows) is derived at render time by a pure function (`domain/<entity>/format.ts`) that returns a new value.

Writes go the other way: the command builds the request payload from its input as a new object.

## Money

```ts
type CurrencyCode = 'INR' | string;   // ISO 4217
interface Money {
  minor: number;            // integer paise. ₹449.00 → 44900
  currency: CurrencyCode;
}
```

No floating-point math on money. Helpers add, subtract, multiply by quantity and format.

## Dates

```ts
type DateTime = string;      // ISO 8601, UTC
type DateOnly = string;      // "2026-10-14"
```

Epoch timestamps (timeline) are converted at the boundary. Display uses the store time zone.

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

interface ListParams {
  view?: string;                         // active tab
  search?: string;
  filters?: Record<string, unknown>;     // filter id → value; mapped by each filter's toParams
  scope?: Record<string, string>;        // required scope (location) or relation scope (customer_id)
  sort?: { field: string; direction: 'asc' | 'desc' };
  page?: number;                         // 1-based
  limit?: number;                        // 50
}
```

Some lists are server-filtered with a condition list (customers, segments). Same shape everywhere:

```ts
interface Condition { field: string; operator: string; value: unknown }
interface ConditionGroup { match: 'all' | 'any'; conditions: Condition[] }
```

## Saved views and sort options

Orders already expose server-defined views (`{name, query}`) and sort options (`{key, name}`). Lists use these when the API provides them.

## References vs snapshots

| Use | When |
|---|---|
| **Reference** (`productId`) | Live relationship (collection → products) |
| **Snapshot** (copied fields) | Historical record (order line item title and price) |

## Write metadata

Writes carry the acting staff member, added by the API client from the session, in the service's casing:

| Service | Fields |
|---|---|
| os-order (orders, drafts, refunds, order tags, fulfillments, holds) | `staff_id`, `staff_name` |
| os-customer (customers, addresses, comments) | `staffId`, `staffName` |
| Others | none today |

`Actor` (below) is how commands record who ran them (staff, app, assistant) in audit events.

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

interface Actor { type: 'staff' | 'app' | 'assistant' | 'system'; id?: Id; name?: string }
```

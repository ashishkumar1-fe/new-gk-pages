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

Tenant (merchant) is implicit: requests carry merchant headers (and `storeId` where the API needs it), so entities don't carry `merchantId` in the domain model.

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
| os-order (orders, drafts, refunds, order tags) | `staff_id`, `staff_name` |
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

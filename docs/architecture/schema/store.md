# Store

[← Schema](README.md)

Store-level configuration and supporting entities.

## Store

```ts
interface Store {
  id: Id;
  name: string;
  // Filled as the store settings API grows; optional until then.
  email?: string;
  phone?: string;
  address?: Address;
  currency: CurrencyCode;            // "INR" default
  timezone?: string;                 // "Asia/Kolkata"
  unitSystem?: 'metric' | 'imperial';
  weightUnit?: Weight['unit'];
  primaryDomain?: string;
  seoDefaults: { title?: string; description?: string };   // /configs/seo/default
}
```

Today: merchant config endpoints only (`/api/dashboard/merchant-config`). v1 shows what they return.

## Sales channels

```ts
interface Channel {
  id: Id;
  name: string;                      // "Online store", "Amazon", "Flipkart"
  kind: 'online_store' | 'pos' | 'marketplace';
  connected: boolean;
}
```

Today: `product.sales_channel` is `["online","pos"]`. v1 keeps exactly that; marketplaces in the design are a product decision.

## Apps

Service: app ecosystem (`/api/v1/merchants/apps`, `/extensions`).

```ts
interface App {
  id: Id;
  name: string;
  icon?: string;
  developer: { id: Id; name: string };
  category?: string;
  kind: 'embedded' | 'extension' | 'no_ui';
  installed: boolean;
  version?: string;
  updateAvailable: boolean;
}
```

## Media library

Service: os-resources (`/api/v1/admin/media/assets`, upload with presign → confirm).

```ts
interface MediaAsset extends Entity {
  fileName: string;
  altText?: string;
  url: string;
  fileType: string;
  size: number;
  width?: number; height?: number;
  usage: { total: number; product: number; variant: number; collection: number; customField: number };
}
```

## Not in v1

Shipping zones, custom domains, checkout setup and an admin notification feed appear in the design but have no backend today. See [deferred.md](deferred.md).

## Other existing entities (not core to v1 design)

| Entity | Service | Notes |
|---|---|---|
| Review | item service `/reviews` | rating, text, media, visibility; grouped by product |
| Navigation menu | `/nav-menus` | nested items (depth ≤ 2); optimistic locking via `version` |
| Search config, synonyms, merchandising | `/search/*` | storefront search tuning |
| Brand profile | `/brand-mappings` | tone of voice, audience, keywords; useful context for the assistant |
| Import/export job | bulk-ops service | `{ status, totalRows, completedRows, progress }`; products and orders |

## Staff

Mutations carry `staff_id` and `staff_name` from the session. Staff and roles management is out of scope for v1.

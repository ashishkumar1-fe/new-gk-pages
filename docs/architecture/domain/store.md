# Store

[← Domain](README.md) · Wire: [dashboard](../gateway/dashboard.md), [media-apps](../gateway/media-apps.md)

## Store

From `user/details` (`merchant_details`, `config`) and the SEO defaults endpoint.

```ts
interface Store {
  id: Id;                            // storeId = m_id
  merchantNumber: number;            // merchant_details.id; switch-merchant only
  name: string;                      // business_name
  shortName?: string;
  email?: string;
  website?: string;
  country?: string;
  platform: string;
  products: Record<string, boolean>; // config.selected_products; pages = entitlement
  mode: 'live' | 'test';             // derived client-side (storeMode rule)
  currency: CurrencyCode;            // 'INR'; no wire field
  timezone: string;                  // 'Asia/Kolkata'; no wire field
  seoDefaults: { title?: string; description?: string };
}

type Channel = 'online' | 'pos';     // product.sales_channel; marketplaces deferred
```

## Apps

```ts
interface App {
  id: Id;
  name: string;
  icon?: string;
  developer: { id: Id; name: string };
  category?: { id: Id; name: string };
  kind?: 'embedded' | 'extension' | 'no_ui';
  installed: boolean;                // isInstalled
  currentVersion?: { id: Id; name: string };
  latestVersion?: { id: Id; name: string };
  updateAvailable: boolean;          // hasUpdateAvailable
}
```

## Media

```ts
interface MediaAsset extends Entity {
  fileName: string;
  altText?: string;
  url: string;
  fileType: string;
  size: number;                      // bytes; the list sends a formatted string
  width?: number; height?: number;
  references: { kind: 'metafield' | 'metaobject' | 'visual_editor'; entities: { type: string; id: Id }[] }[];
}
```

Upload: images, documents and audio are one multipart request; video is presign → upload → confirm.

## Rules

| Rule | What | gk-pages source |
|---|---|---|
| `storeMode` | live when `config.enhancer_app`, or KYC status empty, or permission `live_mode` with KYC approved; skipped for internal users | dashboard-ui `store/user` ([dashboard](../gateway/dashboard.md#user-and-merchant)) |
| `hasPages` | `config.selected_products.pages` → entitlement ([identity](../platform/identity-access.md#entitlement)) | dashboard-ui `sideNav/index.tsx:1476` |

Design-only store features: [deferred](deferred.md).

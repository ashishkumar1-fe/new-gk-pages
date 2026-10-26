# media-apps

[← Gateway](README.md)

Base `{RESOURCES}` (`REACT_APP_OS_RESOURCE_API_URL`), paths relative to `/api/v1/admin/media`; `{APPS}` (`REACT_APP_MERCHANT_APP_STORE_API_URL`), paths relative to `/api/v1`. Case: camelCase. Envelope: `{ success: boolean; status_code?: number; message?: string; data: T }`; errors read `{ error }`.

## Media library and uploads

Source: gk-pages `src/modules/assets/api/assets.api.ts`, `src/modules/assets/api.ts`, `src/modules/assets/utils/mediaUploadUtils.ts`, `src/modules/assets/types.ts`, `src/interfaces/assets.ts`, `src/hooks/useAssetEditor.ts`

| Endpoint | Request | Response |
|---|---|---|
| `GET /assets` | `?search, fileType, fileSize, usedIn, product (csv), page, limit, offset, sortBy, sortOrder: 'asc'\|'desc'` | `{ assets: Asset[], pagination: { page, limit, total, totalPages, hasNext, hasPrevious } }` (pagination ?) |
| `GET /assets/:assetId` | — | `{ asset: AssetDetail }` ? |
| `PUT /assets/:assetId` | `UpdateAssetPayload` | `{ asset: AssetDetail }` ? |
| `POST /assets/:assetId/duplicate` | `UpdateAssetPayload` | `{ asset: AssetDetail }` ? (new `id`) |
| `POST /assets/:assetId/revert-to-original` | `{}` | `{ asset: AssetDetail }` ?, may be empty → client refetches |
| `DELETE /assets/:assetId` | — | envelope |
| `DELETE /assets/bulk` | body `{ storeId, assetIds: string[] }` | envelope |
| `POST /upload` | multipart `file` | `UploadResponse` |
| `POST /upload/presign` | `{ filename, mimeType, fileSize: number }` | `{ presignedUrl, assetId }` ? |
| `PUT <presignedUrl>` (storage) | raw file, `Content-Type: <file.type>` | 2xx |
| `POST /upload/confirm/:assetId` | — | `UploadResponse` |

```ts
interface Asset {                             // list row
  id: string; fileName: string; altText: string | null; dateAdded: string
  size: string                                // pre-formatted, e.g. "1012.14 KB"
  references: References; url: string; width?: number; height?: number; fileType: string; createdAt: string; updatedAt: string
}
interface References {
  total: number; product: number; variant: number; collection: number; metafield: number; metaobject: number; 'visual-editor': number
  entities?: { entityType: string; entityId: string; entityTitle: string | null }[]
}
interface AssetDetail {                       // all ?; normalizer also accepts snake_case aliases
  id: string; filename: string; extension: string; altText: string | null; url: string   // url | cdnUrl
  width: number | null; height: number | null; fileSize: number | string; fileType: string
  mediaType: string; mimeType: string | null; focalPoint?: { x: number; y: number }
  originalAvailable: boolean; references: References; createdAt: string; updatedAt: string
}
interface UpdateAssetPayload {
  filename?: string; altText?: string; focalPoint?: { x: number; y: number }
  operations?: { type: 'crop' | 'resize' | 'rotate' | 'flip' | 'background' | 'draw'; params: object }[]
  replaceImageBase64?: string                 // base64 without the data: prefix
}
interface UploadResponse {
  success: boolean; isSuccess: boolean; status_code: number; timestamp: number; error: string
  data: { url: string; asset: { id: string; filename: string; fileType: string }; wasDuplicate: boolean }
}
```

- Flow: `video/*` → presign → storage `PUT` → confirm; images, documents and audio → multipart `POST /upload` through the gateway.
- The storage `PUT` goes straight to the S3 presigned URL: it bypasses the gateway (size limit), with no cookie and no merchant headers.
- upload, presign and confirm use raw `fetch` (`credentials: 'include'`, `merchant-mid` + `gk-merchant-id` set by hand), not the API client.
- Client limits: image, document, audio 20MB; video 200MB.
- List `Asset` uses `fileName` / `size`; detail uses `filename` / `fileSize`. Same resource, two shapes.

## Apps and extensions

Source: gk-pages `src/modules/merchant-apps/api.ts`, `src/utils/appStoreUtils.ts`, `src/modules/ui-extensions/api.ts`, `src/interfaces/merchant-apps.ts`, `src/pages/merchant-apps/MerchantAppsHome.tsx`

| Endpoint | Request | Response |
|---|---|---|
| `POST /auth/merchant/token` | `{ gkMerchantId: m_id, name: short_name }` | `{ token, expiresAt, expiresIn, merchant: { id, name } }` |
| `GET /merchants/apps` | `?installedOnly=true&search=&page=&limit=` | `{ apps: AppStoreApp[], total, page, totalPages, limit }` (paging ?) |
| `PATCH /merchants/apps/:appId/update` | — | `{ success, message? }` |
| `DELETE /merchants/apps/:appId` | — | `{ success, message? }` |
| `GET /merchants/extensions?target=` | URL-encoded target, e.g. `admin.product-details.block.render` | `ExtensionManifest[]` ? |

```ts
interface AppStoreApp {
  id: string; name: string; icon: string | null
  developer: { id: string; name: string }; category: { id: string; name: string }
  currentVersion: { id: string; name: string; buildZipKey?: string } | null
  latestVersion: { id: string; name: string; buildZipKey?: string } | null
  hasUpdateAvailable: boolean; isInstalled: boolean; appKind?: 'embedded' | 'extension' | 'no_ui'
}
// ExtensionManifest: type from gokwik-ui-extensions-core (not vendored); host reads id, appId, appName, handle, siblings ?
```

- App-store calls (except `/auth/merchant/token`) add `Authorization: Bearer <appStoreToken>` (JWT in `localStorage.appStoreToken`) alongside the cookie and merchant headers.
- The Apps page mints a fresh token on every load; extensions mint one only when it is missing or `exp` is within 60s.
- Extensions on `401` (`status` or `data.statusCode`, camelCase) → drop token, re-mint, retry once.
- The App Store UI opens at `${REACT_APP_MERCHANT_APP_STORE_URL}/app-store/apps?d=<token>` (token in the query).
- `currentVersion.buildZipKey` is used as the embedded app launch URL.

## Unused

Source: gk-pages `src/modules/assets/api/assets.api.ts`, `src/modules/assets/api.ts`, `src/modules/assets/types.ts`

| Endpoint | Request | Response |
|---|---|---|
| `GET /assets/:assetId` (`contentLibrary.getAssetById`) | — | `{ asset }` |
| `DELETE /assets/:assetId` (`contentLibrary.deleteAsset`) | — | envelope |
| `POST /assets/:assetId/generate-alt-text` (`media.generateAltText`) | `{ provider?: 'openai' \| 'rekognition', language?, maxLength?: number, context? }` | `{ suggestions: { text, confidence?, provider }[], rateLimitRemaining: { perAsset, perTenant } \| null }` |

- The first two are dead duplicate keys (`fetchAssetDetails`, `assets.api` `deleteAsset` never imported); the same paths are live through `media.getAssetById` / `media.deleteAsset`.
- Alt text: the editor calls the product service's `aiGeneration.generateAltText` with `{ imageUrl }` instead.

# bulk-ops

[← Gateway](README.md)

Base `{BULK_OPS}` (`REACT_APP_BULK_OPS_API_URL`); paths relative to `/api/v1/admin/bulk-ops`. Case: camelCase (import preview also has PascalCase keys). Money: none. Store scoping: previews take query `store-id` (= merchant `m_id` from `sessionStorage`); history takes `storeId` (the route's, the same `m_id`). Envelope: bare body, usually with `success` at top level.

Client: `makeApiCall` wrapper (merchant headers) everywhere except import preview: raw `fetch` with `merchant-mid`, `gk-merchant-id`, `credentials: 'include'`.

The "engine" flow (`apiEngine.ts`) is sandbox-only: nothing on gk-pages `main` references it.

Source: `modules/bulk-ops/api.ts`, `pages/bulk-ops/ExportPage.tsx`, `pages/bulk-ops/ImportPage.tsx`, `pages/bulk-ops/ExportHistoryPage.tsx`, `components/common/ExportImportHistoryCard.tsx`, `utils/apiConstants.ts`, `types/bulk-ops.types.ts`

## Export

| Endpoint | Request | Response |
|---|---|---|
| `GET /export/template/:entityTypes` | `:entityTypes` csv of `'products' \| 'orders'` | `{ success, entityTypes: string[], template: { entities: ExportEntity[] } }` |
| `POST /export/preview` | query `user-email, user-name, store-id`; `{ entities: ExportEntity[], fileFormat: 'csv' \| 'xlsx' }` | `{ success, message, jobId, exportBody: { entities }, estimatedTime, fileFormat }` |
| `POST /export/process/:jobId` | none | `{ success, message, jobId, downloadUrl, status, estimatedTime }` |

```ts
interface ExportEntity {
  entityType: string
  configuration: { groups: Record<string, { name: string; include: boolean; columns: { name: string; group: string; include: boolean }[] }> }
  filters?: { dateFrom?: string; dateTo?: string; productType?: string; tags?: string }
}
```

- Two-step: preview creates the job and returns `jobId`; process starts it. The history card can also call process for a pending job.
- The client sets a group's `include` from whether any of its columns is included.

## Import

| Endpoint | Request | Response |
|---|---|---|
| `POST /preview/import` | query `user-email, user-name, store-id`; multipart `file`, `entityType: 'product' \| 'order'` | `ImportPreview` |
| `POST /import/:jobId` | none | `{ success, message, jobId }` |
| `GET /s3/sample-url` | query `pathType` = `sample-import-{product\|order}-{csv\|excel}` | `{ url }` ? |

```ts
interface ImportPreview {
  success: boolean; isValid: boolean
  fileInfo: { fileName: string; fileFormat: string; fileSize: number; fileSizeFormatted: string; totalRows: number }
  Estimation: { estimatedInsertTime: string }; FileField: string[]; Fields: { required: string[]; optional: string[] }
  validation: { missingRequiredFields: string[]; extraFields: string[] }; errors: string[]; warnings: string[]
  nestedDtoValidation: { variants?: { isValid: boolean; missingRequiredFields: string[]; errors: string[] } }
  jobId: string; s3FileUrl: string; s3FileKey: string; jobStatus: string; jobStep: string
}
```

- Import uses singular entity types (`product`); export uses plural (`products`).
- Preview errors: non-2xx body `{ message }` is shown.

## Jobs

| Endpoint | Request | Response |
|---|---|---|
| `GET /job` | query `storeId, userName?, userEmail?, status?, action? ('IMPORT' \| 'EXPORT'), offset?, limit?, page?` | `{ success, data: Job[], pagination: { total, page, limit, totalPages, hasNextPage, hasPreviousPage } }` |
| `GET /job/:jobId/progress` | none | `{ jobId, status, totalRows: number \| null, completedRows: number \| null, progressPercentage: number \| null, isCompleted: boolean }` |
| `POST /job/:jobId/cancel` | none | `{ message, jobId, status }` |

```ts
interface Job {
  jobId: string; scheduleId: string | null; merchantId: string; storeId: string; action: string; status: string; step: string
  fileUploadedSize: string | null; fileFormatName: string; fileResultSize: string | null; fileResultName: string | null; type: string | null
  fileUploaded: string | null; fileUploadedUrl: string | null; resultFileUrl: string | null; exportBody: { entities: ExportEntity[] }
  errorMessage: string | null; totalRows: number | null; completedRows: number | null; userName: string; userEmail: string
  createdAt: string; updatedAt: string; deletedAt: string | null
}
```

- Pagination here is `hasNextPage`/`hasPreviousPage`, not the gateway's `hasNext`/`hasPrevious`.
- Callers pass `merchantId` in filters; the client drops it.
- Progress is polled per running job; a completed job triggers a history refetch.

## Unused

| Endpoint | Note |
|---|---|
| `GET /export/job/:jobId/status` | `getExportJobStatus`; constant only |
| `GET /export/job/:jobId/download` | `downloadExportFile`; constant only |

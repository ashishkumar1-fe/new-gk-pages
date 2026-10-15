# Import and export jobs

[← Commands](../README.md) · Service: bulk-ops (`{BULK_OPS}/api/v1/admin/bulk-ops`)

Products and orders import and export run as background jobs on the bulk-ops service, as today. Other resources use their own flows (see each file).

| Resource | Import | Export |
|---|---|---|
| Product | bulk-ops job | bulk-ops job |
| Order | bulk-ops job | bulk-ops job |
| Inventory | `POST /inventory/import` (direct) | file from `GET /inventory/export-csv`, or current page in the browser |
| Customer | — | async export job on os-customer, or current page in the browser |
| Draft order | — | CSV in the browser |

## Export (`product.export`, `order.export`)

| # | Call | Result |
|---|---|---|
| 1 | `GET /export/template/{entity}` | column groups to include |
| 2 | `POST /export/preview?user-email&user-name&store-id` `{entities:[{entityType, configuration:{groups}, filters?:{dateFrom, dateTo}}], fileFormat: 'csv' \| 'xlsx'}` | `jobId` |
| 3 | `POST /export/process/{jobId}` | job runs; file emailed to the staff member |

Input: `{ entity, groups, dateRange?, format }`. Toast after step 3: "Export started. The file will be emailed to {email}."

## Import (`product.import`, `order.import`)

Two commands, as today's two buttons:

| Command | Call | Result |
|---|---|---|
| `*.importPreview` | `POST /preview/import` (multipart file, `entityType`) | `jobId` + validation (row errors) |
| `*.import` | `POST /import/{jobId}` | job runs |

- `*.import` is enabled only when the preview is valid.
- Sample file: `GET /s3/sample-url?pathType=`.

## Job tracking

Shared by both:

- Progress: `GET /job/{jobId}/progress` → `{status, totalRows, completedRows, progressPercentage, isCompleted}`, every 5 s.
- Cancel: `POST /job/{jobId}/cancel` (`bulkOps.cancel`, confirm "Cancel this job?", permission of the job's resource).
- History: `GET /job`, the `job` supporting resource ([registry](../../resources/registry.md)); download opens the result file URL.
- Running jobs show in the top-bar jobs indicator and notify when finished.

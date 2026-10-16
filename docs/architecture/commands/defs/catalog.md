# Catalog commands

[← Commands](../README.md) · Resources: [product](../../resources/defs/product.md), [collection](../../resources/defs/collection.md) · Service: item. Paths are relative to `{BASE}/api/v1/admin` unless they start with a token ([base URLs](../../platform/api-client.md#base-urls)).

Permission: `write_products` for every command unless noted (enforcement off in v1).

Columns: **Effect** R read-only · D destructive · I idempotent · X external. **Mode** P pessimistic · O optimistic · U undoable. Payload shapes are built by the service transformer from the domain input; only behaviour that matters is noted.

## Product

| Command | Scope | Steps (endpoint) | Confirm | Effect | Mode | After |
|---|---|---|---|---|---|---|
| `product.create` | page | `POST /products` `{product}` | — | — | P | toast "Product created"; open detail |
| `product.update` | record | `PUT /products/:id?storeId=` `{product}` | — | I | P | set detail; invalidate product lists, inventory |
| `product.delete` | record | `DELETE /products/:id?storeId=` | critical: "Delete {title}?" | D | P | toast; go to list; invalidate lists |
| `product.bulkDelete` | selection | `DELETE /products/bulk` (count only: all or nothing) | critical: "Delete N products? This can't be undone." | D | P | toast; invalidate lists |
| `product.setStatus` | selection | `POST /product-operations/bulk-update`, each full product built from `selection.rows` (count only) | > 25 items | I | P | toast "N products updated"; invalidate lists |
| `product.bulkEdit` | selection | form (status, vendor, type per product; price, SKU per variant) → same bulk-update | — | I | P | toast "Updated N products" |
| `product.duplicate` | record | navigate to create with `sourceId` prefill | — | R | — | — |
| `product.copyLink` | record | build storefront URL, copy | — | R | — | toast "Link copied" |
| `product.importPreview` | page | bulk-ops ([bulk-ops.md](bulk-ops.md)) | — | — | P | shows validation; enables import |
| `product.import` | page | bulk-ops ([bulk-ops.md](bulk-ops.md)) | "Import N rows? Existing products may be updated." | X | P (job) | job indicator |
| `product.export` | page | bulk-ops job ([bulk-ops.md](bulk-ops.md)) | — | R | P (job) | file emailed; job indicator |
| `variant.update` | record | `PUT /variants/:id` | — | I | P | toast; set detail |
| `product.generateContent` | record | `POST /content/title-and-description`; apply with `PATCH /content/:requestId/smart` | — | — | P | fills title and description in the draft; does not save |

Notes:
- **`product.setStatus`** input: `{ ids, status }`. Labels: "Set as active", "Set as draft", "Archive products".
- **`product.duplicate`** prefill as today: title "{title} (Copy)", handle "{handle}-copy", status draft, collections and custom fields kept; variant stock 0, variant weight 0 kg, policy deny, tracking on. Saved with `product.create`.
- **`product.copyLink`**: `{storefront_url}/{productsRoute}/{handle}`; disabled with reason "Set the storefront URL in Settings" when not configured.
- **`product.generateContent`**: input `{ descriptionLength, userDescription, idealProductId?, productId? }`. Today only on create; v1 also on edit.
- **Variant bulk edits** in the variants view: price and SKU join the draft (`product.update`); quantity stays an immediate inventory write.

## Collection

| Command | Scope | Steps | Confirm | Effect | Mode | After |
|---|---|---|---|---|---|---|
| `collection.create` | page | `POST /collections` | — | — | P | toast "Collection "{title}" created"; open detail |
| `collection.update` | record | `PUT /collections/:id?storeId=` with `addProducts`, `removedProducts` | — | I | P | set detail; invalidate lists |
| `collection.delete` | record | `DELETE /collections/:id?storeId=` | critical | D | P | go to list |
| `collection.bulkDelete` | selection | `POST /collections/bulk-delete` `{collectionIds, storeId}` | critical: "Delete N collections?" | D | P | invalidate lists |
| `collection.setPublished` | selection | `PATCH /collections/bulk` `{storeId, collections:[{id, data}]}` | > 25 items | I | P | toast "N collections set to {status}" |
| `collection.bulkEdit` | selection | form (title, status; type read-only; empty titles blocked) → same bulk PATCH | — | I | P | toast |
| `collection.copyLink` | record | build storefront URL, copy | — | R | — | toast |

Notes:
## Price schedule (Flash sale)

| Command | Scope | Steps | Confirm | Effect | Mode | After |
|---|---|---|---|---|---|---|
| `priceSchedule.create` | page | `POST /bulk-edit/{storeId}/price-update` | yes: shows action, field, scope, timing | X | P | go to schedules list |
| `priceSchedule.cancel` | record | `DELETE /bulk-edit/{storeId}/price-update/schedules/:id` | critical: "Cancel price schedule "{name}"?" | D | P | toast "Price schedule cancelled" |

- Rules: `scheduleTiming`, `scheduleCancellable` ([domain](../../domain/pricing-tax.md#rules)).
- A conflict returns `interferingTasks`; v1 shows them in the error (today only the message shows).

## Custom field definitions

| Command | Scope | Steps | Confirm | Effect | Mode |
|---|---|---|---|---|---|
| `fieldDefinition.create` | global | `POST {INVENTORY}/v1/admin/metafield-definitions` | — | — | P |
| `fieldDefinition.update` | record | `PUT {INVENTORY}/v1/admin/metafield-definitions/:id` | — | I | P |
| `fieldDefinition.delete` | record | `DELETE {INVENTORY}/v1/admin/metafield-definitions/:id` | critical: "Deleting "{name}" permanently removes this definition and all its values." | D | P |

All invalidate field definitions for the owner type. The design's inline "Create definition" in the product editor runs `fieldDefinition.create`, then the new field appears in the draft.

## Exposure

| Command | Palette | Assistant | Extensions |
|---|---|---|---|
| create, update, setStatus, bulkEdit, duplicate, copyLink, generateContent | ✓ | ✓ (topic: catalog) | ✓ |
| delete, bulkDelete, import | ✓ | — | — |
| export, importPreview | ✓ | export only | — |
| priceSchedule.* | ✓ | — | — |
| fieldDefinition.* | ✓ | create only | — |

# Inventory commands

[← Commands](../README.md) · Resources: [inventory](../../resources/defs/inventory.md), [purchase order](../../resources/defs/purchase-order.md), [transfer](../../resources/defs/transfer.md) · Service: inventory. Paths are relative to `{INVENTORY}/v1/admin` unless they start with `/v3`.

Permission: `write_inventory` for every command (enforcement off in v1).

Effect: R read-only · D destructive · I idempotent · X external. Mode: P pessimistic.

## Inventory

| Command | Scope | Steps | Confirm | Effect | Mode | After |
|---|---|---|---|---|---|---|
| `inventory.adjust` | record | popover: set / add / remove, bucket, reason, note (`adjustPreview`, `adjustValidate`) → set on hand · set quantities · adjust quantities ([gateway](../../gateway/inventory.md)) | — | — | P | toast "Inventory updated"; invalidate inventory, products |
| `inventory.bulkEdit` | selection | form: available or on hand per row at the current location (`bulkEditDerive`, `bulkEditWrite`) | — | I | P | toast "Updated N items" |
| `location.create` / `location.update` | page / record | `POST` / `PATCH /v3/admin/locations[/:id]` | — | — | P | invalidate locations |
| `location.activate` | record | `POST /v3/admin/locations/:id/activate` | — | — | P | invalidate locations |
| `location.deactivate` | record | deactivate; on `LOCATION_HAS_STOCK_MOVE_FIRST` a "Move stock and deactivate" form (active destination ≠ source, note) retries with `drain_to`. Hidden for the default location | — | — | P | toast "Location deactivated" or "Moved N units across M SKUs to X. Location deactivated." |
| `location.delete` | record | `POST /v3/admin/locations/:id/delete` `{confirm: true}` (inactive only; 409 if default or holding stock) | critical | D | P | invalidate locations |
| `inventoryLevel.connect` / `.disconnect` | record | from the variant's "Edit locations": diff, then connect / disconnect in parallel; ≥ 1 location stays connected ("At least one location must stay connected to this variant.") | — | — | P | invalidate inventory |
| `inventory.import` | page | file → confirm → `POST /inventory/import` (multipart `file`, `warehouse_id`) | "Import {file} into {location}?" | X | P | invalidate inventory |
| `inventory.export` | page | current page: built in the browser; all: `GET /inventory/export-csv?storeId&location&variants=all_variants&export_type` (file) | — | R | P | download |

Notes:
- Bulk edit and set on hand are absolute targets; `compare_quantity` makes a stale available write fail with `COMPARE_AND_SET_CONFLICT`. Every write carries a reason and is logged (adjustments). Rules: [domain](../../domain/inventory.md#rules).
- Stock-write endpoints stay inside these commands, so a change to them is local ([deferred #5](../../domain/deferred.md)).

## Purchase order

| Command | Scope | Steps | Confirm | Effect | Mode | After |
|---|---|---|---|---|---|---|
| `purchaseOrder.create` | page | `POST /purchase-orders` | — | — | P | toast "Purchase order created successfully"; go to list |
| `purchaseOrder.update` | record | `PATCH /purchase-orders/:id` (full body) | — | I | P | set detail |
| `purchaseOrder.markOrdered` | record | same PATCH with status `Ordered` | "Mark {number} as ordered?" | — | P | invalidate inventory (incoming) |
| `purchaseOrder.close` | record | same PATCH with status `Closed` | — | — | P | toast "Purchase order closed successfully" |
| `purchaseOrder.reopen` | record | same PATCH with status `Draft` | — | — | P | — |
| `purchaseOrder.receive` | record | receive lines (`receiveCaps`, `receivePayload`) | "Receive N units into {location}?" | — | P | toast; back to detail; invalidate inventory |
| `purchaseOrder.delete` | record | `DELETE /purchase-orders/:id/?store_id=` | critical: "Delete {number}?" | D | P | go to list |
| `purchaseOrder.openReceive` | record | navigate to `/purchase-orders/$id/receive` | — | R | — | — |
| `purchaseOrder.createFromSelection` | selection | navigate to create with selected inventory rows (quantity 1, cost 0); no gk-pages entry point on main | — | R | — | — |

Notes:
- Status changes send the full PO; known cost defects: [domain](../../domain/inventory.md#rules).

## Transfer

| Command | Scope | Steps | Confirm | Effect | Mode | After |
|---|---|---|---|---|---|---|
| `transfer.create` | page | `POST /transfers` | — | — | P | toast "Transfer created successfully"; go to list |
| `transfer.update` | record | `PATCH /transfers/:id` | — | I | P | set detail |
| `transfer.markPending` | record | same PATCH with status `Pending` (button "Mark as Pending") | — | — | P | toast "Transfer marked as pending successfully"; invalidate inventory (incoming) |
| `transfer.receive` | record | receive lines (`receiveCaps`, `receivePayload`) | "Receive N units into {location}?" | — | P | invalidate inventory |
| `transfer.delete` | record | `DELETE /stock-transfers/:id` | critical: "Delete this transfer?" | D | P | go to list |
| `transfer.openReceive` | record | navigate to `/transfers/$id/receive` | — | R | — | — |
| `transfer.createFromSelection` | selection | navigate to create with selected rows (quantity 1); no gk-pages entry point on main | — | R | — | — |

Notes:
- Create sends the tracking URL built from carrier and number, as today.

## Exposure

| Command | Palette | Assistant | Extensions |
|---|---|---|---|
| inventory.export, openReceive | ✓ | ✓ (topic: inventory) | — |
| adjust, bulkEdit, location.*, inventoryLevel.* | ✓ | — | — |
| purchaseOrder / transfer create, update, markOrdered, markPending | ✓ | ✓ | — |
| receive, close, reopen | ✓ | — | — |
| delete, import | ✓ | — | — |

Commands that change on-hand stock are not exposed to the assistant in v1.

# Inventory commands

[← Commands](../README.md) · Resources: [inventory](../../resources/defs/inventory.md), [purchase order](../../resources/defs/purchase-order.md), [transfer](../../resources/defs/transfer.md) · Service: inventory. Paths are relative to `{INVENTORY}/v1/admin` unless they start with `/v3`.

Permission: `write_inventory` for every command (enforcement off in v1).

Effect: R read-only · D destructive · I idempotent · X external. Mode: P pessimistic.

## Inventory

| Command | Scope | Steps | Confirm | Effect | Mode | After |
|---|---|---|---|---|---|---|
| `inventory.adjust` | record | popover: set / add / remove, bucket, reason, note → `POST /v3/admin/inventory/set-on-hand` (on hand) · `set-quantities` (set) · `adjust-quantities` (delta) `{reason, reason_note, changes:[{inventory_item_id, location_id, quantity_name, quantity \| delta \| on_hand}]}`; header `idempotency-key` | — | — | P | toast "Inventory updated"; invalidate inventory, products |
| `inventory.bulkEdit` | selection | form: available or on hand per row at the current location; `POST /v3/admin/inventory/set-on-hand` then `set-quantities` (`compare_quantity`), reason `correction` | — | I | P | toast "Updated N items" |
| `location.create` / `location.update` | page / record | `POST` / `PATCH /v3/admin/locations[/:id]` | — | — | P | invalidate locations |
| `location.activate` | record | `POST /v3/admin/locations/:id/activate` | — | — | P | invalidate locations |
| `location.deactivate` | record | `POST /v3/admin/locations/:id/deactivate` (optional `{drain_to, reason_note}` moves all stock first) | ✓ | — | P | invalidate locations, inventory |
| `location.delete` | record | `POST /v3/admin/locations/:id/delete` `{confirm: true}` (inactive only; 409 if default or holding stock) | critical | D | P | invalidate locations |
| `inventoryLevel.connect` / `.disconnect` | record | `POST /v3/admin/inventory/levels/connect` / `disconnect` `{inventory_item_id, location_id}` | — | — | P | invalidate inventory |
| `inventory.import` | page | file → confirm → `POST /inventory/import` (multipart `file`, `warehouse_id`) | "Import {file} into {location}?" | X | P | invalidate inventory |
| `inventory.export` | page | current page: built in the browser; all: `GET /inventory/export-csv?storeId&location&variants=all_variants&export_type` (file) | — | R | P | download |

Notes:
- Bulk edit and set on hand are absolute targets; `compare_quantity` makes a stale available write fail with `COMPARE_AND_SET_CONFLICT`. Every write carries a reason and is logged (adjustments). Derived on hand / available follow [the inventory rules](../../resources/defs/inventory.md#derived-values).
- The single endpoint behind all stock writes stays inside these commands, so moving to adjustments later is local ([deferred #5](../../schema/deferred.md)).

## Purchase order

| Command | Scope | Steps | Confirm | Effect | Mode | After |
|---|---|---|---|---|---|---|
| `purchaseOrder.create` | page | `POST /purchase-orders` | — | — | P | toast "Purchase order created"; open detail |
| `purchaseOrder.update` | record | `PATCH /purchase-orders/:id` (full body) | — | I | P | set detail |
| `purchaseOrder.markOrdered` | record | same PATCH with status `Ordered` | "Mark {number} as ordered?" | — | P | invalidate inventory (incoming) |
| `purchaseOrder.close` | record | same PATCH with status `Closed` | "Close {number}?" | — | P | — |
| `purchaseOrder.reopen` | record | same PATCH with status `Draft` | — | — | P | — |
| `purchaseOrder.receive` | record | `PATCH /purchase-orders/:id/receive` (header `store_id`) `{po_id, items:[{po_item_id, inventory_item_id, quantity_received, quantity_rejected}]}` | "Receive N units into {location}?" | — | P | toast; back to detail; invalidate inventory |
| `purchaseOrder.delete` | record | `DELETE /purchase-orders/:id/?store_id=` | critical: "Delete {number}?" | D | P | go to list |
| `purchaseOrder.openReceive` | record | navigate to `/purchase-orders/:id/receive` | — | R | — | — |
| `purchaseOrder.createFromSelection` | selection | navigate to create with selected inventory rows (quantity 1, cost 0); no gk-pages entry point on main | — | R | — | — |

Notes:
- `purchaseOrder.receive` sends quantities received **in this session** (deltas), as today.
- Status values are sent in the API's casing (`Ordered`, `Closed`, `Draft`) by the transformer; commands take domain values.
- All status changes send the full PO body; costs in paise for every status change (today `markOrdered` sends unconverted costs; see [defects](../README.md#defects-in-todays-writes)).
- Delete only when status is draft.

## Transfer

| Command | Scope | Steps | Confirm | Effect | Mode | After |
|---|---|---|---|---|---|---|
| `transfer.create` | page | `POST /transfers` | — | — | P | open detail |
| `transfer.update` | record | `PATCH /transfers/:id` | — | I | P | set detail |
| `transfer.markPending` | record | same PATCH with status `Pending` | "Mark as ready to ship?" | — | P | invalidate inventory (incoming) |
| `transfer.receive` | record | `PATCH /stock-transfer/receive` `{transfer_id, items:[{st_item_id, quantity_received, quantity_rejected}]}` | "Receive N units into {location}?" | — | P | invalidate inventory |
| `transfer.delete` | record | `DELETE /stock-transfers/:id` | critical: "Delete this transfer?" | D | P | go to list |
| `transfer.openReceive` | record | navigate to `/transfers/:id/receive` | — | R | — | — |
| `transfer.createFromSelection` | selection | navigate to create with selected rows (quantity 1); no gk-pages entry point on main | — | R | — | — |

Notes:
- `transfer.receive` sends **cumulative** received quantities (unlike PO deltas), as today. The difference stays inside the two commands.
- Create sends the tracking URL built from carrier and number, as today.

## Exposure

| Command | Palette | Assistant | Extensions |
|---|---|---|---|
| inventory.export, createFromSelection, openReceive | ✓ | ✓ (topic: inventory) | — |
| adjust, bulkEdit, location.*, inventoryLevel.* | ✓ | — | — |
| purchaseOrder / transfer create, save, markOrdered, markPending | ✓ | ✓ | — |
| receive, close, reopen | ✓ | — | — |
| delete, import | ✓ | — | — |

Stock-changing commands are not exposed to the assistant in v1.

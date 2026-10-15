# inventory

[← Gateway](README.md)

Base `{INVENTORY}` (`REACT_APP_INVENTORY_API_URL`); paths shown in full under `/v3/admin` or `/v1/admin`. Case: snake_case everywhere except custom-field quirks noted there. Money: paisa (v3 item `cost` read as string, sent as integer; PO costs sent as number on create, string on update, read as string). Ids: v3 branded strings `invi_` item, `iloc_` location, `invl_` level, `inva_` adjustment, `whsub_` webhook; every v1 `warehouse_id` gk-pages sends is now an `iloc_` id (warehouses are v3 locations mirrored into the old shape). Envelope v3: `{ data, errors: V3Error[], api_version, request_id }`, lists `data: { items, total }`; v1: no shared envelope (bare array, `{ data }`, `{ results }` or `{ data, total, page, … }` per row). Every v3 write sends header `idempotency-key` (UUID v4, one per attempt). `?` = inferred from usage; in `ts` blocks `?:` keeps the source's optionality and untyped shapes are marked `// inferred`.

```ts
interface V3Error { code: V3ErrorCode; message: string; details?: Record<string, unknown> }
interface V3List<T> { items: T[]; total: number }
type QuantityName = 'available' | 'committed' | 'incoming' | 'reserved' | 'damaged' | 'safety_stock' | 'quality_control'
type MutableQuantityName = Exclude<QuantityName, 'committed'>
type Reason = 'correction' | 'received' | 'order_committed' | 'order_fulfilled' | 'order_cancelled' | 'return_restocked'
  | 'return_damaged' | 'return_quality_control' | 'qc_passed' | 'qc_failed' | 'reserved' | 'unreserved' | 'damaged'
  | 'safety_stock_set' | 'sync_shopify' | 'sync_oms' | 'import' | 'other'   // admin UI offers correction, received, damaged, safety_stock_set, import, other
```

Handled error codes (backend `message` wins; code text only when it is empty):

| code | meaning |
|---|---|
| `INSUFFICIENT_STOCK` | change would go below committed/reserved |
| `NEGATIVE_TARGET` | quantity would go below zero |
| `COMPARE_AND_SET_CONFLICT` | `compare_quantity` stale; someone moved stock |
| `COMMITTED_NOT_ALLOWED` | `committed` is order-driven, not settable |
| `LOCATION_IS_DEFAULT` | default location can't be deactivated/deleted |
| `LOCATION_HAS_STOCK_MOVE_FIRST` | location holds stock; deactivate branches into the `drain_to` flow |
| `DRAIN_SAME_SOURCE_AND_DESTINATION` | `drain_to` equals the location |
| `VALIDATION_ERROR` | bad quantity/body |
| `NOT_FOUND` | also synthesised by gk-pages when `data: null` |

## v3 items

Source: `modules/inventory/api/inventoryV3.api.ts`, `interfaces/inventoryV3.ts`

| Endpoint | Request | Response |
|---|---|---|
| `GET /v3/admin/inventory/items` | query `page, limit, variant_id, sku, search` | `V3List<Item>` |

```ts
interface Item {
  id: string; merchant_id: string; variant_id: string; sku: string; tracked: boolean; requires_shipping: boolean
  cost: string | null; country_code_of_origin: string | null; harmonized_system_code: string | null; hsn_code: string | null
  shopify_inventory_item_id: string | null; external_id: string | null; deleted_at: string | null  // deleted_at != null → inactive
  created_at: string; updated_at: string; product_id?: string | null; product_name?: string | null
}
```

- Inventory list fetches `limit=10000` items in parallel with levels, only to hide `tracked: false` rows.
- `GET /items/:id` returns `200` with `data: null` for unknown ids (no 404).

## v3 levels and stock writes

Source: `modules/inventory/api/inventoryV3.api.ts`, `interfaces/inventoryV3.ts`, `modules/inventory/utils/levelRangeFilters.ts`, `store/inventory`

| Endpoint | Request | Response |
|---|---|---|
| `GET /v3/admin/inventory/levels` | query `location_id, inventory_item_id, search, available_min, available_max, incoming_min, incoming_max, committed_min, committed_max, on_hand_min, on_hand_max, sort_by (available\|committed\|on_hand), sort_dir (asc\|desc), page, offset, limit` | `V3List<Level>` |
| `POST /v3/admin/inventory/levels/connect` | `{ inventory_item_id, location_id }` | `Level` |
| `POST /v3/admin/inventory/levels/disconnect` | `{ inventory_item_id, location_id }` | `{ disconnected: true }` |
| `POST /v3/admin/inventory/set-quantities` | `Mutation & { changes: [{ inventory_item_id, location_id, quantity_name: MutableQuantityName, quantity, compare_quantity }] }` | `MutationResult` |
| `POST /v3/admin/inventory/adjust-quantities` | `Mutation & { changes: [{ inventory_item_id, location_id, quantity_name: MutableQuantityName, delta }] }` | `MutationResult` |
| `POST /v3/admin/inventory/set-on-hand` | `Omit<Mutation, 'reference_document_uri'> & { changes: [{ inventory_item_id, location_id, on_hand }] }` | `MutationResult` |

```ts
interface Level {
  id: string; merchant_id: string; inventory_item_id: string; location_id: string
  on_hand: number; available: number; committed: number; incoming: number; reserved: number; damaged: number
  safety_stock: number; quality_control: number; cod_committed: number
  sku?: string | null; product_id?: string | null; product_name?: string | null; variant_id?: string | null; variant_title?: string | null
  reorder_point: number | null; shopify_location_id: number | null; version: number
  last_synced_at: string | null; deleted_at: string | null; created_at: string; updated_at: string
}
interface Mutation { reason: Reason; reason_note?: string; reference_type?: string; reference_id?: string; reference_document_uri?: string }
interface MutationResult {
  results: { inventory_item_id: string; location_id: string; quantity_name: QuantityName; quantity_before: number; quantity_after: number
    delta: number; replayed: boolean; adjustments: { id: string; reason: Reason; reason_note: string | null; actor_type: string; created_at: string }[] }[]
}
```

- `/levels` paginates by `offset`; `page` is ignored (gk-pages sends both). Invalid `sort_by` silently falls back to default order.
- `search` is OR-LIKE over `sku`, `product_name`, `variant_title`; range params are inclusive and ANDed (no OR).
- `variant_title` is null on older rows; fall back to `product_name`.
- Bulk edit is absolute, not delta: per row either set-on-hand or set-quantities (`available` with `compare_quantity`), `available` wins when both changed; `reason` defaults to `correction`.
- `MutationResult` is never read; `api.ts` types it as `{ applied: number }` instead.

## v3 adjustments

Source: `modules/inventory/api/inventoryV3.api.ts`, `interfaces/inventoryV3.ts`

| Endpoint | Request | Response |
|---|---|---|
| `GET /v3/admin/inventory/adjustments` | query `inventory_item_id, location_id, reason, actor_type, page, limit` | `V3List<Adjustment>` |

```ts
interface Adjustment {
  id: string; inventory_item_id: string; location_id: string; quantity_name: QuantityName; delta: number
  quantity_before: number; quantity_after: number; reason: Reason; reason_note: string | null
  reference_type: string | null; reference_id: string | null; actor_type: string; created_at: string
}
```

- Filters were added after the contract; gk-pages re-filters by `inventory_item_id` client-side in case they are ignored. Variant history uses `limit=500`.

## v3 locations

Source: `modules/inventory/api/inventoryV3.api.ts`, `interfaces/inventoryV3.ts`, `pages/inventory/LocationsPage.tsx`

| Endpoint | Request | Response |
|---|---|---|
| `GET /v3/admin/locations` | query `page, limit` (gk-pages sends none) | `V3List<Location>` |
| `POST /v3/admin/locations` | `LocationWrite` | `Location` |
| `PATCH /v3/admin/locations/:id` | `Partial<Omit<LocationWrite, 'inventory_source' \| 'oms_provider' \| 'facility_code'>> & { active }` | `Location` |
| `POST /v3/admin/locations/:id/activate` | none | `Location` |
| `POST /v3/admin/locations/:id/deactivate` | `{ drain_to, reason_note }` or `{}` | `Location & { drain?: Drain }` |
| `POST /v3/admin/locations/:id/delete` | `{ confirm: true }` | `{ deleted_location_id, deleted_at }` |

```ts
type InventorySource = 'ratio' | 'shopify' | 'oms'
interface Location {
  id: string; merchant_id: string; name: string; address_line_1: string | null; address_line_2: string | null
  city: string | null; state: string | null; state_code: string | null; country: string | null; zip: string | null; phone: string | null
  active: boolean; fulfills_online_orders: boolean; inventory_source: InventorySource; oms_provider: string | null
  facility_code: string | null; gstin: string | null; shopify_location_id: number | null; is_default?: boolean
  created_at: string; updated_at: string
}
interface LocationWrite {
  name: string; address_line_1?: string; address_line_2?: string; city?: string; state?: string; state_code?: string
  country?: string; zip?: string; phone?: string; fulfills_online_orders?: boolean; inventory_source: InventorySource
  oms_provider?: string; facility_code?: string; gstin?: string; shopify_location_id?: number
}
interface Drain { destination_location_id: string; items_moved: number; total_units_moved: number
  buckets_moved: Record<string, number>; levels_created_at_destination: number; adjustments_recorded: number }
```

- List returns active and inactive; gk-pages filters `active === true` for dropdowns.
- New locations default to `inventory_source: 'ratio'` even for non-RATIO merchants; always send it.
- `inventory_source`, `oms_provider`, `facility_code` are immutable after create.
- Delete is a `POST` tombstone, refused (409) on the default location or while stock remains.

## v1 inventory

Source: `modules/inventory/api/inventory.api.ts`, `utils/inventory.ts`, `modules/products/api/products.api.ts`, `store/variants`

| Endpoint | Request | Response |
|---|---|---|
| `POST /v1/admin/inventory/import` | multipart `file, warehouse_id`; raw `fetch` with `credentials: 'include'` | `{ success, message, error? }?`; 400 `{ message }?` |
| `GET /v1/admin/inventory/export-csv` | query `storeId, location, variants=all_variants, export_type (excel_csv\|plain_csv), currentPageOnly?`; raw `fetch` | file blob; filename from `content-disposition`? |
| `PATCH /v1/admin/inventory/bulk-edit/multi-warehouse` | `{ items: [{ product_id, variant_id, sku_id, cost, warehouse_QT: [{ warehouse_id, available }] }] }` | ignored? |
| `GET /v1/admin/inventory/warehouse-variant-inventory/` | query `product_id, warehouse_ids (comma list), variant_id` | `VariantWarehouseQty[]` |

```ts
interface VariantWarehouseQty { warehouse_id: string; warehouse_name: string; available: number; unavailable: number; on_hand: number
  committed: number; incoming: number; damaged: number; quality_control: number; safety_stock: number; others: number }
```

- No v3 equivalent for import/export/multi-warehouse bulk edit; these stay on v1.
- Multi-warehouse body is camel/snake mixed (`warehouse_QT`); `cost` is the variant price and `available` is the raw input string from the product variants table.
- Export mixes casing in its query (`storeId`, `currentPageOnly` vs `export_type`).

## Purchase orders

Source: `modules/purchase-orders/api/purchase-orders.api.ts`, `modules/purchase-orders/interfaces/*`, `store/purchase-orders`, `components/purchase-orders/PurchaseOrderDetails.tsx`

| Endpoint | Request | Response |
|---|---|---|
| `GET /v1/admin/purchase-orders/` | query `store_id, page, limit` | `{ data: PurchaseOrder[], total, page, limit, totalPages, hasNext, hasPrevious }` |
| `POST /v1/admin/purchase-orders` | `PoWrite` (item costs as number) | `PurchaseOrder` |
| `GET /v1/admin/purchase-orders/:id` | none | `PurchaseOrder` |
| `PATCH /v1/admin/purchase-orders/:id` | `PoWrite` (item costs as string); same body for edit, close, reopen | ignored? |
| `DELETE /v1/admin/purchase-orders/:id/` | query `store_id` | ignored (success only) |
| `PATCH /v1/admin/purchase-orders/:id/receive` | header `store_id`; `{ po_id, items: [{ po_item_id, inventory_item_id?, quantity_received, quantity_rejected }] }` | ignored; then refetches `GET /:id` |
| `GET /v1/admin/purchase-orders/:id/export-pdf` | none | `{ url \| fileUrl \| downloadUrl }?`, else opens the endpoint in a new tab |

```ts
interface PoWrite {
  warehouse_id: string; supplier_id: string; store_id?: string; total_cost: number; expected_delivery: string; status: string
  payment_terms: string; supplier_currency: string; reference_number: string; note_to_supplier: string; tags: string[]
  shipping_carrier: string; tracking_number: string; tracking_url: string
  items: { po_item_id?: string; supplier_sku?: string; inventory_item_id?: string; tax?: string | number; quantity_ordered?: number
    quantity_received?: number; quantity_rejected?: number; cost_per_unit?: number | string; total_cost?: number | string
    created_at?: string; updated_at?: string }[]
}
interface PurchaseOrder {
  po_id?: string; reference_number?: string; supplier?: string | { supplier_id?: string; company_name?: string }; supplier_id?: string
  warehouse?: string | { warehouse_id?: string; name?: string }; warehouse_id?: string; destination?: string; status?: string
  received_date?: string; quantity_received?: number; quantity_ordered?: number; total_cost?: string | number; expected_delivery?: string
  payment_terms?: string; supplier_currency?: string; shipping_carrier?: string; tracking_number?: string; tracking_url?: string
  note_to_supplier?: string; tags?: string[] | string; store_id?: string; created_at?: string; updated_at?: string
  items?: { po_item_id?: string; po_id?: string; product_id?: string; variant_id?: string; title?: string
    option1_value?: string; option2_value?: string; option3_value?: string; supplier_sku?: string; inventory_item_id?: string
    quantity_ordered?: string | number; quantity_received?: string | number; quantity_rejected?: string | number
    cost_per_unit?: string | number; total_cost?: string | number; tax?: string; created_at?: string; updated_at?: string
    warehouse?: { warehouse_id?: string; name?: string }; supplier?: { supplier_id?: string; company_name?: string } }[]
}
```

- Client invents `po_item_id` for new lines (`new-<ts>-<rand>` on create, `<poId>-<productId>` on update) and falls back to `productId` for `supplier_sku`/`inventory_item_id`.
- Quantities and costs come back as strings; gk-pages `parseInt`/`parseFloat`s them.
- Search reuses the list endpoint without the `{INVENTORY}` base (relative URL) and filters client-side.

## Suppliers

Source: `modules/purchase-orders/api/purchase-orders.api.ts`, `modules/purchase-orders/interfaces/purchase-orders.response.transformer.types.ts`

| Endpoint | Request | Response |
|---|---|---|
| `GET /v1/admin/suppliers` | none | `Supplier[]?` |

```ts
interface Supplier { supplier_id?: string; company_name?: string; contact_name?: string; email?: string; phone?: string
  address?: { address1?: string; address2?: string; city?: string; province?: string; country?: string; zip?: string }
  created_at?: string; updated_at?: string }
```

## Transfers

Source: `modules/transfers/api/transfers.api.ts`, `modules/transfers/interfaces/transfers.types.ts`

| Endpoint | Request | Response |
|---|---|---|
| `GET /v1/admin/transfers` | query `store_id`; `page, limit` passed as call params? | `{ results: Transfer[], page, limit, total, totalPages?, hasNext, hasPrevious }?` |
| `POST /v1/admin/transfers` | `{ source_warehouse_id, destination_warehouse_id, status, expected_arrival_date, shipping_carrier, tracking_number, tracking_url, reference_number, tags: string[], items: [{ inventory_item_id, product_id, variant_id, sku_id, quantity_ordered }] }` | `Transfer?` |
| `GET /v1/admin/transfers/:id` | none | `{ results: [Transfer] }` or `Transfer`? |
| `PATCH /v1/admin/transfers/:id` | `Transfer & { items: TransferItem & { option1_name?, option2_name?, option3_name? } }` | `Transfer?` (falls back to the sent body) |
| `PATCH /v1/admin/stock-transfer/receive` | `{ transfer_id, items: [{ st_item_id, quantity_received, quantity_rejected }] }` | ignored; then refetches `GET /transfers/:id` |
| `DELETE /v1/admin/stock-transfers/:id` | none | ignored (success only) |

```ts
interface Transfer {
  transfer_id: string; source_warehouse_id: string; destination_warehouse_id: string; sourceWarehouse?: Warehouse; destinationWarehouse?: Warehouse
  status: string; expected_arrival_date?: string; completed_at?: string; requested_at?: string; updated_at?: string
  shipping_carrier?: string; tracking_number?: string; tracking_url?: string; reference_number?: string; note?: string; tags?: string[]
  store_id: string; items: TransferItem[]
}
interface TransferItem { st_item_id: string; transfer_id: string; inventory_item_id: string; sku_id?: string; product_id?: string; variant_id?: string
  title?: string; option1_value?: string; option2_value?: string; option3_value?: string; sku?: string
  quantity_ordered: number; quantity_received: number; quantity_rejected: number; created_at?: string; updated_at?: string }
interface Warehouse { warehouse_id: string; name: string; address?: string; city?: string; state?: string; country?: string; postal_code?: string
  is_active?: boolean; location_id?: string; store_id?: string; contact_info?: string; created_at?: string; updated_at?: string }
```

- Three path roots for one resource: `/transfers`, `/stock-transfer/receive` (singular), `/stock-transfers/:id` (delete).
- Transfer objects carry camelCase `sourceWarehouse`/`destinationWarehouse` beside snake_case fields.

## Custom fields

Source: `modules/metaFieldSettings/api.ts`, `pages/settings/MetaFieldsSettings/*`, `components/collections/collectionFormComponents/ConditionsCard.tsx`

Metafields v2: qa/sandbox only.

| Endpoint | Request | Response |
|---|---|---|
| `GET /v1/admin/metafield-definitions/resource-type/:resourceType` | none | `MetafieldDefinition[]?` |
| `GET /v1/admin/metafield-definitions/resource-types` | none | `{ data: [{ resourceType, count }] }?` |
| `GET /v1/admin/metafield-definitions/:id` | none | `MetafieldDefinition?` |
| `POST /v1/admin/metafield-definitions` | `MetafieldDefinitionWrite` | `MetafieldDefinition?` |
| `PUT /v1/admin/metafield-definitions/:id` | `MetafieldDefinitionWrite` (full body) | `MetafieldDefinition?` |
| `DELETE /v1/admin/metafield-definitions/:id` | none | ignored |
| `GET /v1/admin/metafields/category/:categoryId` | none | `MetafieldDefinition[]?` (product form) |
| `GET /v1/admin/metafields/filter-values` | query `metafield_definition_id` | `{ values: (string \| { value \| name \| label })[], count }?` |
| `GET /v1/admin/metaobject-definitions/with-counts` | none | `[{ id, name, type, metaobject_count }]?` |
| `GET /v1/admin/metaobject-definitions/:id` | none | `MetaobjectDefinition?` |
| `POST /v1/admin/metaobject-definitions` | `MetaobjectDefinitionWrite` | `MetaobjectDefinition?` |
| `PATCH /v1/admin/metaobject-definitions/:id` | `MetaobjectDefinitionWrite` (full body) | `MetaobjectDefinition?` |
| `DELETE /v1/admin/metaobject-definitions/:id` | none | ignored |
| `GET /v1/admin/metaobjects` | query `type` (definition type slug), `q, page, limit` | `Metaobject[]` without `q/page/limit`, else `{ data: Metaobject[], total, page, limit }`? |
| `GET /v1/admin/metaobjects/definition/:definitionId` | none | `Metaobject[]?` |
| `GET /v1/admin/metaobjects/:id` | none | `Metaobject?` |
| `POST /v1/admin/metaobjects` | `{ metaobject_definition_id, handle, status: 'active', fields: [{ key, value }] }` | `Metaobject?` |
| `PATCH /v1/admin/metaobjects/:id` | fetched `Metaobject` spread with new `fields: [{ key, value }]` | `Metaobject?` |
| `DELETE /v1/admin/metaobjects/:id` | none | ignored |

```ts
// inferred
interface MetafieldDefinition { id: string; namespace: string; key: string; name: string; description: string; resource_type: string
  data_type: string; validation_schema: Record<string, unknown>; is_required: boolean; pin_status: boolean | 0 | 1
  multiple_value: boolean; reference_id?: string; assignedCategories: string[] }
type MetafieldDefinitionWrite = Omit<MetafieldDefinition, 'id'> & { is_indexed: false }
interface MetaobjectDefinition { id: string; type: string; name: string; description: string; field_definitions: MetaobjectFieldDef[] }
interface MetaobjectFieldDef { name: string; key: string; description: string
  type: { name: string; multiple_value: boolean; referenceID?: string; validation: { required: boolean } & Record<string, unknown> } }
type MetaobjectDefinitionWrite = Omit<MetaobjectDefinition, 'id'>
interface Metaobject { id: string; type: string; handle: string; metaobject_definition_id: string; fields: { key: string; value?: unknown }[] }
```

- Mixed casing on the wire: `assignedCategories`, `referenceID`, `resourceType` beside snake_case.
- `pin_status` comes back as `1/0`; gk-pages caps pinned definitions client-side.
- `reference_id` is sent only for metaobject-reference definitions; `validation_schema` holds only `enum`/`uniqueItems` when "limit to choices" is on.
- Date fields are sent as ISO date (`YYYY-MM-DD`), date-time as full ISO.

## Unused

Defined in `apiEndpoints.ts` (or typed in `inventoryV3.api.ts`) but no live caller on `main`.

| Endpoint | Request | Response |
|---|---|---|
| `GET /v3/admin/inventory/items/:id` | none | `Item` (`data: null` when unknown) |
| `PATCH /v3/admin/inventory/items/:id` | `{ sku, tracked, requires_shipping, cost (number \| string), country_code_of_origin, harmonized_system_code, hsn_code }` | `Item` |
| `POST /v3/admin/inventory/items/:id/activate` | none | `Item` |
| `POST /v3/admin/inventory/items/:id/deactivate` | none | `Item` |
| `GET /v3/admin/inventory/levels/:itemId/:locationId` | none | `Level` |
| `POST /v3/admin/inventory/move-quantities` | `Mutation & { changes: [{ inventory_item_id, location_id, from, to, quantity }] }` | `MutationResult` (echoes FROM side only) |
| `POST /v3/admin/inventory/bulk-adjust` | same as adjust-quantities | `MutationResult` |
| `GET /v3/admin/locations/:id` | none | `Location` |
| `POST /v3/admin/locations/:id/mark-default` | none | `Location` (BE clears the previous default) |
| `GET /v3/admin/webhooks/subscriptions` | query `page, limit` | `V3List<WebhookSubscription>` |
| `POST /v3/admin/webhooks/subscriptions` | `{ topic, callback_url, api_version }` | `WebhookSubscription` |
| `GET /v3/admin/webhooks/subscriptions/:id` | none | `WebhookSubscription` |
| `PATCH /v3/admin/webhooks/subscriptions/:id` | `{ callback_url, active }` | `WebhookSubscription` |
| `DELETE /v3/admin/webhooks/subscriptions/:id` | none | `{ deleted: true }` |
| `GET /v1/admin/inventory/levels` | query `store_id, location_id, search, availability, incoming, committed, on_hand, …, page, limit` | replaced by v3 levels |
| `GET /v1/admin/inventory/adjustments` | query `store_id, inventory_item_id, location_id, reason, actor_type, page, limit` | replaced by v3 adjustments |
| `POST /v1/admin/inventory/adjust-quantities` | header `idempotency-key`; `{ changes }` | replaced by v3 |
| `POST /v1/admin/inventory/set-quantities` | header `idempotency-key`; `{ changes }` | replaced by v3 |
| `POST /v1/admin/inventory/bulk-adjust` | header `idempotency-key`; `{ changes }` | replaced by v3 |
| `PATCH /v1/admin/inventory/bulk-edit` | `{ warehouse_id, items }` | replaced by v3 set-on-hand / set-quantities |
| `PATCH /v1/admin/inventory/bulk-edit/multi-warehouse` (key `inventory.multiWarehouseBulkEdit`) | same as v1 row | thunk never dispatched; path still live via `quantityBulkUpdateMultiWarehouse` |
| `GET /v1/admin/inventory/search` | query `warehouse_id, search_term, …, page, limit` | replaced by v3 levels `search` |
| `GET /v1/admin/inventory/warehouse/:warehouseId` | query filters, `page, limit` | replaced by v3 levels |
| `GET /v1/admin/locations` | query `store_id, active` | replaced by v3 locations |
| `GET /v1/admin/warehouses/store/:storeId` | none | replaced by v3 locations |

```ts
type WebhookTopic = 'inventory_items/create' | 'inventory_items/update' | 'inventory_items/delete' | 'inventory_levels/connect'
  | 'inventory_levels/update' | 'inventory_levels/disconnect' | 'variants/in_stock' | 'variants/out_of_stock'
interface WebhookSubscription { id: string; merchant_id: string; topic: WebhookTopic; callback_url: string; api_version: string
  active: boolean | 0 | 1; created_at: string; updated_at: string }   // active is int on list, bool on get-one
```

- The v1 functions with these names in `inventory.api.ts` survive but the store thunks of the same name now call v3.
- Only callers of move-quantities (`MoveQuantityModal`) and the v1-wrapped connect/set-on-hand (`ConnectInventoryLevelModal`, `SetOnHandModal`) are never mounted.

# Inventory

[← Resources](../README.md) · Schema: [inventory.md](../../domain/inventory.md) · Today: `pages/inventory/InventoryHome.tsx`, `components/inventory/InventoryTable.tsx`

A list with per-cell adjust popovers (each save is immediate); no record editor. Row type: [`InventoryRow`](../../domain/inventory.md#inventory-item-and-level).

## List

```ts
list: {
  scope: { param: 'location', source: lookups.locations, required: true },   // v3, active only; changing it resets page
  columns: [
    { id: 'product',     header: 'Product',     cell: variantImageTitle },   // links to variant (product if single-variant), returnTo
    { id: 'sku',         header: 'SKU' },
    { id: 'unavailable', header: 'Unavailable', cell: UnavailableCell },     // read-only: reserved / damaged / safety stock / quality control
    { id: 'committed',   header: 'Committed' },                              // read-only
    { id: 'available',   header: 'Available',   cell: AvailableCell },       // popover: set / add / remove any bucket, with reason
    { id: 'onHand',      header: 'On hand' },                                // popover (set on hand)
    { id: 'incoming',    header: 'Incoming',    cell: IncomingCell },        // total only
  ],
  search: { param: 'search', placeholder: 'Search inventory', debounceMs: 400 },   // today: 500 ms
  filters: [ // single-select chips, each one range (InventoryHome.tsx:40-60, levelRangeFilters.ts:25-49)
    'availability', 'incoming', 'committed', 'onHand',
  ].map(singleRangeFilter),          // → available_min/max, incoming_min/max, committed_min/max, on_hand_min/max
  sort: { params: ['sort_by', 'sort_dir'], fields: ['available', 'committed', 'on_hand'] },
  views: { source: 'static', items: [
    { id: 'all', label: 'All' },
    { id: 'incoming', label: 'Incoming', params: { incoming_min: 1 } },
  ] },
  pageSize: 50,                     // today 10
  selection: { enabled: true },
  cellEdit: { cells: ['available', 'onHand'], command: 'inventory.adjust' },   // popover, immediate
  empty: { title: 'No inventory at this location' },
}
```

Search uses `GET /v3/admin/inventory/levels?search` (SKU, product name, variant title), one page; as today it does not combine with filters or views.

### Derived values

Bulk edit, as today (`BulkInventoryEditModal.tsx:36,67-74`):


- Editing **available** → `onHand = available + (onHand₀ − available₀)`
- Editing **on hand** → `available = onHand − (onHand₀ − available₀)` (negatives allowed)

### Unavailable

No move action; the popover sets or adjusts reserved / damaged / safety stock / quality control directly, with a reason. Each save is immediate.

## Commands

```ts
commands: {
  page: ['inventory.import', 'inventory.export'],   // import: file → confirm → upload, as today; header also links to Manage locations
  bulk: ['inventory.bulkEdit'],
}
```

- `inventory.adjust`: v3 `set-on-hand` / `set-quantities` / `adjust-quantities` for one level.
- `*.createFromSelection`: the transfer / PO create routes still accept `?selectedItems` prefill, but gk-pages no longer offers the action from the inventory list.

## Other

```ts
service:     'inventory',
nav:         { group: 'products', parent: 'product', position: 3 },
permissions: { read: 'read_inventory', write: 'write_inventory' },
assistant:   { description: 'Stock per SKU and location.', readableFields: ['sku', 'title', 'locationId', 'available', 'committed', 'onHand', 'incoming'] },   // InventoryRow fields
```

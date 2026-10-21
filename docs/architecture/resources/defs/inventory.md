# Inventory

[← Resources](../README.md) · Schema: [inventory.md](../../domain/inventory.md) · Today: `pages/inventory/InventoryHome.tsx`, `components/inventory/InventoryTable.tsx`

A list with per-cell adjust popovers (each save is immediate); no record editor. Row type: [`InventoryRow`](../../domain/inventory.md#inventory-item-and-level).

## List

```ts
list: {
  scope: { source: lookups.locations, required: true },   // v3, active only; changing it resets page
  columns: [
    { id: 'product',     header: 'Product',     cell: variantImageTitle },   // links to variant (product if single-variant), returnTo
    { id: 'sku',         header: 'SKU' },
    { id: 'unavailable', header: 'Unavailable', cell: UnavailableCell },     // read-only: reserved / damaged / safety stock / quality control
    { id: 'committed',   header: 'Committed' },                              // read-only
    { id: 'available',   header: 'Available',   cell: AvailableCell },       // popover: set / add / remove any bucket, with reason
    { id: 'onHand',      header: 'On hand' },                                // popover (set on hand)
    { id: 'incoming',    header: 'Incoming',    cell: IncomingCell },        // total only
  ],
  search: { placeholder: 'Search inventory', debounceMs: 500 },   // as today
  filters: [ // single-select chips, each one range (InventoryHome.tsx:40-60, levelRangeFilters.ts:25-49)
    'availability', 'incoming', 'committed', 'onHand',
  ].map(singleRangeFilter),          // one { min, max } range each
  sort: { source: 'column' },          // available, committed, onHand
  views: { source: 'static', items: [
    { id: 'all', label: 'All' },
    { id: 'incoming', label: 'Incoming', params: { filters: { incoming: { min: 1 } } } },
  ] },
  pageSize: 50,                     // today 10
  selection: { enabled: true },
  cellEdit: { cells: ['available', 'onHand'], command: 'inventory.adjust' },   // popover, immediate
  empty: { title: 'No inventory at this location' },
}
```

Search covers SKU, product name and variant title, one page; as today it does not combine with filters or views. Derived values: `bulkEditDerive` ([domain](../../domain/inventory.md#rules)).

## Commands

```ts
commands: {
  page: ['inventory.import', 'inventory.export'],   // import: file → confirm → upload, as today; header also links to Manage locations
  bulk: ['inventory.bulkEdit'],
}
```

Commands: [inventory](../../commands/defs/inventory.md#inventory).

## Other

```ts
service:     'inventory',
nav:         { group: 'products', parent: 'product', position: 3 },
permissions: { read: 'read_inventory', write: 'write_inventory' },
assistant:   { description: 'Stock per SKU and location.', readableFields: ['sku', 'title', 'locationId', 'available', 'committed', 'onHand', 'incoming'] },   // InventoryRow fields
```

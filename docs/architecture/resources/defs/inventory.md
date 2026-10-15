# Inventory

[← Resources](../README.md) · Schema: [inventory.md](../../schema/inventory.md) · Today: `pages/inventory/InventoryHome.tsx`, `components/inventory/InventoryTable.tsx`

A list with inline editing; no record editor. Row type: [`InventoryRow`](../../schema/inventory.md#inventory-row).

## List

```ts
list: {
  scope: { param: 'location', source: lookups.warehouses, required: true },   // changing it resets page
  columns: [
    { id: 'product',     header: 'Product',     cell: variantImageTitle },   // links to product
    { id: 'sku',         header: 'SKU' },
    { id: 'unavailable', header: 'Unavailable', cell: UnavailableCell },     // damaged / quality control / safety stock / other
    { id: 'committed',   header: 'Committed' },                              // read-only
    { id: 'available',   header: 'Available',   cell: AvailableCell },       // input + "move to unavailable"
    { id: 'onHand',      header: 'On hand' },                                // input
    { id: 'incoming',    header: 'Incoming',    cell: IncomingCell },        // links to POs and transfers
  ],
  search: { param: 'search_term', endpoint: 'search', placeholder: 'Search inventory', debounceMs: 400 },
  filters: [ // options as in InventoryHome.tsx:36-73; sent as arrays under the same names
    'availability', 'incoming', 'committed', 'onHand', 'productType', 'salesChannel', 'tags',
  ].map(multiEnumArrayFilter),
  views: { source: 'static', items: [
    { id: 'all', label: 'All' },
    { id: 'incoming', label: 'Incoming', params: { filter: 'incoming' } },
  ] },
  pageSize: 50,                     // today 10
  selection: { enabled: true },
  inlineEdit: {
    editable: ['available', 'onHand'],
    derive: inventoryDerive,
    save: 'inventory.bulkSet',
  },
  empty: { title: 'No inventory at this location' },
}
```

Search uses the separate search endpoint with `show_variants=true`; as today it does not combine with filters or views.

### Derived values (from `InventoryTable.tsx:168-209`)

- Editing **available** → `onHand = available + unavailable + committed`
- Editing **on hand** → `available = max(0, onHand − unavailable − committed)`

### Unavailable and move

Moving units between available and unavailable follows today's mapping (`InventoryTable.tsx:212-357`): reasons Other → other, Damaged → damaged, Quality control → qualityControl, Reserved → safetyStock. Changes join the same save bar.

## Commands

```ts
commands: {
  page: ['inventory.import', 'inventory.export'],   // import: file → confirm → upload, as today
  bulk: ['inventory.bulkEdit', 'inventory.updateQuantities', 'transfer.createFromSelection', 'purchaseOrder.createFromSelection'],
}
```

- `inventory.bulkSet`: `PATCH /inventory/bulk-edit` with changed rows (absolute values).
- `*.createFromSelection`: opens the transfer / PO create route with the selected rows as prefill (today: JSON in the URL and a full reload).

## Other

```ts
service:     'inventory',
nav:         { group: 'products', parent: 'product', position: 3 },
permissions: { read: 'inventory:read', write: 'inventory:write' },
assistant:   { description: 'Stock per SKU and location.', readableFields: ['sku', 'title', 'locationId', 'available', 'committed', 'onHand', 'incoming.total'] },   // InventoryRow fields
```

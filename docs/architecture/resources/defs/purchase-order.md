# Purchase order

[← Resources](../README.md) · Schema: [inventory.md](../../schema/inventory.md#purchase-order) · Today: `pages/purchase-orders/*`, `components/purchase-orders/PurchaseOrderDetails.tsx`

## List

```ts
list: {
  columns: [
    { id: 'number',      header: 'Purchase order' },               // reference number, link
    { id: 'supplier',    header: 'Supplier' },
    { id: 'destination', header: 'Destination' },
    { id: 'status',      header: 'Status', cell: statusBadge },
    { id: 'received',    header: 'Received', cell: receivedOfOrdered },
    { id: 'total',       header: 'Total', cell: money },
    { id: 'expected',    header: 'Expected arrival', cell: date },
  ],
  search: { param: 'query', endpoint: 'search', placeholder: 'Search purchase orders', debounceMs: 500 },
  views: { source: 'static', mode: 'client', items: ['all', 'draft', 'ordered', 'partially_received', 'received'].map(statusView) },
  pageSize: 50,
  selection: { enabled: false },          // today's bulk actions are stubs
  empty: { title: 'Create a purchase order', action: 'purchaseOrder.create' },
}
```

Status tabs filter the current page client-side today (no API param); kept until the API supports it.

## Editor

| Column | Section | Fields |
|---|---|---|
| main | Supplier and destination | supplierId, destinationLocationId, paymentTerms, supplierCurrency |
| main | Shipment | expectedAt, shipping.carrier, shipping.trackingNumber |
| main | Products | lines (child) |
| aside | Additional | referenceNumber, noteToSupplier, tags |

Save: `editor: { save: 'purchaseOrder.save', create: { route: '/purchase-orders/new', command: 'purchaseOrder.create' } }`.

Products child: columns Product, SKU, Quantity, Cost, Total. Picker searches inventory of the destination location (debounce 500 ms; destination required first); picked cost seeds the line.

### Validation (`ValidationSchemas.ts`)

Reference number, supplier and destination required; quantity ≥ 1; cost ≥ 0; ≥ 1 line.

### Derived values

- Line total = quantity × cost (`PurchaseOrderItemsCard.tsx:100-109`)
- Order total and quantity = sums (`PurchaseOrderDetails.tsx:167-171`)

## Receive (`/purchase-orders/$id/receive`)

Columns: Product, Ordered, Previously received, Accept, Reject, Remaining. Accept and reject are capped at remaining and clamp each other (`ReceiveInventory.tsx:43-100`). Command `purchaseOrder.receive` sends `{po_item_id, quantity_received, quantity_rejected}` per line.

## Commands (status-driven)

```ts
commands: {
  page: ['purchaseOrder.create'],
  primary: (po) => po.status === 'draft' ? 'purchaseOrder.markOrdered'      // confirm first
                 : po.status !== 'closed' ? 'purchaseOrder.openReceive' : undefined,
  more: (po) => ({
    draft:              ['purchaseOrder.delete'],
    ordered:            ['purchaseOrder.close'],
    partially_received: ['purchaseOrder.close'],
    received:           ['purchaseOrder.close'],
    closed:             ['purchaseOrder.reopen'],    // back to draft
  })[po.status],
}
```

Today's "Edit" toggle becomes editing in place. "Export PDF" has an endpoint but no caller; not in v1.

## Other

```ts
service:     'inventory',
relations:   { supplier: { resource: 'supplier', kind: 'one', via: 'supplierId' }, destination: { resource: 'location', kind: 'one', via: 'destinationLocationId' } },
nav:         { group: 'products', parent: 'product', position: 4 },
permissions: { read: 'inventory:read', write: 'inventory:write' },
assistant:   { description: 'Stock ordered from suppliers.', readableFields: ['referenceNumber', 'status', 'supplier.companyName', 'expectedAt', 'totalCost', 'lines.title', 'lines.quantityOrdered', 'lines.quantityReceived'] },
```

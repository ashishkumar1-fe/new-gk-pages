# Transfer

[← Resources](../README.md) · Schema: [inventory.md](../../domain/inventory.md#transfer) · Today: `pages/transfers/*`, `components/transfers/TransferDetailsForm.tsx`

## List

```ts
list: {
  columns: [
    { id: 'number',      header: 'Transfer' },
    { id: 'origin',      header: 'Origin' },
    { id: 'destination', header: 'Destination' },
    { id: 'status',      header: 'Status', cell: statusBadge },
    { id: 'received',    header: 'Received', cell: date },        // completedAt
    { id: 'expected',    header: 'Expected arrival', cell: date },
  ],
  search: { placeholder: 'Search transfers', debounceMs: 500 },   // today: search drops paging
  views: { source: 'static', mode: 'client', items: ['all', 'draft', 'pending', 'partially_received', 'received'].map(statusView) },
  pageSize: 50,
  selection: { enabled: false },          // today's bulk actions are stubs
  empty: { title: 'Create a transfer', action: 'transfer.create' },
}
```

Status tabs filter the current page client-side today; kept until the API supports it.

## Editor

| Column | Section | Fields | Notes |
|---|---|---|---|
| main | Locations | originLocationId, destinationLocationId | |
| main | Products | lines (child) | create: editable; edit: read-only, as today |
| aside | Shipping | expectedAt, shipping.carrier, shipping.trackingNumber | |
| aside | Additional | referenceNumber, note (read-only: not sent today), tags | |

Save: `editor: { save: 'transfer.update', create: { route: '/transfers/new', command: 'transfer.create' } }`.

Products child (create): columns Product, SKU, Quantity; picker searches inventory of the origin location (debounce 500 ms). Create still accepts `?selectedItems` prefill, but the inventory list no longer offers it.

Rules: `transferValidate` ([domain](../../domain/inventory.md#rules)).

## Receive (`/transfers/$id/receive`)

Same as purchase order receive (`receivePayload` differs: cumulative).

## Commands (status-driven)

```ts
commands: {
  page: ['transfer.create'],
  primary: (t) => t.status === 'draft' ? 'transfer.markPending'
                : ['pending', 'partially_received'].includes(t.status) ? 'transfer.openReceive' : undefined,
  more: (t) => t.status === 'received' ? [] : ['transfer.delete'],   // today's Duplicate is a stub; not in v1
}
```

## Other

```ts
service:     'inventory',
nav:         { group: 'products', parent: 'product', position: 5 },
permissions: { read: 'read_inventory', write: 'write_inventory' },
assistant:   { description: 'Stock moved between locations.', readableFields: ['referenceNumber', 'status', 'originLocationId', 'destinationLocationId', 'expectedAt', 'lines.title', 'lines.quantityOrdered', 'lines.quantityReceived'] },
```

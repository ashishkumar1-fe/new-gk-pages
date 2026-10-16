# Draft order

[← Resources](../README.md) · Schema: [orders.md](../../domain/orders.md#draft-order) · Today: `pages/draft-orders/DraftOrdersHome.tsx`, `components/orders/DraftOrder.tsx`

## List

```ts
list: {
  columns: [
    { id: 'number',   header: 'Draft #' },                   // "#D3"; "—" when unnumbered
    { id: 'draft',    header: 'Draft order' },               // link
    { id: 'date',     header: 'Date', cell: dateTime },
    { id: 'updated',  header: 'Updated', cell: dateTime, hidden: true },
    { id: 'customer', header: 'Customer' },
    { id: 'status',   header: 'Status', cell: draftStatusBadge },   // open blue, invoice sent yellow, completed green
    { id: 'total',    header: 'Total', cell: money },
  ],
  search: { placeholder: 'Search draft orders', debounceMs: 500 },   // as today
  views: { source: 'server', default: 'is_default' },   // /draft-orders/views
  sort:  { source: 'server', default: { field: 'createdAt', direction: 'desc' } },   // server sort options; column click sets sort
  filters: [
    { id: 'status',   type: 'enum', options: ['open', 'invoice_sent', 'completed'], toQuery: (v) => ({ status: v }) },
    { id: 'created',  type: 'date_range', toQuery: ([a, b]) => ({ createdAt: { from: a, to: b } }) },   // inclusive both ends
    { id: 'customer', type: 'text', toQuery: (v) => ({ customerId: v }) },
    { id: 'tags',     type: 'text', toQuery: (v) => ({ tags: v }) },   // comma-separated, OR
  ],
  pageSize: 50,
  selection: { enabled: true },
  empty: { title: 'Create a draft order', action: 'draftOrder.create' },
}
```

Draft filters are server-side query params, as today.

## Editor

| Column | Section | Content |
|---|---|---|
| main | Products | product picker (debounced), custom items, quantities |
| main | Payment | server totals, discounts (custom or code), complete |
| aside | Notes | ≤ 5000 chars |
| aside | Customer | select or create; read-only until products exist |
| aside | Tags | |
| aside | Custom fields | |

```ts
editor: {
  readOnlyWhen: (d) => d.status === 'completed',
  calculate: {
    query: (d) => api.osOrder.calculateDraft({ lineItems: d.lineItems, discountCode: d.discountCode }),
    debounceMs: 500,
    skipWhen: (d) => d.lineItems.length === 0,   // totals reset to 0, "Please add at least one product"
  },
  save: 'draftOrder.update',                        // POST new / PUT existing; disabled with no products or invalid quantity
}
```

- Discounts: custom (percentage or fixed, > 0, code `CUSTOM`) applied as today; code discount re-runs calculate and fails if not applied; needs products first.
- Tax shown from the server; today's 18% fallback when `total_tax` is missing is kept.
- Line price: editable per catalog line (override vs `originalPrice`); freebies not editable.
- Shipping line: today's modal has no opener, so no shipping line is sent; same in v1.

## Commands

```ts
commands: {
  page: ['draftOrder.export', 'draftOrder.create'],
  bulk: ['draftOrder.bulkTags', 'draftOrder.bulkDelete'],
  primary: (d) => d.status !== 'completed' ? 'draftOrder.complete' : undefined,   // "Place order": mark as paid / payment pending; blocked while unsaved
  more: (d) => ['draftOrder.sendInvoice', 'draftOrder.duplicate', 'draftOrder.delete'],   // delete: confirm
}
```

`draftOrder.complete`: [commands](../../commands/defs/orders.md#draftordercomplete-today); payment link watch: [machines](../../docs/machines.md#page-machines).

## Other

```ts
service:      'os-order',
relations:    { customer: { resource: 'customer', kind: 'one', via: 'customer.id' } },
nav:          { group: 'orders', parent: 'order', position: 2 },
customFields: { ownerType: 'draft_order', placement: 'aside' },
permissions:  { read: 'read_orders', write: 'write_orders' },
assistant:    { description: 'Orders created by staff before payment.', readableFields: ['name', 'status', 'customer', 'lineItems.title', 'lineItems.quantity', 'totals.total'] },
```

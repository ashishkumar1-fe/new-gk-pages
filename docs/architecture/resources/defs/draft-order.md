# Draft order

[← Resources](../README.md) · Schema: [orders.md](../../schema/orders.md#draft-order) · Today: `pages/draft-orders/DraftOrdersHome.tsx`, `components/orders/DraftOrder.tsx`

## List

```ts
list: {
  columns: [
    { id: 'draft',    header: 'Draft order' },               // link
    { id: 'date',     header: 'Date', cell: dateTime },
    { id: 'customer', header: 'Customer' },
    { id: 'status',   header: 'Status', cell: draftStatusBadge },   // open blue, invoice sent yellow, completed green
    { id: 'total',    header: 'Total', cell: money },
  ],
  search: { param: 'search', placeholder: 'Search draft orders', debounceMs: 400 },   // today: no debounce
  views: { source: 'server', default: 'is_default' },   // /draft-orders/views
  sort:  { source: 'server', default: { field: 'created_at', direction: 'desc' } },   // /draft-orders/sortby
  pageSize: 50,
  selection: { enabled: true },
  empty: { title: 'Create a draft order', action: 'draftOrder.create' },
}
```

Today's draft filters run on the current page only; v1 declares them with `mode: 'client'` until the API supports them.

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
    query: (d) => draftOrdersApi.calculate({ line_items: d.lineItems, discount_code: d.discountCode }),
    debounceMs: 500,
    skipWhen: (d) => d.lineItems.length === 0,   // totals reset to 0, "Please add at least one product"
  },
  save: 'draftOrder.save',                        // POST new / PUT existing; disabled with no products or invalid quantity
}
```

- Discounts: custom (percentage or fixed, > 0, code `CUSTOM`) applied as today; code discount re-runs calculate and fails if not applied; needs products first.
- Tax shown from the server; today's 18% fallback when `total_tax` is missing is kept.
- Shipping line: today's modal has no opener, so no shipping line is sent; same in v1.

### Validation

| Rule | Source |
|---|---|
| Custom item: name required, price > 0, quantity required | `DraftOrder.tsx:763-788` |
| Quantity ≤ 1,000,000 | `ProductSection.tsx:813` |
| New customer: names, email, phone 10–15 digits, address1, city, state, PIN 6 digits | `CreateCustomerModal.tsx:73-126` |
| Addresses: letters-only names and city, PIN 6 digits, phone 10 digits | `EditShippingAddressModal.tsx:113-164` |

## Commands

```ts
commands: {
  page: ['draftOrder.export', 'draftOrder.create'],
  bulk: ['draftOrder.bulkTags'],
  primary: (d) => d.status !== 'completed' ? 'draftOrder.complete' : undefined,   // "Mark as paid"
  more: () => ['draftOrder.delete'],               // confirm
}
```

`draftOrder.complete` keeps today's sequence: customer required if a discount is applied → calculate → create paid order → redeem discount (failure is a warning) → mark draft completed → open the new order.

## Other

```ts
service:      'os-order',
relations:    { customer: { resource: 'customer', kind: 'one', via: 'customer.id' } },
nav:          { group: 'orders', parent: 'order', position: 2 },
customFields: { ownerType: 'draft_order', placement: 'aside' },
permissions:  { read: 'orders:read', write: 'orders:write' },
assistant:    { description: 'Orders created by staff before payment.', readableFields: ['name', 'status', 'customer', 'lineItems.title', 'lineItems.quantity', 'totals.total'] },
```

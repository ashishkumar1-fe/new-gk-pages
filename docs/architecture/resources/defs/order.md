# Order

[← Resources](../README.md) · Schema: [orders.md](../../schema/orders.md) · Today: `pages/orders/OrdersHome.tsx`, `components/orders/OrderDetails.tsx`, `EditOrder.tsx`, `components/refunds/RefundDrawer.tsx`

Not yet in the Ratio design; definition follows today's behaviour.

## List

```ts
list: {
  columns: [
    { id: 'order',       header: 'Order',              cell: (o) => o.externalName ?? o.name },   // link
    { id: 'date',        header: 'Date',               cell: dateTime },        // "14 October at 3:20 pm"
    { id: 'customer',    header: 'Customer',           cell: CustomerPopover }, // email, phone, address, "View customer"
    { id: 'total',       header: 'Total',              cell: money },
    { id: 'payment',     header: 'Payment status',     cell: financialBadge },
    { id: 'status',      header: 'Order status',       cell: orderStatusBadges },   // from cancelledAt and closedAt: both can show
    { id: 'fulfillment', header: 'Fulfillment status', cell: fulfillmentBadge },
    { id: 'items',       header: 'Items' },
  ],
  search: {
    param: 'search', placeholder: 'Search orders, customers, or products', debounceMs: 400,
    minLength: (q) => q.length >= 2 || /^#?\d+$/.test(q),
  },
  filters: [
    { id: 'payment',     type: 'enum', options: ['paid', 'partially_paid', 'pending', 'refunded', 'voided'], toParams: (v) => ({ financial_status: v }) },
    { id: 'fulfillment', type: 'enum', options: ['unfulfilled', 'pending', 'fulfilled', 'partially_fulfilled'], toParams: (v) => ({ fulfillment_status: v }) },
    { id: 'created',     type: 'date_range',   toParams: ([a, b]) => ({ created_at_min: startOfDayIso(a), created_at_max: endOfDayIso(b) }) },
    { id: 'total',       type: 'money_range',  toParams: ([a, b]) => ({ order_total_min: a * 100, order_total_max: b * 100 }) },
    { id: 'items',       type: 'number_range', toParams: ([a, b]) => ({ item_count_min: a, item_count_max: b }) },
    { id: 'discount',    type: 'text',         toParams: (v) => ({ discount_code: v }) },
    { id: 'tagged',      type: 'text',         toParams: (v) => ({ tag_contains: v }) },
    { id: 'notTagged',   type: 'text',         toParams: (v) => ({ tag_not_contains: v }) },
  ],
  views: { source: 'server', default: 'is_default' },     // GET /orders/views
  sort:  { source: 'server', default: { field: 'created_at', direction: 'desc' } },   // GET /orders/sortby
  pageSize: 50,
  selection: { enabled: true, max: 100 },
  empty: { title: 'No orders yet' },
}
```

Scoped list: `customer_id` (from customer page "View all orders").

## Detail (read view)

| Column | Section | Content |
|---|---|---|
| main | Items | line items; removed items (current quantity 0) listed separately |
| main | Payment | server totals (`current_*` values) |
| main | Info tabs | Payment, Checkout, UTM, Refunds (`GET /orders/:id/refunds`) |
| main | Custom fields | read-only |
| main | Timeline | events + internal comments (`order.comment`) |
| aside | Customer | contact and addresses; editable unless fulfilled (`order.updateContact`) |
| aside | Note | ≤ 1000 chars, not empty; shows cancel reason (`order.updateNote`) |
| aside | Tags | per-order tags (entities), create new tag; ≤ 50 chars (`order.addTags`, `order.removeTag`) |

```ts
detail: {
  pager: (o) => o.neighbors,               // previous / next from the detail response; J/K keys
  editRoute: (o) => o.status === 'cancelled' ? undefined : `/orders/${o.id}/edit`,   // Shopify-sourced: blocked with a message
}
```

## Edit order (`/orders/$id/edit`)

Editor with server calculation:

- `calculate`: `POST /orders/:id/calculate`, debounced, skipped with no line items.
- Summary: updated total; paid = total − outstanding; "Refund owed" or "Amount to collect" by the sign of outstanding.
- `editor: { save: 'order.edit', calculate: { query: ordersApi.calculate, debounceMs: 500 } }` on this route.
- Save enabled when changed, not calculating and quantities valid. Sends `PATCH /orders/:id` as today (removed items merged, calculated prices, billing = shipping when "same as shipping").

## Commands

```ts
commands: {
  page: ['order.export', 'order.import', 'draftOrder.create'],          // "Create order" opens a new draft
  bulk: ['order.bulkCancel', 'order.bulkTags', 'order.archive', 'order.unarchive'],   // unarchive only if all selected are archived
  more: (o) => ['order.openStatusPage', 'order.duplicate', o.closedAt ? 'order.unarchive' : 'order.archive', 'order.cancel'],
  primary: (o) => canRefund(o) ? 'refund.create' : undefined,
}
```

- `order.cancel`: reasons (6 fixed), staff note, restock (default on), notify (always on, as today), auto-refund when amount > 0, not COD and not already refunded.
- `refund.create`: hidden if cancelled; blocked for COD, refunded, partially refunded and refund pending. Flow: select items → preview (note, restock, include shipping) → confirm with idempotency key → poll status (machine).
- `order.duplicate`: builds a draft from the order and opens it.
- Export and import: bulk-ops jobs ([commands](../../commands/defs/bulk-ops.md)); the export file is emailed.
- Archive / unarchive responses `ALREADY_ARCHIVED` / `ALREADY_OPEN` are warnings, not errors.

## Other

```ts
relations:    { customer: { resource: 'customer', kind: 'one', via: 'customer.id' } },
search:       { enabled: true, limit: 4 },
service:      'os-order',
nav:          { group: 'orders', position: 1, badge: { params: {}, cap: 10000 } },   // total orders, shown as "10,000+" above the cap (design)
customFields: { ownerType: 'order', placement: 'main', readOnly: true },
permissions:  { read: 'orders:read', write: 'orders:write' },
assistant: {
  description: 'Customer orders with payment and fulfillment status.',
  readableFields: ['name', 'createdAt', 'financialStatus', 'fulfillmentStatus', 'status', 'totals.total', 'customer.firstName', 'customer.lastName', 'lineItems.title', 'lineItems.quantity', 'tags', 'payment.method'],
},
```

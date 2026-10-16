# Order

[← Resources](../README.md) · Schema: [orders.md](../../domain/orders.md) · Today: `pages/orders/OrdersHome.tsx`, `components/orders/OrderDetails.tsx`, `EditOrder.tsx`, `hooks/useOrderEditSession.ts`, `components/orders/FulfillmentCards.tsx`, `components/refunds/RefundDrawer.tsx`

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
    { id: 'fulfillment', header: 'Fulfillment status', cell: fulfillmentBadge },   // + "Held · N" when activeHoldsCount > 0
    { id: 'items',       header: 'Items' },
    { id: 'createdAt',   header: 'Created At',         cell: date, hidden: true },
    { id: 'updatedAt',   header: 'Updated At',         cell: date, hidden: true },
  ],
  search: {
    placeholder: 'Search orders, customers, or products', debounceMs: 400,
    minLength: (q) => q.length >= 2 || /^#?\d+$/.test(q),
  },
  filters: [
    { id: 'payment',     type: 'enum', options: ['paid', 'partially_paid', 'pending', 'refunded', 'voided'], toQuery: (v) => ({ financialStatus: v }) },
    { id: 'fulfillment', type: 'enum', options: ['unfulfilled', 'pending', 'fulfilled', 'partially_fulfilled'], toQuery: (v) => ({ fulfillmentStatus: v }) },
    { id: 'created',     type: 'date_range',   toQuery: ([a, b]) => ({ createdAt: { from: a, to: b } }) },
    { id: 'total',       type: 'money_range',  toQuery: ([a, b]) => ({ total: { min: a, max: b } }) },
    { id: 'items',       type: 'number_range', toQuery: ([a, b]) => ({ itemCount: { min: a, max: b } }) },
    { id: 'discount',    type: 'text',         toQuery: (v) => ({ discountCode: v }) },
    { id: 'tagged',      type: 'text',         toQuery: (v) => ({ tagged: v }) },
    { id: 'notTagged',   type: 'text',         toQuery: (v) => ({ notTagged: v }) },
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
| main | Fulfillment | unfulfilled / fulfilled cards per location, tracking, holds (`GET /orders/:id/fulfillments`); fulfil, hold, release and tracking on the card (`order.fulfill`, `order.hold`, `order.releaseHold`, `order.updateTracking`) |
| main | Payment | server totals (`current_*` values) |
| main | Info tabs | Payment, Checkout, UTM, Refunds (`GET /orders/:id/refunds`) |
| main | Custom fields | read-only |
| main | Timeline | events + internal comments (`order.comment`) |
| aside | Customer | contact and shipping address; editable unless fulfilled; billing address read-only (`order.updateContact`) |
| aside | Note | ≤ 1000 chars, not empty; shows cancel reason (`order.updateNote`) |
| aside | Tags | per-order tags (entities), create new tag; ≤ 50 chars (`order.addTags`, `order.removeTag`) |

```ts
detail: {
  pager: (o) => o.neighbors,               // previous / next from the detail response; J/K keys
  editRoute: (o) => `/orders/${o.id}/edit`,   // Edit stays visible, disabled with editBlockReason; isShopifySourced → "Unable to edit order" modal
}
```

## Edit order (`/orders/$id/edit`)

Runs the order edit session machine ([machines](../../docs/machines.md#v1-machines)); line rules `canIncreaseQuantities`, `editAmountLabel`, `paid` ([domain](../../domain/orders.md#rules)); saved by `order.update` ([commands](../../commands/defs/orders.md#order)).

## Commands

```ts
commands: {
  page: ['order.export', 'order.import', 'draftOrder.create'],          // "Create order" opens a new draft
  bulk: ['order.bulkCancel', 'order.bulkTags', 'order.archive', 'order.unarchive', 'order.bulkFulfill'],   // unarchive only if all selected are archived; bulkCancel only if all are cancellable
  more: (o) => ['order.openStatusPage', 'order.duplicate', o.closedAt ? 'order.unarchive' : 'order.archive', 'refund.create', 'order.cancel'],   // visibility from domain rules
  row:  ['order.fulfill', 'order.hold', 'order.releaseHold', 'order.updateTracking'],   // on the Fulfillment card
}
```

Visibility and enablement come from the [order rules](../../domain/orders.md#rules): `canCancel`, `refundBlockReason`, `statusUrl` for the status page, `fulfillmentView` for fulfil / hold, active holds for release, `shouldOfferBulkFulfil` for bulk fulfil.

## Other

```ts
relations:    { customer: { resource: 'customer', kind: 'one', via: 'customer.id' } },
search:       { enabled: true, limit: 4 },
service:      'os-order',
nav:          { group: 'orders', position: 1, badge: { params: {}, cap: 10000 } },   // total orders, shown as "10,000+" above the cap (design)
customFields: { ownerType: 'order', placement: 'main', readOnly: true },
permissions:  { read: 'read_orders', write: 'write_orders' },
assistant: {
  description: 'Customer orders with payment and fulfillment status.',
  readableFields: ['name', 'createdAt', 'financialStatus', 'fulfillmentStatus', 'status', 'totals.total', 'customer.firstName', 'customer.lastName', 'lineItems.title', 'lineItems.quantity', 'tags', 'payment.method'],
},
```

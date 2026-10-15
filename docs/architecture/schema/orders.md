# Orders

[← Schema](README.md)

Service: os-order (`/api/v1/admin/orders`, `/draft-orders`, `/refunds`) and timeline service. Money in paise. Totals, tax and discounts are calculated exactly as today (server `/calculate`); the schema mirrors, it doesn't redefine.

## Order

```ts
type OrderStatus = 'open' | 'archived' | 'cancelled';

type FinancialStatus =
  | 'pending' | 'partially_paid' | 'paid'
  | 'refund_pending' | 'partially_refunded' | 'refunded' | 'voided';

type FulfillmentStatus =
  | 'unfulfilled' | 'pending' | 'partially_fulfilled' | 'fulfilled' | 'shipped' | 'delivered';

interface Order extends Entity {
  name: string;                      // "#1042"
  number: number;
  externalId?: string;               // external_order_id (e.g. Shopify)
  externalName?: string;             // external_order_name; shown in lists when present
  status: OrderStatus;               // derived: cancelled_at → cancelled, closed_at → archived
  // badges use cancelledAt and closedAt directly: an order can be cancelled and archived
  financialStatus: FinancialStatus;
  fulfillmentStatus: FulfillmentStatus;
  customer?: { id: Id; firstName?: string; lastName?: string; email?: string; phone?: string };
  email?: string;
  phone?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  lineItems: LineItem[];
  shippingLines: { title: string; price: Money }[];
  otherCharges: { type: string; label: string; amount: Money }[];
  discountCodes: { code: string; amount: Money; type: string }[];
  discountApplications: DiscountApplication[];
  taxLines: TaxLine[];
  totals: OrderTotals;
  payment: Payment;
  tags: Tag[];
  note?: string;
  noteAttributes: { name: string; value: string }[];
  sourceName?: string;               // "web", "Draft Order"
  isTest: boolean;
  cancelledAt?: DateTime;
  cancelReason?: 'customer' | 'declined' | 'fraud' | 'inventory' | 'staff' | 'other';
  // API sends display strings: "Customer changed or canceled order", "Payment declined",
  // "Fraudulent order", "Items unavailable", "Staff error", "Other"
  closedAt?: DateTime;
  statusUrl?: string;
  customFields: FieldValue[];
}

interface Tag { id: Id; name: string }   // order tags are entities with IDs

// Detail response only: neighbouring orders for previous / next navigation
interface OrderDetail extends Order {
  neighbors: { previous?: Id; next?: Id };   // data.pagination
}
```

## Line item

```ts
interface LineItem {
  id: Id;
  productId?: Id;
  variantId?: Id;
  title: string;                     // snapshot
  variantTitle?: string;
  sku?: string;
  vendor?: string;
  quantity: number;
  currentQuantity: number;           // after edits/removals
  unitPrice: Money;                  // snapshot
  discountAllocations: { amount: Money; discountIndex: number }[];
  requiresShipping: boolean;
  taxable: boolean;
  isFreebie: boolean;
  image?: Image;
}
```

## Totals

```ts
interface OrderTotals {
  lineItems: Money;                  // total_line_items_price
  subtotal: Money;
  discounts: Money;
  shipping: Money;
  tax: Money;
  total: Money;
  outstanding: Money;
  // current_* values after edits/refunds replace these when present
}
```

## Payment

```ts
interface Payment {
  method: 'cod' | 'prepaid';
  gateways: string[];                // payment_gateway_names
  amount?: Money;
  paymentId?: string;
  gatewayTransactionId?: string;     // pgPaymentTrnxId
  instrument?: string;               // UPI, card…
}
```

COD orders can't be refunded through the payment gateway.

## Refund

```ts
interface Refund extends Entity {
  orderId: Id;
  status: 'pending' | 'processing' | 'success' | 'failed';
  trigger: 'cancellation' | 'merchant_initiated';
  restock: 'cancel' | 'no_restock';
  lines: { lineItemId: Id; quantity: number; restocked: boolean;
           tax: TaxLine[]; discount: Money }[];
  amounts: { subtotal: Money; tax: Money; discount: Money; shipping: Money; total: Money };
  reason?: string;
  note?: string;
  processedAt?: DateTime;
}
```

Flow: `refunds/calculate` (returns `totalPaid`, `totalRefundable`, `previouslyRefunded`) → `POST /refunds` with an idempotency key → poll status. A machine, not a form.

## Draft order

Same core shape as an order (customer, addresses, line items, shipping line, applied discount, tags, note, custom fields) with:

```ts
status: 'open' | 'invoice_sent' | 'completed';
discountCode?: string;                 // code entered; sent to calculate
appliedDiscount?: DiscountApplication; // from calculate, or a custom discount
lineItems: (LineItem & { custom?: boolean; appliedDiscount?: DiscountApplication })[];
```

- Totals come from `POST /draft-orders/calculate`, which also returns `availableCoupons`.
- Completing is two calls, as today: create the order, then mark the draft completed. The new UI keeps the same calls in the same order, wrapped in one `draftOrder.complete` command.

## Cancel

```ts
interface CancelOrderInput {
  reason: NonNullable<Order['cancelReason']>;
  staffNote?: string;
  restock: boolean;          // default true
  notify: boolean;           // always true, as today
  autoRefund: boolean;       // only when amount > 0, not COD, not refunded / refund pending
}
```

Bulk archive and unarchive take an idempotency key; cancel does not.

## Timeline

```ts
interface TimelineEvent {
  id: Id;
  subject: { type: string; id: Id };    // entity_type, entity_id
  type: string;                         // ORDER_CREATE, FULFILMENT_MARKED, COMMENT…
  message: string;
  data: Record<string, unknown>;
  createdAt: DateTime;                  // from time_line_epoch
}
```

Comments: `POST /orders/{id}/comments { message, visibility: 'internal' }`.

## Not in v1

Fulfillment creation, tracking, returns and exchanges: not in today's gk-pages or backend. The order shows `fulfillmentStatus` as returned.

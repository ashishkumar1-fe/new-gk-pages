# Orders

[← Domain](README.md) · Wire: [gateway › os-order](../gateway/os-order.md)

Totals, tax and discounts come from the server (draft `calculate`, edit-session `preview`); the domain mirrors them, never recalculates, except the display tax fallback ([`displayTax`](pricing-tax.md#rules)).

## Order

```ts
type OrderStatus = 'open' | 'archived' | 'cancelled';      // orderStatus() below
type FinancialStatus =
  | 'pending' | 'partially_paid' | 'paid'
  | 'refund_pending' | 'partially_refunded' | 'refunded' | 'voided';
type FulfillmentStatus =                                    // wire also sends 'partial', 'partially fulfilled', null
  | 'unfulfilled' | 'partially_fulfilled' | 'fulfilled' | 'shipped' | 'delivered';
type CancelReason = 'customer' | 'declined' | 'fraud' | 'inventory' | 'staff' | 'other';   // wire: display strings, mapped in the transformer

interface Order extends Entity {
  name: string;                      // "#1042"
  number?: number;                   // order_number
  externalId?: string;               // external_order_id (e.g. Shopify)
  externalName?: string;             // shown in lists when present
  externalNumber?: string;
  status: OrderStatus;
  financialStatus: FinancialStatus;
  fulfillmentStatus: FulfillmentStatus;
  customer?: { id: Id; firstName?: string; lastName?: string; email?: string; phone?: string };
  email?: string;
  phone?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  lineItems: LineItem[];
  shippingLines: { title: string; isRemoved: boolean }[];
  otherCharges: { type: string; label: string; amount: Money }[];
  discountCodes: { code: string; amount: Money; type: string }[];
  discountApplications: DiscountApplication[];
  taxLines: TaxLine[];
  totals: OrderTotals;
  payment: Payment;
  tags: string[];                    // names on the order; tag entities (with ids) come from the tags endpoint
  note?: string;
  noteAttributes: { name: string; value: unknown }[];
  sourceName?: string;               // 'draft_order', 'shopify', …
  sourceIdentifier?: string;         // e.g. the draft id
  activeHoldsCount?: number;         // list only
  cancelledAt?: DateTime;
  cancelReason?: CancelReason;
  cancelReasonText?: string;         // staff note, shown in the Note card
  closedAt?: DateTime;
  statusUrl?: string;                // gk_order_status_url ?? order_status_url
  customFields: FieldValue[];
}

interface OrderDetail extends Order {
  neighbors: { previous?: Id; next?: Id };   // previous / next navigation
}

interface LineItem {
  id: Id;
  productId?: Id;
  variantId?: Id;
  handle?: string;
  title: string;                     // snapshot
  variantTitle?: string;
  sku?: string;
  vendor?: string;
  quantity: number;
  originalQuantity?: number;
  currentQuantity: number;           // after edits/removals; falls back to quantity
  fulfillableQuantity: number;       // falls back to currentQuantity
  unitPrice: Money;                  // snapshot
  discountAllocations: { amount: Money }[];
  requiresShipping: boolean;
  taxable: boolean;
  image?: Image;
}

interface OrderTotals {              // current_* values win when present
  lineItems: Money;
  subtotal: Money;
  discounts: Money;
  tax: Money;
  total: Money;                      // current_total_price ?? total_price
  outstanding: Money;                // signed: < 0 means refund owed
}

interface Payment {
  method: string;                    // free text from the wire; COD via isCod()
  gateways: string[];
  amount?: Money;
  paymentId?: string;
  gatewayTransactionId?: string;
  instrument?: string;               // UPI, card…
}
```

## Refund

```ts
interface Refund extends Entity {
  orderId: Id;
  returnId?: Id;
  status: 'pending' | 'processing' | 'success' | 'failed';
  trigger: 'cancellation' | 'merchant_initiated' | 'edit_triggered' | 'return';
  restock: 'cancel' | 'no_restock';
  lines: { lineItemId: Id; quantity: number; unitPrice: Money; tax: Money; discount: Money; total: Money; restocked: boolean }[];
  amounts: { subtotal: Money; tax: Money; discount: Money; shipping: Money; total: Money };
  reason?: string;
  note?: string;
  processedAt?: DateTime;
}

interface RefundCalculation {
  lines: Refund['lines'];
  amounts: Refund['amounts'];
  totalPaid: Money;
  totalRefundable: Money;
  previouslyRefunded: Money;
}
```

## Order edit

```ts
type EditOp =
  | { op: 'set_qty'; lineItemId: Id; quantity: number }               // absolute
  | { op: 'remove_line'; lineItemId: Id }
  | { op: 'apply_line_item_discount'; lineItemId: Id; discount: { kind: 'fixed'; amount: Money } | { kind: 'percent'; percent: number }; description?: string };

interface EditPreview {
  newTotal: Money;
  refundAmount: Money;               // signed: > 0 owed to the customer, < 0 to collect
  lines: { lineItemId: Id; quantityDelta: number }[];
}
```

## Draft order

Same core as an order (customer, addresses, line items, tags, note, custom fields), plus:

```ts
interface DraftOrder extends Entity {
  status: 'open' | 'invoice_sent' | 'completed';
  number?: number;                   // shown "#D3"
  invoiceUrl?: string;               // live payment link; cleared when the draft is edited
  invoiceSentAt?: DateTime;
  orderId?: Id;                      // orderId ?? osOrderId, set on completion
  completedAt?: DateTime;
  financialIntent?: 'mark_as_paid' | 'payment_pending' | 'invoice';
  discountCodes: { code: string; type: string; amount: Money; discountId?: Id }[];
  appliedDiscount?: DiscountApplication;
  shippingLine?: { title: string; price: Money };
  lineItems: (LineItem & { custom?: boolean; originalPrice?: Money; priceOverridden?: boolean; appliedDiscount?: DiscountApplication })[];
  totals: { subtotal: Money; discounts: Money; tax: Money; total: Money; outstanding: Money };   // from calculate
  createdBy?: string;
}
```

## Fulfillment

```ts
interface Fulfillment {
  id: Id;
  name?: string;
  status?: string;
  carrierCode?: string;
  tracking: { number: string; url?: string; company?: string; shipmentStatus?: string }[];
  lineItems: { lineItemId: Id; quantity: number; locationId?: Id }[];
  notifyCustomer: boolean;
  createdAt: DateTime;
}

interface FulfillmentHold {
  id: Id;
  isActive: boolean;
  reason: HoldReason;
  reasonNotes?: string;
  scope: 'order' | 'line_items';
  lineItems?: { lineItemId: Id; quantity: number }[];
  blockers: { id: Id; reason: HoldReason; reasonNotes?: string; isActive: boolean }[];
  createdAt: DateTime;
}

type HoldReason =
  | 'AWAITING_PAYMENT' | 'HIGH_RISK_OF_FRAUD' | 'INCORRECT_ADDRESS' | 'INVENTORY_OUT_OF_STOCK'
  | 'UNKNOWN_DELIVERY_DATE' | 'ONLINE_STORE_POST_PURCHASE_CROSS_SELL' | 'AWAITING_RETURN_ITEMS' | 'OTHER';
```

## Timeline

```ts
interface TimelineEvent {
  id: Id;
  subject: { type: 'ORDER' | 'PRODUCT' | 'COLLECTION' | 'CUSTOMER'; id: Id };
  type: string;                      // ORDER_CREATE, EDIT_COMMITTED, COMMENT…
  message: string;
  data: Record<string, unknown>;
  createdAt: DateTime;
}
```

## Rules

As today; strings quoted are the user-facing messages. Source paths are in gk-pages `src/`.

| Rule | What | gk-pages source |
|---|---|---|
| `orderStatus` | `cancelledAt` or `cancelReason` → cancelled; `closedAt` → archived; else wire status, default open. Cancelled and archived badges show independently | `modules/order/transformer.ts:108` |
| `normaliseFulfillment` | `partial` / `partially fulfilled` → `partially_fulfilled`; null → `unfulfilled` | `modules/order/fulfilmentStatus.ts` |
| `isCod` | payment method, lowercased, includes `cod` | `components/orders/OrderDetails.tsx:537` |
| `anyFulfilled` | fulfilled, partially fulfilled, shipped or delivered | `OrderDetails.tsx:525` |
| `canCancel` / `canBulkCancel` | not cancelled and not `anyFulfilled` (bulk: every selected order) | `OrderDetails.tsx:714`, `ui/Headers/OrdersHeader.tsx:293` |
| `autoRefundEligible` | total > 0, not COD, not refunded / partially refunded / refund pending | `orders/CancelOrderModal.tsx:46` |
| `refundBlockReason` | COD → "COD orders cannot be refunded — no payment was captured."; refunded → "This order has already been fully refunded."; partially refunded → "This order has already been partially refunded."; refund pending → "A refund for this order is already pending. Wait for it to settle before issuing another." Refund hidden when cancelled | `OrderDetails.tsx:546` |
| `editBlockReason` | cancelled → "Cancelled orders cannot be edited."; fulfilled → "Fulfilled orders cannot be edited."; `hasEditBlockingDiscount` → "Orders with a discount applied cannot be edited." | `OrderDetails.tsx:563`, `modules/order/constants.ts:173` |
| `hasEditBlockingDiscount` | any discount code, or any application not written by an edit session or manual | `modules/order/constants.ts:145` |
| `isShopifySourced` | source is `shopify` → "This order cannot be edited by this app." | `OrderDetails.tsx:145` |
| `canIncreaseQuantities` | COD, not paid / partially paid, unfulfilled | `modules/order/orderEditHelpers.ts:155` |
| `hasCommittedLineDiscount` | any allocation > 0 → no new line discount | `orderEditHelpers.ts:183` |
| `editAmountLabel` | preview refund > 0 "Refund owed", < 0 "Additional collection required", 0 "No amount due" | `orders/EditOrder.tsx:1250` |
| `paid` | total − outstanding; outstanding < 0 → "Refund owed", > 0 → "Amount to collect" | `orders/PaymentSection.tsx:1522` |
| `removedLines` | currentQuantity 0 and originalQuantity > 0 | `OrderDetails.tsx:155` |
| `lineGroups` | unfulfilled = fulfillable; fulfilled = quantity − fulfillable; removed band | `modules/order/lineItemGroups.ts:24` |
| `rowPricing` | discounted unit = unit − allocations ÷ current quantity | `lineItemGroups.ts:80` |
| `fulfillmentView` | merge held and fulfillable lines; an order hold covers all; can fulfill / hold = open and unheld remaining > 0 | `modules/fulfillment/transformer.ts:86` |
| `summarizeRefunds` | success → refunded; pending / processing → in progress; failed → neither | `modules/refunds/utils.ts:24` |
| `hasLiveInvoice` | `invoiceUrl` set (status alone isn't enough) | `modules/draft-order/` |
| `draftValidation` | custom item: name, price > 0, quantity; quantity ≤ 1,000,000; new customer: names, email, phone 10–15 digits, address1, city, state, PIN 6 digits; address: letters-only names and city, PIN 6, phone 10 | `components/orders/DraftOrder.tsx:1127`, `ProductSection.tsx:1003`, `CreateCustomerModal.tsx:73`, `EditShippingAddressModal.tsx:113` |
| `shouldOfferBulkFulfil` | some selected rows off-page, or any visible row not cancelled and not fully fulfilled | `modules/fulfillment/transformer.ts:437` |

## Not in v1

Returns and exchanges ([gateway](../gateway/os-order.md)).

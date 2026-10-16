# os-order

[← Gateway](README.md)

Base `{ORDER}` (`REACT_APP_ORDER_BASE_URL`); paths relative to `/api/v1/admin`. Case: orders, fulfilment, edit session, refund requests snake_case; drafts, refund responses, tag bodies, settings camelCase. Money: paise everywhere (decimal strings like `"600000.00"` on orders and drafts, numbers in refunds and edit preview) except `shippingLine.price` and commit `refund_amount` (rupees). List envelope: `{ orders | draft_orders: T[], pagination: { total, pages, current_page, limit } }`.

- `{ORDER}` already ends in `/api`, so real URLs are `…/api/api/v1/admin/…`. Do not collapse: the single-`/api` path lands on dashboard-backend and 404s.
- Staff attribution: `staff_id`, `staff_name` in the body on order writes (cancel, PATCH, bulk, tags, holds, refunds). `gk-user-*` headers are not sent (CORS preflight).
- Errors: `{ code, message, … }`, `message` may be `string[]` (Nest 400). Fulfilment also reads `error_code`, or `error` when it looks like a code.

## Orders

Source: `modules/order/api.ts`, `modules/order/type.ts`, `modules/order/transformer.ts`, `modules/settings/api.ts`

| Endpoint | Request | Response |
|---|---|---|
| `GET /orders` | query `page, limit, sort_field, sort_direction, search, status, financial_status, fulfillment_status, created_at_min, created_at_max, order_total_min, order_total_max` (paise)`, item_count_min, item_count_max, discount_code, tag_contains, tag_not_contains` | `{ orders: Order[], pagination }` |
| `GET /orders/:orderId` | — | `{ order: Order, metafields?: [], pagination: { next: string \| null, previous: string \| null } }` |
| `PATCH /orders/:orderId` | `{ id, source_name, note_attributes: [{ name: 'reason_for_edit', value }], metafields, customer: { id, email, first_name, last_name, phone, tags, currency } \| null, email, phone, shipping_address, billing_address, note?, tags?, line_items? }` | `Order` ? |
| `PATCH /orders/:orderId/cancel` | `{ cancel_reason, staff_note, restock_inventory, send_notification, auto_refund? }` | `Order` ? |
| `PATCH /orders/:orderId/note` | `{ note }` | ? |
| `POST /orders/bulk-cancel` | `{ order_ids, cancel_reason, staff_note, restock_inventory, send_notification }` | ? |
| `POST /orders/bulk-archive` | `{ orderIds, idempotencyKey }` | ? |
| `POST /orders/bulk-unarchive` | `{ orderIds, idempotencyKey }` | ? |
| `GET /orders/sortby` | — | `{ key, name, description }[]` |
| `GET /orders/views` | — | `{ views: { name, query: string \| string[] }[] }` or bare array |
| `GET /orders/prefix-suffix` | — | `{ data: OrderSettings }` |
| `PUT /orders/prefix-suffix` | `OrderSettings` | ? |
| `GET /orders/prefix-suffix/cancellation-settings` | — | `{ data: CancellationSettings }` |
| `PUT /orders/prefix-suffix/cancellation-settings` | `CancellationSettings` | ? |

```ts
interface Order {
  id: string;
  name: string;                       // "#1001"
  order_number?: string | number;     // ?
  financial_status: string;           // 'paid' | 'partially_paid' | 'pending' | 'refunded' | 'voided' | 'partially_refunded' | 'refund_pending'
  fulfillment_status: string;         // 'fulfilled' | 'partial' | 'shipped' | 'delivered' | null…
  active_holds_count?: number;        // list endpoint only
  status?: string;                    // ?
  created_at: string;
  updated_at?: string;                // ?
  cancelled_at?: string | null;       // ?
  cancel_reason?: string | null;      // ?
  cancel_reason_text?: string | null; // ?
  closed_at?: string | null;          // ? archived when set
  subtotal_price: string;             // paise, string
  total_price?: string;               // ?
  current_total_price?: string;       // ?
  total_line_items_price?: string;    // ?
  total_tax?: string; current_total_tax?: string;              // ?
  total_discounts?: string; current_total_discounts?: string;  // ?
  total_outstanding?: string;         // ?
  tax_lines?: unknown[];              // ?
  discount_codes?: unknown[];         // ? non-empty blocks editing
  discount_applications?: { type?: string; source?: string; target_selection?: string }[]; // ?
  shipping_lines?: { title: string; is_removed?: boolean }[];  // ?
  other_charges_breakdown?: unknown[];// ?
  line_items?: LineItem[];            // ?
  customer?: { id: number; email: string; first_name?: string; last_name?: string; phone?: string };
  email?: string; phone?: string;     // ?
  shipping_address?: Address; billing_address?: Address; // ?
  source_name?: string;               // ? 'draft_order', 'shopify', …
  source_identifier?: string | null;  // ? source draft id
  external_order_id?: string | null; external_order_name?: string | null; external_order_number?: string | null; // ?
  note?: string;                      // ?
  tags?: string | string[];           // ? comma string or array
  note_attributes?: { name: string; value: unknown }[] | { metaData?: object }; // ?
  attributes?: Record<string, unknown> | null; // ?
  metafields?: unknown[];             // ?
  payment_details?: { paymentMethod?: string; payment_method?: string; paymentAmount?: number | string; paymentId?: string; pgPaymentTrnxId?: string; paymentInstrument?: string }; // ? camelCase inside
  payment_gateway_names?: string[];   // ?
  order_status_url?: string; gk_order_status_url?: string; // ?
  client_details?: { browserIp?: string; acceptLanguage?: string; userAgent?: string; sessionHash?: string }; // ?
  landing_site?: string; referring_site?: string; // ?
}

interface LineItem {                  // all ?
  id: string;
  product_id: string; variant_id: string | null;
  handle?: string; product_handle?: string;
  title: string; name?: string; variant_title?: string | null;
  quantity: number;                   // original
  current_quantity?: number;          // after edits
  fulfillable_quantity?: number;
  price: string | number;             // paise
  sku?: string; vendor?: string; grams?: number;
  requires_shipping?: boolean; taxable?: boolean; fulfillment_service?: string;
  discount_allocations?: { amount: string | number }[];
  image?: string; imageUrl?: string;
  metadata?: { product_details?: unknown[] };
}

interface Address { first_name; last_name; company?; address1; address2?; city; province; province_code?; country; country_code?; zip; phone?; email? } // strings

interface OrderSettings { prefix: string | null; suffix: string | null; hideShippingMethods: boolean; isDefault?: boolean;
  orderExtraCharges: { type: 'shipping_charges' | 'platform_charges'; rule: { condition: 'greater_than' | 'less_than'; field: 'order_amount'; value: number }; amount: number; label: string }[] } // paise
interface CancellationSettings { notCancellableAfter: string; requireCancellationReason: boolean; cancellationReasonList: string[]; cancellablePaymentMethods: ('PREPAID' | 'COD')[] }
```

- `PATCH /orders/:id` with `line_items` runs the edit guards and returns 409 `ORDER_FULFILLED_UNEDITABLE`, `LINE_ALREADY_FULFILLED`, `ORDER_EDIT_BLOCKED_RULE_BOUND_DISCOUNT`, `LINE_DELETED_UNEDITABLE`, `ORDER_MODIFIED_SINCE_READ`. EditOrder sends metadata only; line items go through the session.
- Bulk archive is camelCase `orderIds` with an `idempotencyKey` in the body. Bulk cancel is snake_case `order_ids` with no key.
- Status is derived: `cancelled_at` or `cancel_reason` means cancelled, else `closed_at` means archived, else `status`, default `open`.
- Settings GETs double-nest (`data.data`), and the PUTs do not.
- `metaFieldSettings` order search builds `search/page/limit` but never appends them to the URL.

## Order edit session

Source: `modules/order/api.ts`, `hooks/useOrderEditSession.ts`, `modules/order/orderEditHelpers.ts`, `modules/order/constants.ts`

| Endpoint | Request | Response |
|---|---|---|
| `POST /orders/:orderId/edit/begin` | `{ reason?, staff_id?, staff_name? }` (500/255/128 chars) | `EditSession` |
| `GET /orders/:orderId/edit/:sessionId` | — | `EditSession` |
| `POST /orders/:orderId/edit/:sessionId/stage` | `EditOp` (one per call) | `EditSession` |
| `POST /orders/:orderId/edit/:sessionId/preview` | `{}` | `{ delta: EditDelta, session: EditSession }` |
| `POST /orders/:orderId/edit/:sessionId/commit` | `{}` | `{ order_id, refund_id, refund_failed, refund_amount, refund_currency, refund_err_code }` |
| `POST /orders/:orderId/edit/:sessionId/discard` | `{}` | — |

```ts
interface EditSession { id: string; state_version: number; status: 'active' | 'committed' | string; computed_delta?: EditDelta } // status, computed_delta ?
type EditOp =
  | { op: 'set_qty'; line_item_id: string; quantity: number }     // ABSOLUTE, vs snapshot current_quantity
  | { op: 'remove_line'; line_item_id: string }
  | { op: 'apply_line_item_discount'; line_item_id: string; discount_fixed_paise?: number; discount_percent?: number; discount_description?: string };
interface EditDelta {
  refund_amount_paise: number;        // paise, positive = owed to customer
  refund_calc_error_code: 'REFUND_RESERVED_QUERY_FAILED' | 'REFUND_CALC_FAILED' | null;
  final_line_items: { id; price; quantity; currentQuantity; fulfillableQuantity; discountAllocations }[]; // camelCase, paise
  applied_line_item_discounts: Record<string, { line_item_id; amount_paise; description }> | { line_item_id; amount_paise; description }[];
  line_deltas: { line_item_id; before; after; delta }[];
}
```

- `refund_amount` from commit is in rupees, while preview `refund_amount_paise` is paise.
- Error code sits at `response.data.code`. Codes shaped like `ERR_*` or `E[A-Z]+` are transport codes and are ignored. A 409 `ACTIVE_SESSION_EXISTS` body carries `existingSessionId` and `existingInitiatedByName`.
- The hook stages on a fresh session every time: debounced 500 ms, it runs discard, begin, stage each op, then preview, so the session always holds exactly the latest diff.
- On unload it sends the discard with raw `fetch` (`keepalive`, `credentials: 'include'`, `merchant-mid` and `gk-merchant-id` headers only), otherwise the lock is held for 30 min TTL plus the 5 min reaper.

| code | meaning / gk-pages handling |
|---|---|
| `ACTIVE_SESSION_EXISTS` | 409 on begin; offer takeover by discarding `existingSessionId` |
| `STALE_SESSION_COLLISION` | expired session not yet reaped; retry begin every 15 s for up to 6 min, then FE `STALE_SESSION_COLLISION_TIMEOUT` |
| `SESSION_STATE_VERSION_STALE` | stage/preview/commit: re-GET the session, retry once; commit restages |
| `SESSION_EXPIRED`, `SESSION_NOT_ACTIVE`, `SESSION_NOT_FOUND` | commit: session gone, restage same ops on a new session |
| `ORDER_MODIFIED_SINCE_SESSION_START`, `COMMIT_KEY_MISMATCH` | commit: restage |
| `ORDER_FULFILLMENT_CHANGED_SINCE_SESSION_START` | commit: session expired by server, do not restage, send merchant back to order |
| `SESSION_REAPED_DURING_COMMIT` | commit "error" but the edit is applied; not a failure, never retry |
| commit 5xx / network | GET session: `committed` means landed, `active` means retry, anything else means unknown (tell the merchant to refresh) |
| `FEATURE_DISABLED`, `ORDER_NOT_FOUND`, `SESSION_ORDER_MISMATCH`, `INVALID_STAGE_OP` | message only |
| `EDIT_ON_CANCELLED_ORDER`, `EDIT_ON_DISCOUNTED_ORDER_UNSUPPORTED` | begin/commit guard; message only |
| `INCREASE_REQUIRES_PAYMENT_COLLECTION`, `INCREASE_REQUIRES_STOCK_RESERVATION_NOT_WIRED`, `INVENTORY_CAPABILITY_UNKNOWN_TRANSIENT_RETRY`, `SET_QTY_BELOW_SHIPPED_FLOOR`, `EDIT_UNSAFE_MISSING_VARIANT_METADATA` | stage rejections; message only |

## Fulfillment and holds

Source: `modules/fulfillment/api.ts`, `modules/fulfillment/type.ts`, `modules/fulfillment/transformer.ts`

| Endpoint | Request | Response |
|---|---|---|
| `GET /orders/:orderId/fulfillments` | — | `{ order_fulfillment_status, fulfillment_holds: Hold[], fulfillments: Fulfillment[], held_line_items: LineRef[], fulfillable_line_items: LineRef[] }` |
| `POST /orders/:orderId/fulfillments` | `{ fulfillment: { line_items: { line_item_id, quantity }[], tracking_info?: TrackingInfo, carrier_code?, notify_customer } }` | `{ fulfillment?, fulfillments?, order_fulfillment_status? }` |
| `POST /orders/:orderId/fulfillments/:fulfillmentId/update_tracking` | `{ fulfillment: { tracking_info?, carrier_code?, notify_customer } }` | `{ fulfillment?: Fulfillment }` |
| `POST /orders/:orderId/hold` | `{ fulfillment_hold: { reason, reason_notes?, handle?, line_items?: { line_item_id, quantity }[] } }` | ? |
| `POST /orders/:orderId/holds/:holdId/blockers` | `{ fulfillment_hold: { reason, reason_notes?, notify_merchant? } }` | `Hold` ? |
| `POST /orders/:orderId/release_hold` | `{ hold_ids }` or `{ blocker_ids }` | ? |
| `POST /orders/bulk-fulfill` | `{ order_ids, notify_customer }` (≤100) | `{ succeeded: { order_id, fulfillment_id?, fulfillment_ids? }[], failed: { order_id, error }[], summary }` |

```ts
interface Fulfillment {
  id: string; order_id?: string; name?: string; status?: string; created_at?: string;
  carrier_code?: string | null; tracking_company?: string | null;
  tracking_number?: string | null; tracking_url?: string | null;
  tracking_numbers?: string[]; tracking_urls?: (string | null)[];   // newer builds
  trackings?: { number: string; url: string | null; shipment_status: string | null; status_happened_at: string | null }[];
  shipment_status?: string | null; notify_customer?: boolean; total_quantity?: number;
  line_items?: LineRef[];
}
interface LineRef { line_item_id: string | number; quantity: number; location_id?: string | null; sku?: string | null }
interface Hold {
  id: string; reason: string; reason_notes?: string | null; handle?: string | null;
  scope: 'order' | 'line_items'; held_by_type?: string; held_by?: string; is_active?: boolean; created_at?: string;
  line_item_ids?: (string | number)[]; line_items?: { line_item_id; quantity }[];
  blockers?: { id; reason; reason_notes?; notify_merchant?; held_by_type?; held_by?; is_active?; created_at?; released_at?; released_by_type?; released_by? }[];
}
interface TrackingInfo { company?: string; number?: string; url?: string; numbers?: string[]; urls?: string[] } // single OR plural, never both
```

- `reason` is one of `AWAITING_PAYMENT`, `HIGH_RISK_OF_FRAUD`, `INCORRECT_ADDRESS`, `INVENTORY_OUT_OF_STOCK`, `UNKNOWN_DELIVERY_DATE`, `ONLINE_STORE_POST_PURCHASE_CROSS_SELL`, `AWAITING_RETURN_ITEMS`, `OTHER`. `carrier_code` must match os-order's carrier list, and the FE value `other` is never sent. Max 20 tracking numbers.
- `POST /hold` claims units. Sending it again holds more, so an extra reason on the same units goes to `/blockers` (a repeat of the same reason is a 200 no-op).
- `release_hold` always names ids; there is no release-all. Releasing a blocker leaves units held while any other blocker is active.

| code | meaning |
|---|---|
| `FULFILLMENT_HELD` (or any 409) | create fulfilment: units are held |
| `FULFILLMENT_HELD`, `NOTHING_TO_FULFILL`, `ORDER_CANCELLED`, `ORDER_NOT_FOUND`, `NO_SHIPPING_ADDRESS` | bulk `failed[].error`: final skip |
| other `failed[].error`, or an id missing from both lists | failed or not attempted, can retry |
| `BULK_LIMIT_EXCEEDED`, `UNKNOWN_CARRIER_CODE` | bulk 4xx: nothing changed. A 5xx/timeout may be partial: refresh the list, then resubmit (safe) |

## Refunds

Source: `modules/refunds/api.ts`, `modules/refunds/type.ts`. Paths are hard-coded, not in `apiEndpoints.ts`. Responses may be wrapped `{ success, data }` or bare.

| Endpoint | Request | Response |
|---|---|---|
| `POST /refunds/calculate` | `{ order_id, line_items: { line_item_id, quantity }[], include_shipping, reason? }` | `RefundCalculation` |
| `POST /refunds` | calculate body + `{ note?, restock_type: 'CANCEL' \| 'NO_RESTOCK', notify_customer }`; header `x-idempotency-key` | `Refund` |
| `GET /refunds/:refundId` | — | `Refund` (polled every 5 s, up to 24 times, until `SUCCESS`/`FAILED`) |
| `GET /orders/:orderId/refunds` | — | `Refund[]` |

```ts
interface RefundCalculation {         // camelCase, paise numbers
  lineItems: RefundAmountLine[]; subtotalAmount; totalTaxAmount; totalDiscountAmount; shippingAmount; totalAmount;
  totalPaid; totalRefundable; previouslyRefunded; currency: string;
}
interface RefundAmountLine { lineItemId: string; quantity; unitPrice; subtotal; taxAmount; discountAmount; totalAmount;
  taxBreakdown: { title; rate; amount }[]; discountBreakdown: { index; amount }[] }
interface Refund {
  id: string; merchantId: string; orderId: string; returnId: string | null;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  trigger: 'CANCELLATION' | 'MERCHANT_INITIATED' | 'EDIT_TRIGGERED' | 'RETURN';
  restockType: 'CANCEL' | 'NO_RESTOCK'; notifyCustomer: boolean; inventoryRestocked: boolean;
  subtotalAmount; totalTaxAmount; totalDiscountAmount; shippingAmount; totalAmount: number; currency: string;
  reason?: string | null; note?: string | null; idempotencyKey: string; createdBy: string;
  gokwikTransactionId?: string | null; gokwikRefundStatus?: string | null; gokwikResponse?: unknown;
  lineItems: (RefundAmountLine & { id: number; refundId: string; restockType; restocked: boolean; restockLocationId: string | null })[];
  createdAt: string; updatedAt: string; processedAt: string | null;
}
```

- The idempotency key is `refund-<orderId>-<uuid>`, capped at 64 chars, and sent as the `x-idempotency-key` header. Bulk archive puts `idempotencyKey` in the body, and draft complete puts `idempotency_key` in the body.
- Returns: qa/sandbox only, not on main.

## Draft orders

Source: `modules/draft-order/api.ts`, `modules/draft-order/type.ts`, `modules/order/api.ts`, fixtures `components/orders/__fixtures__/d72-*.json`, `bulkDeleteDrafts.response.ts`

| Endpoint | Request | Response |
|---|---|---|
| `GET /draft-orders` | query `page, limit, sort_field, sort_direction, status` (repeatable)`, search, …filters` | `{ draft_orders: DraftOrder[], pagination }` (falls back to `orders`) |
| `POST /draft-orders` | `DraftOrderSave` (create); header `merchant-mid` | `DraftOrder` ? |
| `PUT /draft-orders` | `DraftOrderSave` with `id` (update); header `merchant-mid` | `DraftOrder` ? |
| `GET /draft-orders/:draftOrderId` | — | `DraftOrder` |
| `DELETE /draft-orders/:draftOrderId` | — | ? |
| `POST /draft-orders/:draftOrderId/duplicate` | — | `{ id }` ? |
| `POST /draft-orders/:draftOrderId/complete` | `{ financial_intent: 'mark_as_paid' \| 'payment_pending' \| 'invoice', payment_method?, idempotency_key }` | `{ order_id \| orderId, reused? }` ? |
| `POST /draft-orders/:draftOrderId/send-invoice` | `{ to_email?, to_phone?, subject?, message?, notify?: { sms?, whatsapp?, email? } }` | `{ invoice_url \| invoiceUrl, reused? }` ? |
| `POST /draft-orders/bulk/delete` | `{ ids }` (≤50, FE chunks) | `{ deleted: { id, name }[], skipped: { id, name, reason, message }[] }` |
| `POST /draft-orders/calculate` | `{ line_items: { productId, variantId, title, name, quantity, price, sku, custom, requiresShipping, taxable, appliedDiscount? }[], discount_code?, discount_codes?, customer_id?, email?, shippingAddress?, shippingLine?, appliedDiscount?, taxExempt? }` | `{ draft_order: DraftCalc, available_coupons: Coupon[] }` |
| `GET /draft-orders/sortby` | — | `{ key, name, description }[]` |
| `GET /draft-orders/views` | — | `{ views: { name, query }[] }` or bare array |

```ts
interface DraftOrder {                // fixture d72-get.json
  id: string;                         // "dftordr_…"
  dNumber: number | null; name: string;  // "#D72"
  status: 'open' | 'invoice_sent' | 'completed';
  merchantId: string; customerId: string | null; email: string; phone: string;
  note: string; noteAttributes: { gift_wrap: boolean; gift_message: string };
  shippingAddress: Address; billingAddress: Address;   // snake_case inside
  customerInfo: { customerId; email; phone; shippingAddress; billingAddress };
  lineItems: DraftLineItem[];
  totalPrice: string; subtotalPrice: string; totalTax: string; totalDiscounts: string; // paise strings
  currency: 'INR'; taxExempt: boolean; taxExemptions: string[] | null; taxLines: unknown[] | null;
  appliedDiscount: { value_type: 'fixed_amount' | 'percentage'; value: number; title; description; amount: number; id } | null;
  discountCodes: { code: string; type: string; amount: number; discount_id: string; discount_type: string }[];
  shippingLine: { title; price: string /* rupees */; code; source } | null;
  tags: string;                       // comma string ("" when none)
  tagDetails: unknown[]; metafields: unknown[];
  invoiceUrl: string | null;          // null after edit = link invalidated
  invoiceSentAt: string | null; paymentLinkId: string | null; paymentReferenceId: string | null;
  financialIntent: string | null; completionIdempotencyKey: string | null; completedAt: string | null;
  orderId: string | null; osOrderId: string | null;
  sourceName: string; customerLocale: string | null; poNumber: string | null; createdBy: string;
  createdAt: string; updatedAt: string; deleted: boolean;
  // plus ellora*/couponRedeem*/externalDraftOrderId/webhookUpdatedAt sync bookkeeping
}
interface DraftLineItem { id: number; draftOrderId: string; productId: string; variantId: string | null; productHandle: string | null;
  title: string; variantTitle: string | null; name: string; quantity: number; price: string; /* paise */
  originalPrice: number | null; priceOverridden: boolean; sku: string; vendor: string | null; image: string;
  requiresShipping: boolean; taxable: boolean; taxExempt: boolean; giftCard: boolean; custom: boolean;
  fulfillmentService: string; grams: number; properties: unknown[]; appliedDiscount: unknown | null;
  discountAllocations: unknown[] | null; taxLines: unknown[] | null }
// DraftOrderSave = DraftOrder subset (camelCase): { id?, merchantId, name, note, currency, taxExempt, taxExemptions, status?,
//   lineItems (+ handle, product_handle), customerInfo, shippingLine, appliedDiscount, discountCodes, tags: string[],
//   noteAttributes, customerLocale, sourceName, metafields }
interface DraftCalc {                 // fixture d72-calculate-response.json: snake_case, mixed string/number paise
  id: 'temp-id'; financial_status: string; currency: string;
  subtotal_price; current_subtotal_price; total_price; current_total_price; total_tax; current_total_tax; total_outstanding: string;
  totalDiscounts: string;             // camelCase odd one out
  shipping_line: unknown | null; tax_lines: unknown[]; tax_exempt: boolean; tax_exemptions: string[];
  applied_discount: { discount_id; code; amount: number; value: number; value_type; type; description; tnc } | null;
  discount_applications: (DraftCalc['applied_discount'] & { valueType })[];
  line_items: { variant_id; product_id; title; quantity; price: number; line_price: number; requires_shipping; taxable;
    tax_lines: []; discount_allocations: []; is_freebie: boolean }[];
}
interface Coupon { code; discount_id; title; description; type; amount: string; value: string; value_type; applicable: boolean;
  target_type; target_selection; discount_scope; lineItemDiscounts: unknown[]; auto_apply: boolean; payment_mode: string }
```

- The calculate request mixes cases: `line_items` and `discount_code` are snake_case, but the line fields are camelCase.
- Complete failure body: `{ code, codes: string[], total_price: number, message }`. `DRAFT_COMPLETION_DISCOUNT_REMOVED` means a coupon was dropped; refresh and convert again.
- After an edit the draft keeps `status: 'invoice_sent'` but `invoiceUrl` becomes null. Detect a live link from `invoiceUrl`, not from status.

| `skipped[].reason` | meaning |
|---|---|
| `completed` · `not_found` · `already_deleted` | final |
| `payment_in_progress` · `already_paid` | invoice being paid / paid; draft will complete |
| `payment_link_cancel_failed` · `time_budget_exceeded` · `failed` | nothing changed, retry |
| 400 `{ message: ['ids must contain no more than 50 elements'] }` | over cap |

## Order tags

Source: `modules/order/api.ts`, `components/orders/TagsSection.tsx`. Header `gk-Merchant-Id` (from sessionStorage `merchant-mid`). Bodies are camelCase.

| Endpoint | Request | Response |
|---|---|---|
| `GET /orders/tags` | query `is_active=true, search` | `Tag[]` or `{ tags: Tag[] }` |
| `POST /orders/tags` | `{ name, isActive: true }` (name ≤50) | `Tag` |
| `GET /orders/:orderId/tags` | query `is_active=true, search?` | `{ tags: Tag[] }` |
| `POST /orders/:orderId/tags` | `{ tagIds }` | ? |
| `DELETE /orders/:orderId/tags/:tagId` | body `{ staff_id, staff_name }` | ? |
| `POST /orders/bulk/tags/add` | `{ orderIds, tagIds }` | ? |
| `POST /orders/bulk/tags/remove` | `{ orderIds, tagIds }` | ? |
| `GET /draft-orders/:draftOrderId/tags` | — | `{ tags: Tag[] }` |
| `POST /draft-orders/:draftOrderId/tags` | `{ tagIds }` | ? |
| `DELETE /draft-orders/:draftOrderId/tags/:tagId` | — | ? |
| `POST /draft-orders/bulk/tags/add` | `{ draftOrderIds, tagIds }` | ? |
| `POST /draft-orders/bulk/tags/remove` | `{ draftOrderIds, tagIds }` | ? |

```ts
interface Tag { id: string; name: string } // ?
```

- Draft tag calls carry no staff fields.

## Timeline

Source: `modules/timeline/api/timeline.api.ts`, `modules/timeline/type.ts`

| Endpoint | Request | Response |
|---|---|---|
| `GET {TIMELINE}/api/v1/admin/timeline/events/:resourceType/:resourceId` | `resourceType` = `ORDER \| PRODUCT \| COLLECTION \| CUSTOMER`; query `page?, limit?` | `{ data: TimelineEvent[] }` (sometimes bare array) |
| `POST /orders/:orderId/comments` | `{ message, visibility: 'internal', staff_id, staff_name }` | ? |

```ts
interface TimelineEvent { id: string; entity_type: string; entity_id: string; event_type: string; gk_merchant_id: string;
  message: string; data?: unknown; time_line_epoch: number | string } // newest first
```

- Reads come from os-timeline (`{TIMELINE}` = `REACT_APP_TIMELINE_SERVICE_API_URL`, slow: 10 to 20 s). Comments are written to os-order on `{ORDER}`.
- The customer comment equivalent is on os-customer with camelCase `staffId`/`staffName`, and snake_case is rejected there.

## Unused

| Endpoint | Request | Response |
|---|---|---|
| `PUT /draft-orders` (status-only `updateDraftOrderStatus`) | `{ id, status }` | ? |
| `POST /orders` (`createPaidOrder`) | `{ payment_gateway_names, financial_status, test, currency, source_name?, attributes?, line_items: { variant_id, product_id, product_handle?, title, quantity, price, taxable, requires_shipping }[], metafields? }` | ? |
| `POST /orders/:orderId/archive` | `{ staff_id, staff_name }` | ? |
| `GET /api/v1/analyticsnew/orders-home-summary` (not under `/admin`) | query `period: 'today' \| 'last_7_days' \| 'last_30_days'` | `{ period, asOf, metrics: { key, label, value, previousValue, deltaAbsolute, deltaPercent, direction, status, unit, unavailableReason? }[], window, schemaName }`. Mocked (`USE_MOCK_ANALYTICS = true`), never called |
| `/api/orders/filter-views/{create,rename,duplicate,delete}`, `/api/draft-orders/filter-views/*` | — | passed as props only; FilterTabs simulates locally |

# Order commands

[← Commands](../README.md) · Resources: [order](../../resources/defs/order.md), [draft order](../../resources/defs/draft-order.md) · Service: os-order. Paths are relative to `{ORDER}/api/v1/admin` unless they start with a token ([services](../../docs/platform.md#services)).

Permission: `orders:write`; refund commands `orders:refund` (enforcement off in v1).

Effect: R read-only · D destructive · I idempotent · X external. Mode: P pessimistic · O optimistic. Every os-order write carries `staff_id`, `staff_name` (added by the API client).

## Order

| Command | Scope | Steps | Confirm | Effect | Mode | After |
|---|---|---|---|---|---|---|
| `order.updateNote` | record | `PATCH /orders/:id/note` `{note}` | — | I | O | toast "Note saved"; invalidate order, timeline |
| `order.comment` | record | `POST /orders/:id/comments` `{message, visibility: 'internal'}` | — | — | P | invalidate timeline |
| `order.addTags` | record | create missing tags `POST /orders/tags {name, isActive}`; `POST /orders/:id/tags {tagIds}` | — | — | O | invalidate order, tags |
| `order.removeTag` | record | `DELETE /orders/:id/tags/:tagId` | — | I | O | invalidate order |
| `order.bulkTags` | selection | `POST /orders/bulk/tags/add` or `/remove` `{orderIds, tagIds}` (native) | — | I | P | partial results per order |
| `order.updateContact` | record | `PUT {KWIKPASS_CUSTOMER}/v1/admin/customers/:cid?merchantId=` then `PATCH /orders/:id` `{customer, email, phone}` | — | — | P | toast "Contact details updated" |
| `order.edit` | record | session `POST /orders/:id/edit/begin` → `…/edit/:sid/stage` (per op) → `…/preview` → `…/commit`; metadata `PATCH /orders/:id` (no `line_items`); `…/discard` on leave | when refund ≠ 0: "Confirm order edit": "₹X will be refunded" / "collected separately" | X | P | toast "Order updated" (+ refund initiated); go to detail; invalidate order, timeline, inventory, refunds |
| `order.cancel` | record | `PATCH /orders/:id/cancel` | critical: "Cancel order {name}?" / "Keep order" | D X | P | toast "Order {name} cancelled"; invalidate order, timeline, inventory, refunds |
| `order.bulkCancel` | selection | `POST /orders/bulk-cancel` `{order_ids, …}` (native) | critical: "Cancel N orders?" | D X | P | partial results |
| `order.archive` | record, selection | `POST /orders/bulk-archive` `{orderIds, idempotencyKey}` | selection: "Archive N orders?" | I | U (undo: unarchive) | warnings for `ALREADY_ARCHIVED` |
| `order.unarchive` | record, selection | `POST /orders/bulk-unarchive` `{orderIds, idempotencyKey}` | — | I | P | warnings for `ALREADY_OPEN` |
| `order.duplicate` | record | `POST /draft-orders` with copied fields | — | — | P | toast "Draft order created"; open draft |
| `order.openStatusPage` | record | open `gk_order_status_url` or `order_status_url` | — | R | — | — |
| `order.fulfil` | record | `POST /orders/:id/fulfillments` `{fulfillment: {line_items, tracking_info?, carrier_code?, notify_customer}}` | form "Fulfill items" | X | P | invalidate order, fulfillments, timeline |
| `order.updateTracking` | record | `POST /orders/:id/fulfillments/:fid/update_tracking` `{fulfillment: {tracking_info, carrier_code?, notify_customer}}` | — | X | P | invalidate fulfillments |
| `order.hold` | record | `POST /orders/:id/hold` `{fulfillment_hold: {reason, reason_notes?, line_items?}}`; extra reason on an existing hold `POST /orders/:id/holds/:holdId/blockers` | form | — | P | invalidate order, fulfillments |
| `order.releaseHold` | record | `POST /orders/:id/release_hold` `{hold_ids}` or `{blocker_ids}` | — | — | P | invalidate order, fulfillments |
| `order.bulkFulfil` | selection | `POST /orders/bulk-fulfill` `{order_ids (≤ 100), notify_customer}` (native) | "Mark N orders as fulfilled?" | X | P | per-order results (fulfilled / skipped / failed / not attempted) |
| `order.export` | page | bulk-ops job ([bulk-ops.md](bulk-ops.md)) | — | R | P (job) | file emailed; job indicator |
| `order.importPreview` | page | `POST {BULK_OPS}/api/v1/admin/bulk-ops/preview/import` | — | — | P | shows validation |
| `order.import` | page | `POST {BULK_OPS}/api/v1/admin/bulk-ops/import/:jobId` | "Import N orders?" | X | P (job) | job indicator |
| `refund.create` | record | `POST /refunds` (`x-idempotency-key` per attempt); then `poll` `GET /refunds/:id` | "Refund ₹X?" (the preview step) | X | P | invalidate order, refunds, timeline, inventory |

### Input and rules

- **`order.cancel`** input: `{ reason, staffNote?, restock (default true), notify (always true, as today), autoRefund }`. Reasons sent as today's strings: "Customer changed or canceled order", "Payment declined", "Fraudulent order", "Items unavailable", "Staff error", "Other". `autoRefund` only when amount > 0, not COD, not refunded or refund pending.
- **`order.bulkCancel`** uses the same input per order. Today it does not apply the auto-refund rule per order (see [defects](../README.md#defects-in-todays-writes)).
- **`order.archive` / `unarchive`**: single orders use the bulk endpoint with one ID, as today. Visibility: archive when not archived; unarchive when archived (all selected for bulk).
- **`order.edit`**: line changes are session ops (`set_qty` absolute, `remove_line`, `apply_line_item_discount`); no adding items; increases only on unfulfilled, unpaid COD orders. The metadata PATCH sends `note_attributes: [{ name: 'reason_for_edit' }]`, customer, addresses, metafields; `source_name: 'Draft Order'`; no `line_items`. Disabled with reason when cancelled, fully fulfilled or carrying an edit-blocking discount; Shopify-sourced orders show "This order can't be edited here". Commit errors: `PREVIEW_OUT_OF_DATE` re-previews; `SESSION_REAPED_DURING_COMMIT` counts as applied; a dropped commit is re-read before retry.
- **`order.cancel`** is hidden once any item is fulfilled; **`order.bulkCancel`** is offered only when every selected order is cancellable.
- **Fulfilment** writes carry `staff_id`, `staff_name` in the body. Hold reasons are 8 fixed values ([schema](../../schema/orders.md#fulfillment)). Bulk fulfil skips held, fulfilled and cancelled orders and reports each.
- **`order.duplicate`** copies line items, customer, email, phone, addresses, note, tags, custom fields; not discounts, freebies or shipping.
- **`order.updateContact`**: removing a customer sends `{customer: null}`.

### Refund flow

```
select items ──calculate (debounce 300 ms)──▶ preview (note, restock, include shipping)
   ──confirm "Refund ₹X"──▶ POST /refunds  (x-idempotency-key per attempt, notify_customer: true)
   ──▶ poll GET /refunds/:id every 5 s, ≤ 24 times ──▶ success | failed | still processing
```

- The refund machine drives the drawer. Calculate is a query (`POST /refunds/calculate {order_id, line_items:[{line_item_id, quantity}], include_shipping}`), not a command.
- `refund.create` is one step plus `poll: { intervalMs: 5000, maxAttempts: 24, done: status ∈ success | failed }`. Input adds `{note?, restock_type: 'NO_RESTOCK' | 'CANCEL'}`.
- Enabled: not cancelled; disabled with reason for COD ("COD orders can't be refunded"), refunded, partially refunded, refund pending.
- Runs as the refund machine ([../../docs/machines.md](../../docs/machines.md)).

## Draft order

| Command | Scope | Steps | Confirm | Effect | Mode | After |
|---|---|---|---|---|---|---|
| `draftOrder.create` | page | calculate; `POST /draft-orders` | — | — | P | toast "Draft order saved"; open draft |
| `draftOrder.save` | record | calculate `POST /draft-orders/calculate`; `PUT /draft-orders` (id in body) | — | I | P | set detail |
| `draftOrder.complete` | record | `POST /draft-orders/:id/complete` `{financial_intent: 'mark_as_paid' \| 'payment_pending', payment_method?, idempotency_key}` (rules below) | "Place order": Mark as paid / Payment pending | X | P | toast "Order created"; open the order |
| `draftOrder.sendInvoice` | record | `POST /draft-orders/:id/send-invoice` `{notify?: {sms, whatsapp, email}, to_email?, to_phone?, subject?, message?}`; `notify: {}` = get link only | — | X | P | toast "Invoice sent"; status `invoice_sent` (not when link-only); invalidate draft |
| `draftOrder.duplicate` | record | `POST /draft-orders/:id/duplicate` (server copy, catalog lines re-priced); blocked while unsaved | — | — | P | toast; open the copy |
| `draftOrder.delete` | record | `DELETE /draft-orders/:id` | critical: "Delete draft order? This can't be undone." | D | P | toast; go to list |
| `draftOrder.bulkDelete` | selection | `POST /draft-orders/bulk/delete` `{ids}` in chunks of 50 | critical: "Delete N draft orders?" | D | P | partial results: deleted / skipped with reason |
| `draftOrder.bulkTags` | selection | `POST /draft-orders/bulk/tags/add` or `/remove` `{draftOrderIds, tagIds}` | — | I | P | partial results |
| `draftOrder.export` | page | CSV built in the browser from the list endpoint | — | R | P | download |
| `draftOrder.createForCustomer` | record | navigate to new draft with `customerId` prefill | — | R | — | — |

### `draftOrder.complete` (today)

| Precheck | On failure |
|---|---|
| Draft saved and clean | `invalid` "Save the draft before creating an order." / "Save your changes before creating an order." |
| Customer when a coupon is applied | `invalid` "Please select customer to redeem discount" |
| COD selected | sent as `payment_pending` + `payment_method: 'cod'` |

One call; the server prices the saved draft, redeems coupons and links the order. One `idempotency_key` per mounted button, reused on retry (same key returns the existing order, `reused: true`). `DRAFT_COMPLETION_DISCOUNT_REMOVED`: no order created, coupon removed, draft re-read, warning shown.

## Exposure

| Command | Palette | Assistant | Extensions |
|---|---|---|---|
| updateNote, comment, addTags, removeTag, bulkTags, archive, unarchive, duplicate, openStatusPage, export | ✓ | ✓ (topic: orders) | record targets |
| draftOrder.create, save, duplicate, createForCustomer | ✓ | ✓ | — |
| updateContact, edit, fulfil, updateTracking, hold, releaseHold, bulkFulfil, draftOrder.sendInvoice | ✓ | — | — |
| cancel, bulkCancel, refund.create, draftOrder.complete, draftOrder.delete, draftOrder.bulkDelete, import | ✓ | — | — |

Money-moving and destructive order commands are not exposed to the assistant in v1.

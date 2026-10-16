# Order commands

[← Commands](../README.md) · Resources: [order](../../resources/defs/order.md), [draft order](../../resources/defs/draft-order.md) · Service: os-order. Paths are relative to `{ORDER}/api/v1/admin` unless they start with a token ([base URLs](../../platform/api-client.md#base-urls)).

Permission: `write_orders`; refund commands `write_refunds` (enforcement off in v1).

Effect: R read-only · D destructive · I idempotent · X external. Mode: P pessimistic · O optimistic.

## Order

| Command | Scope | Steps | Confirm | Effect | Mode | After |
|---|---|---|---|---|---|---|
| `order.updateNote` | record | `PATCH /orders/:id/note` `{note}` | — | I | O | toast "Note added successfully"; empty → "Note cannot be empty"; invalidate order, timeline |
| `order.comment` | record | `POST /orders/:id/comments` `{message, visibility: 'internal'}` | — | — | P | invalidate timeline |
| `order.addTags` | record | create missing tags `POST /orders/tags {name, isActive}`; `POST /orders/:id/tags {tagIds}` | — | — | O | invalidate order, tags |
| `order.removeTag` | record | `DELETE /orders/:id/tags/:tagId` | — | I | O | invalidate order |
| `order.bulkTags` | selection | `POST /orders/bulk/tags/add` or `/remove` `{orderIds, tagIds}` (native) | — | I | P | partial results per order |
| `order.updateContact` | record | `PUT {KWIKPASS_CUSTOMER}/v1/admin/customers/:cid?merchantId=` then `PATCH /orders/:id` (contact, shipping address, or customer removed) | — | — | P | toast "Customer contact details updated" |
| `order.update` | record | `POST /orders/:id/edit/:sid/commit` (session from the [order edit machine](../../docs/machines.md#page-machines)); metadata `PATCH /orders/:id` (no `line_items`) | when refund ≠ 0 or unknown: "Confirm order edit" / "Save changes" | X | P | toast "Order updated" (+ refund initiated); go to detail; invalidate order, timeline, inventory, refunds |
| `order.cancel` | record | `PATCH /orders/:id/cancel` | critical: "Cancel order {name}?" / "Keep order" | D X | P | toast "Order {name} has been cancelled"; invalidate order, timeline, inventory, refunds |
| `order.bulkCancel` | selection | `POST /orders/bulk-cancel` `{order_ids, …}` (native) | critical: "Cancel N orders?" | D X | P | partial results |
| `order.archive` | record, selection | `POST /orders/bulk-archive` `{orderIds, idempotencyKey}` | selection: "Archive N order(s)?" | I | P | warnings for `ALREADY_ARCHIVED` |
| `order.unarchive` | record, selection | `POST /orders/bulk-unarchive` `{orderIds, idempotencyKey}` | selection: "Unarchive N order(s)?" | I | P | warnings for `ALREADY_OPEN` |
| `order.duplicate` | record | `POST /draft-orders` with copied fields | — | — | P | toast "Draft order created"; open draft |
| `order.openStatusPage` | record | open `gk_order_status_url` or `order_status_url` | — | R | — | — |
| `order.fulfill` | record | `POST /orders/:id/fulfillments` `{fulfillment: {line_items, tracking_info?, carrier_code?, notify_customer}}` | form "Fulfill items" | X | P | invalidate order, fulfillments, timeline |
| `order.updateTracking` | record | `POST /orders/:id/fulfillments/:fid/update_tracking` `{fulfillment: {tracking_info, carrier_code?, notify_customer}}` | — | X | P | invalidate fulfillments |
| `order.hold` | record | `POST /orders/:id/hold` `{fulfillment_hold: {reason, reason_notes?, line_items?}}`; extra reason on an existing hold `POST /orders/:id/holds/:holdId/blockers` | form | — | P | invalidate order, fulfillments |
| `order.releaseHold` | record | `POST /orders/:id/release_hold` `{hold_ids}` or `{blocker_ids}` | — | — | P | invalidate order, fulfillments |
| `order.bulkFulfill` | selection | `POST /orders/bulk-fulfill` `{order_ids (≤ 100), notify_customer}` (native) | "Mark N orders as fulfilled?" | X | P | per-order results (fulfilled / skipped / failed / not attempted) |
| `order.exportPreview` | page | bulk-ops ([bulk-ops.md](bulk-ops.md)) | — | R | P | shows estimate |
| `order.export` | page | bulk-ops job ([bulk-ops.md](bulk-ops.md)) | — | R | P (job) | file emailed; job indicator |
| `order.importPreview` | page | bulk-ops ([bulk-ops.md](bulk-ops.md)) | — | — | P | shows validation |
| `order.import` | page | bulk-ops job ([bulk-ops.md](bulk-ops.md)) | — | X | P (job) | job indicator |
| `refund.create` | record | `POST /refunds` (`x-idempotency-key` per attempt); then `poll` `GET /refunds/:id` | the drawer button "Refund ₹X", disabled when total ≤ 0 | X | P | toast "Refund of ₹X initiated"; invalidate order, refunds, timeline, inventory |

### Input and rules

- **`order.cancel`** / **`bulkCancel`** input: `{ reason: CancelReason, staffNote?, restock (default on), notify (checkbox, default on), autoRefund }`; `autoRefund` offered when `autoRefundEligible`. Bulk today skips that rule per order ([defects](../README.md#defects-in-todays-writes)).
- **`order.archive` / `unarchive`**: single orders use the bulk endpoint with one ID, as today; no confirm for a single record.
- **`order.update`**: commits the edit session's line ops; customer, addresses, metafields and edit reason go in the metadata PATCH. Session writes (begin, stage, discard) are internal commands `orderEdit.*`; preview and the session read are queries ([order](../../resources/defs/order.md)). Error codes: [gateway](../../gateway/os-order.md).
- **`order.duplicate`** copies line items, customer, email, phone, addresses, note, tags, custom fields; not discounts, freebies or shipping.

### Refund flow

- Runs as the [refund machine](../../docs/machines.md#refund); calculate is the command's `preview` (`POST /refunds/calculate`), not a write.
- `refund.create` is one step (`notify_customer: true`) plus `poll: { intervalMs: 5000, maxAttempts: 24, done: status ∈ success | failed }`. Input adds `{ note?, restock: 'no_restock' | 'cancel' }`.
- Visible when not cancelled; disabled with `refundBlockReason` ([rules](../../domain/orders.md#rules)).

## Draft order

| Command | Scope | Steps | Confirm | Effect | Mode | After |
|---|---|---|---|---|---|---|
| `draftOrder.create` | page | calculate; `POST /draft-orders` | — | — | P | toast "Draft order saved"; open draft |
| `draftOrder.update` | record | calculate `POST /draft-orders/calculate`; `PUT /draft-orders` (id in body) | — | I | P | set detail |
| `draftOrder.complete` | record | `POST /draft-orders/:id/complete` `{financial_intent: 'mark_as_paid' \| 'payment_pending', payment_method?, idempotency_key}` (rules below) | "Place order": Mark as paid / Payment pending | X | P | toast "Order created"; open the order |
| `draftOrder.sendInvoice` | record | `POST /draft-orders/:id/send-invoice` `{notify?: {sms, whatsapp, email}, to_email?, to_phone?, subject?, message?}`; `notify: {}` = get link only; hidden when completed | — | X | P | toast "Invoice sent"; status `invoice_sent` (not when link-only); invalidate draft |
| `draftOrder.duplicate` | record | `POST /draft-orders/:id/duplicate` (server copy, catalog lines re-priced); blocked while unsaved | — | — | P | toast; open the copy |
| `draftOrder.delete` | record | `DELETE /draft-orders/:id` | critical: "Delete draft order" / "Are you sure you want to delete this draft order? This action cannot be undone." / "Delete"; hidden when completed, disabled with no products | D | P | toast; go to list |
| `draftOrder.bulkDelete` | selection | `POST /draft-orders/bulk/delete` `{ids}` in chunks of 50 | critical: "Delete N drafts?" | D | P | partial results: deleted / skipped with reason (completed drafts skipped before the call) |
| `draftOrder.bulkTags` | selection | `POST /draft-orders/bulk/tags/add` or `/remove` `{draftOrderIds, tagIds}` | — | I | P | partial results |
| `draftOrder.export` | page | CSV built in the browser from the list endpoint | — | R | P | download |
| `draftOrder.createForCustomer` | record | navigate to new draft with `customerId` prefill | — | R | — | — |

### `draftOrder.complete` (today)

| Precheck | On failure |
|---|---|
| Draft saved and clean | `invalid` "Save the draft before creating an order." / "Save your changes before creating an order." |
| Customer when a coupon is applied | `invalid` "Please select customer to redeem discount" |
| COD selected | sent as `payment_pending` + `payment_method: 'cod'` |

- One call: the server prices the saved draft, redeems coupons and links the order.
- One `idempotency_key` per mounted button, reused on retry; the same key returns the existing order (`reused: true`).
- `DRAFT_COMPLETION_DISCOUNT_REMOVED`: no order created, coupon removed, draft re-read, warning shown.

## Exposure

| Command | Palette | Assistant | Extensions |
|---|---|---|---|
| updateNote, comment, addTags, removeTag, bulkTags, archive, unarchive, duplicate, openStatusPage, exportPreview, export | ✓ | ✓ (topic: orders) | record targets |
| draftOrder.create, update, duplicate, createForCustomer, bulkTags, export | ✓ | ✓ | — |
| updateContact, update, fulfill, updateTracking, hold, releaseHold, bulkFulfill, draftOrder.sendInvoice | ✓ | — | — |
| cancel, bulkCancel, refund.create, draftOrder.complete, draftOrder.delete, draftOrder.bulkDelete, importPreview, import | ✓ | — | — |

Money-moving and destructive order commands are not exposed to the assistant in v1.

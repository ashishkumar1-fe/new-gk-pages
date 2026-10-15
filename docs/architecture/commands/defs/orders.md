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
| `order.edit` | record | calculate `POST /orders/:id/calculate`; save `PATCH /orders/:id` | "Update order? {Refund owed / Amount to collect}" | X | P | go to detail; invalidate order, timeline, inventory |
| `order.cancel` | record | `PATCH /orders/:id/cancel` | critical: "Cancel order {name}?" / "Keep order" | D X | P | toast "Order {name} cancelled"; invalidate order, timeline, inventory, refunds |
| `order.bulkCancel` | selection | `POST /orders/bulk-cancel` `{order_ids, …}` (native) | critical: "Cancel N orders?" | D X | P | partial results |
| `order.archive` | record, selection | `POST /orders/bulk-archive` `{orderIds, idempotencyKey}` | selection: "Archive N orders?" | I | U (undo: unarchive) | warnings for `ALREADY_ARCHIVED` |
| `order.unarchive` | record, selection | `POST /orders/bulk-unarchive` `{orderIds, idempotencyKey}` | — | I | P | warnings for `ALREADY_OPEN` |
| `order.duplicate` | record | `POST /draft-orders` with copied fields | — | — | P | toast "Draft order created"; open draft |
| `order.openStatusPage` | record | open `gk_order_status_url` or `order_status_url` | — | R | — | — |
| `order.export` | page | bulk-ops job ([bulk-ops.md](bulk-ops.md)) | — | R | P (job) | file emailed; job indicator |
| `order.importPreview` | page | `POST {BULK_OPS}/api/v1/admin/bulk-ops/preview/import` | — | — | P | shows validation |
| `order.import` | page | `POST {BULK_OPS}/api/v1/admin/bulk-ops/import/:jobId` | "Import N orders?" | X | P (job) | job indicator |
| `refund.create` | record | `POST /refunds` (`x-idempotency-key` per attempt); then `poll` `GET /refunds/:id` | "Refund ₹X?" (the preview step) | X | P | invalidate order, refunds, timeline, inventory |

### Input and rules

- **`order.cancel`** input: `{ reason, staffNote?, restock (default true), notify (always true, as today), autoRefund }`. Reasons sent as today's strings: "Customer changed or canceled order", "Payment declined", "Fraudulent order", "Items unavailable", "Staff error", "Other". `autoRefund` only when amount > 0, not COD, not refunded or refund pending.
- **`order.bulkCancel`** uses the same input per order. Today it does not apply the auto-refund rule per order (see [defects](../README.md#defects-in-todays-writes)).
- **`order.archive` / `unarchive`**: single orders use the bulk endpoint with one ID, as today. Visibility: archive when not archived; unarchive when archived (all selected for bulk).
- **`order.edit`** sends today's payload: line items (removed merged in), calculated totals, `note_attributes: [{ name: 'reason_for_edit' }]`, customer, addresses; `source_name: 'Draft Order'`. Hidden when cancelled; Shopify-sourced orders show "This order can't be edited here".
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
| `draftOrder.complete` | record | steps below | "Create order for ₹{total}? This marks the draft as paid." | X | P | toast "Order created"; open the order |
| `draftOrder.delete` | record | `DELETE /draft-orders/:id` | critical: "Delete draft order? This can't be undone." | D | P | toast; go to list |
| `draftOrder.bulkTags` | selection | `POST /draft-orders/bulk/tags/add` or `/remove` `{draftOrderIds, tagIds}` | — | I | P | partial results |
| `draftOrder.export` | page | CSV built in the browser from the list endpoint | — | R | P | download |
| `draftOrder.createForCustomer` | record | navigate to new draft with `customerId` prefill | — | R | — | — |

### `draftOrder.complete` steps (today's order)

| # | Step | Endpoint | On failure |
|---|---|---|---|
| 0 | Precheck: customer required when a discount is applied | — | `invalid` "Select a customer to redeem the discount" |
| 1 | Recalculate | `POST /draft-orders/calculate` | abort |
| 2 | Create paid order | `POST /orders` (`financial_status: 'paid'`, `source_name: 'Draft Order'`, payment method COD or prepaid) | abort |
| 3 | Redeem discount (if any) | `POST {DISCOUNT}/api/v1/admin/os-discount/redeem` `{discount_id, discount_code, merchant_id, order_id, customer_id, discount_amount}` | continue with warning "Order created, but discount redemption failed. Check the coupon." |
| 4 | Mark draft completed | `PUT /draft-orders {id, status: 'completed'}` | report: "Order created; draft not marked completed" + retry step 4 |

Step 2 has no compensation (an order can't be un-created), so failures after it are reported, not rolled back.

## Exposure

| Command | Palette | Assistant | Extensions |
|---|---|---|---|
| updateNote, comment, addTags, removeTag, bulkTags, archive, unarchive, duplicate, openStatusPage, export | ✓ | ✓ (topic: orders) | record targets |
| draftOrder.create, save, createForCustomer | ✓ | ✓ | — |
| updateContact, edit | ✓ | — | — |
| cancel, bulkCancel, refund.create, draftOrder.complete, draftOrder.delete, import | ✓ | — | — |

Money-moving and destructive order commands are not exposed to the assistant in v1.

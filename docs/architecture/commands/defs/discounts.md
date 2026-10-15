# Discount commands

[← Commands](../README.md) · Resource: [discount](../../resources/defs/discount.md) · Service: os-discount. Paths are relative to `{DISCOUNT}/api/v1/admin/os-discount` unless they start with a token ([services](../../docs/platform.md#services)).

Permission: `discounts:write` for every command (enforcement off in v1).

Effect: R read-only · D destructive · I idempotent · X external. Mode: P pessimistic. Payloads come from the discount transformer per kind (rules engine; paise; "unlimited" = 1,000,000; no end = `9999-12-31T23:59:59Z`), exactly as today.

| Command | Scope | Steps | Confirm | Effect | Mode | After |
|---|---|---|---|---|---|---|
| `discount.create` | page | `POST /create` | — | — | P | toast "Discount created"; go to list |
| `discount.save` | record | `PUT /update/:id` (keeps `rules[0].rule_id`, `is_deleted: false`) | published: "Changes apply to customers right away" | I | P | toast; go to list |
| `discount.publish` | record | `PATCH /:id/status {status: 'published'}` | "Publish {code}? Customers can use it right away." | I X | P | toast "Discount published" |
| `discount.moveToDraft` | record | `PATCH /:id/status {status: 'draft'}` | — | I | P | toast |
| `discount.markInactive` | record | `PATCH /:id/status {status: 'inactive'}` | "Deactivate {code}?" | I X | P | toast |
| `discount.createWithAssistant` | page | session flow below | — | — | P | opens the editor filled; save with `discount.create` |
| `discountSet.create` | page | `POST /create-discount-set` (base keys + `number_of_random_coupons, prefix, suffix, length, email`) | "Generate N codes?" | X | P | toast "Discount set created" |
| `discountSet.save` | record | `PUT /update/:id` | — | I | P | toast |
| `discountSet.downloadCodes` | record | `POST {BASE}/api/v1/admin/os-discount/bulk-discount/presigned-url {url, operation_type: 'FETCH'}` → fetch zip → CSV | — | R | P | download `discount-codes-{campaignId}.csv` |

Notes:
- **Result handling**: `discount.create` checks the API's success flag; a failed create is shown as an error (today manual create pages always show success; see [defects](../README.md#defects-in-todays-writes)).
- **Status commands** visible by current status: draft → publish; published → move to draft, mark inactive; inactive → publish.
- **Delete**: the API has `DELETE /delete/:id`, but the menu item is disabled in gk-pages; not in v1.
- **Bulk status**: the API has `POST /bulk-update-status {merchant_id, discount_ids, status}`; no bulk UI today; not in v1.
- `discountSet.downloadCodes` enabled when the campaign job is completed.

### Create with the assistant

Uses the existing os-discount AI session API, not a second path:

```
POST /sessions {title?} → POST /sessions/:id/message {content}
  → (choices) POST /sessions/:id/select {selection_token, selected_ids, picked_metadata?}
  → POST /sessions/:id/confirm {action_token}   (410 → "That confirmation expired. Ask again.")
  → editor opens filled (AI-filled fields highlighted) → user saves with discount.create
```

In the new admin this flow runs inside the assistant panel (topic: discounts); the confirm step is the proposal card.

## Exposure

| Command | Palette | Assistant | Extensions |
|---|---|---|---|
| create, save, moveToDraft, createWithAssistant, downloadCodes | ✓ | ✓ (topic: discounts) | — |
| publish, markInactive, discountSet.create, discountSet.save | ✓ | ✓, proposal + confirm (customer-facing) | — |

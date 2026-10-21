# Registry

[← Commands](README.md)

All v1 commands by resource. Definitions in [defs/](defs).

| Resource | Commands | File |
|---|---|---|
| Product | `create`, `update`, `updateVariant`, `delete`, `bulkDelete`, `setStatus`, `bulkEdit`, `duplicate`, `copyLink`, `import`, `importPreview`, `export`, `exportPreview`, `generateContent` | [catalog](defs/catalog.md#product) |
| Collection | `create`, `update`, `delete`, `bulkDelete`, `setPublished`, `bulkEdit`, `copyLink` | [catalog](defs/catalog.md#collection) |
| Price schedule | `create`, `cancel` | [catalog](defs/catalog.md#price-schedule-flash-sale) |
| Field definition | `create`, `update`, `delete` | [catalog](defs/catalog.md#custom-field-definitions) |
| Inventory | `adjust`, `bulkEdit`, `import`, `export` | [inventory](defs/inventory.md#inventory) |
| Purchase order | `create`, `update`, `markOrdered`, `close`, `reopen`, `openReceive`, `receive`, `delete`, `createFromSelection` | [inventory](defs/inventory.md#purchase-order) |
| Transfer | `create`, `update`, `markPending`, `openReceive`, `receive`, `delete`, `createFromSelection` | [inventory](defs/inventory.md#transfer) |
| Order | `updateNote`, `comment`, `addTags`, `removeTag`, `bulkTags`, `updateContact`, `update`, `cancel`, `bulkCancel`, `archive`, `unarchive`, `duplicate`, `openStatusPage`, `fulfill`, `updateTracking`, `hold`, `releaseHold`, `bulkFulfill`, `import`, `importPreview`, `export`, `exportPreview` | [orders](defs/orders.md#order) |
| Refund | `create` | [orders](defs/orders.md#refund-flow) |
| Order edit (`orderEdit`, internal: machine only, not exposed) | `begin`, `stage`, `discard` | [orders](defs/orders.md#order-edit-session-internal) |
| Draft order | `create`, `update`, `complete`, `sendInvoice`, `duplicate`, `delete`, `bulkDelete`, `bulkTags`, `export`, `createForCustomer` | [orders](defs/orders.md#draft-order) |
| Customer | `create`, `update`, `deleteAddress`, `setBlocked`, `delete`, `comment`, `export` | [customers](defs/customers.md#customer) |
| Segment | `create`, `update`, `delete` | [customers](defs/customers.md#segment) |
| Discount | `create`, `update`, `publish`, `moveToDraft`, `markInactive`, `createWithAssistant`, `aiConfirm` | [discounts](defs/discounts.md) |
| Discount set | `create`, `update`, `downloadCodes` | [discounts](defs/discounts.md) |
| Location | `create`, `update`, `activate`, `deactivate`, `delete` | [inventory](defs/inventory.md#inventory) |
| Inventory level (`inventoryLevel`) | `connect`, `disconnect` | [inventory](defs/inventory.md#inventory) |
| Bulk-ops job (`bulkOps`) | `cancel` | [bulk-ops](defs/bulk-ops.md#job-tracking) |

## Permissions

Each command declares a permission key (`write_orders`, `write_refunds`, `write_products`, …); enforcement is off in v1 and the backend remains the authority. Today's checks and the switch: [identity and access](../platform/identity-access.md#permissions).

## Shortcuts

| Key | Command |
|---|---|
| `mod+k` | open palette |
| `mod+s` | save the open editor (`*.update`) |
| `j` / `k` | previous / next order (navigation, order detail) |
| `?` | list shortcuts |

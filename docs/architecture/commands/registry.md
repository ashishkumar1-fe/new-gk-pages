# Registry

[← Commands](README.md)

All v1 commands by resource. Definitions in [defs/](defs/).

| Resource | Commands | File |
|---|---|---|
| Product | `create`, `save`, `delete`, `bulkDelete`, `setStatus`, `bulkEdit`, `duplicate`, `copyLink`, `import`, `importPreview`, `export`, `generateContent` | [catalog](defs/catalog.md#product) |
| Collection | `create`, `save`, `delete`, `bulkDelete`, `setPublished`, `bulkEdit`, `copyLink` | [catalog](defs/catalog.md#collection) |
| Price schedule | `create`, `cancel` | [catalog](defs/catalog.md#price-schedule-flash-sale) |
| Field definition | `create`, `update`, `delete` | [catalog](defs/catalog.md#custom-field-definitions) |
| Inventory | `bulkSet`, `bulkEdit`, `updateQuantities`, `import`, `export` | [inventory](defs/inventory.md#inventory) |
| Purchase order | `create`, `save`, `markOrdered`, `close`, `reopen`, `openReceive`, `receive`, `delete`, `createFromSelection` | [inventory](defs/inventory.md#purchase-order) |
| Transfer | `create`, `save`, `markPending`, `openReceive`, `receive`, `delete`, `createFromSelection` | [inventory](defs/inventory.md#transfer) |
| Order | `updateNote`, `comment`, `addTags`, `removeTag`, `bulkTags`, `updateContact`, `edit`, `cancel`, `bulkCancel`, `archive`, `unarchive`, `duplicate`, `openStatusPage`, `import`, `importPreview`, `export` | [orders](defs/orders.md#order) |
| Refund | `create` | [orders](defs/orders.md#refund-flow) |
| Draft order | `create`, `save`, `complete`, `delete`, `bulkTags`, `export`, `createForCustomer` | [orders](defs/orders.md#draft-order) |
| Customer | `create`, `save`, `deleteAddress`, `setBlocked`, `delete`, `comment`, `export` | [customers](defs/customers.md#customer) |
| Segment | `create`, `save`, `delete` | [customers](defs/customers.md#segment) |
| Discount | `create`, `save`, `publish`, `moveToDraft`, `markInactive`, `createWithAssistant` | [discounts](defs/discounts.md) |
| Discount set | `create`, `save`, `downloadCodes` | [discounts](defs/discounts.md) |
| Bulk-ops job (`bulkOps`) | `cancel` | [bulk-ops](defs/bulk-ops.md#job-tracking) |

## Assistant topics (v1)

| Topic | Can propose | Never in v1 |
|---|---|---|
| Catalog | product create / save / status / bulk edit / duplicate / copy link / generate content; collection create / save / publish / copy link; field definition create; exports | deletes, imports, price schedules |
| Inventory | create PO or transfer (also from selection), save them, mark ordered / pending, open receive; exports | stock edits, receive, close, delete, import |
| Orders | notes, comments, tags, archive / unarchive, duplicate, open status page, draft create / save / create for customer; export | cancel, refund, edit, complete draft, delete, import |
| Customers | create, save, comment, export; segment create / save | block, delete |
| Discounts | create (via session API), save, draft; publish and deactivate with extra confirm; bulk codes | — |

Every proposal still needs the person's approval; this table only limits what the assistant may propose.

## Permissions

gk-pages checks no permissions on these screens today (`PermissionValues` defines 7 values; none are used). Staff roles are out of v1 scope. Each command still declares a permission key (`orders:write`, `orders:refund`, `products:write`, …) so enforcement is one switch when roles arrive; until then the check passes and the backend remains the authority.

## Shortcuts

| Key | Command |
|---|---|
| `mod+k` | open palette |
| `mod+s` | save the open editor (`*.save`) |
| `j` / `k` | previous / next order (navigation, order detail) |
| `?` | list shortcuts |

# Endpoints → resources and commands

[← Schema](README.md)

What the backend offers per entity today. Reads back resource queries. The write column is **backend capability**, not the v1 command list; v1 commands (which use a subset) are in [../commands/registry.md](../commands/registry.md).

| Entity | Service | Reads | Writes (backend capability) |
|---|---|---|---|
| Product | item | list (search, tags, vendor, type, status), get | `product.create`, `product.save`, `product.delete`, `product.bulkDelete`, `product.bulkUpdate`, `product.import`, `product.export` |
| Variant | item | list by product (offset), get | saved with `product.save`; `variant.bulkUpdate` |
| Collection | item | list, get (with products) | `collection.create`, `collection.save`, `collection.delete`, `collection.bulkDelete`, `collection.setPublished`, `collection.bulkEdit` |
| Taxonomy, vendors, types, tags | item | lookups | — |
| Price schedule | item | list, get | `priceSchedule.create`, `priceSchedule.cancel` |
| Inventory | inventory | v3 levels by location (range filters, search, sort), items, adjustments history; per-variant per-location | `inventory.adjust`, `inventory.bulkEdit` (v3 set-on-hand / set-quantities / adjust-quantities, reason-coded), `inventoryLevel.connect` / `disconnect`, `inventory.import`, `inventory.export` (v1) |
| Location | inventory | v3 list (active + inactive), get | `location.create`, `location.update`, `location.activate`, `location.deactivate` (with drain), `location.delete` (v3) |
| Supplier | inventory | list | — |
| Purchase order | inventory | list, get | `purchaseOrder.create`, `purchaseOrder.save`, `purchaseOrder.receive`, `purchaseOrder.delete` |
| Transfer | inventory | list, get | `transfer.create`, `transfer.save`, `transfer.receive`, `transfer.delete` |
| Custom field definition | inventory | by owner type, get | `fieldDefinition.create`, `fieldDefinition.update`, `fieldDefinition.delete` |
| Metaobject | inventory | definitions, entries | `metaobject.create`, `metaobject.update` |
| Order | os-order | list (rich filters, views, sort options, `active_holds_count`), get, fulfillments | `order.create`, `order.edit` (session: begin → stage → preview → commit / discard; metadata PATCH), `order.cancel`, `order.archive`, `order.addTags`, `order.removeTags`, `order.updateNote`, `order.comment`, `order.fulfil`, `order.updateTracking`, `order.hold`, `order.releaseHold`, bulk cancel / archive / tag / fulfil |
| Draft order | os-order | list (server filters), get, calculate | `draftOrder.create`, `draftOrder.save`, `draftOrder.complete` (one call), `draftOrder.sendInvoice`, `draftOrder.duplicate`, `draftOrder.delete`, `draftOrder.bulkDelete`, bulk tag |
| Refund | os-order | calculate, get, list by order | `refund.create` (machine: calculate → confirm → poll); also created by an order-edit commit |
| Timeline | timeline | `GET {TIMELINE}/api/v1/admin/timeline/events/:type/:id?page&limit` | comments via order / customer services |
| Customer | os-customer | filter list, get, addresses | `customer.create`, `customer.save`, `customer.delete`, `customer.block`, `customer.import`, `customer.export`, `address.*` |
| Segment | os-customer | list, get, customers | `segment.create`, `segment.save`, `segment.delete` |
| Discount | Discount Service V2 (gateway) | fetch (status, search, sort, page), get, check-code, merchant config | `discount.create`, `discount.save`, `discount.setStatus` / `discount.bulkSetStatus` / `discount.delete` (all `PUT /bulk/update`), `discount.checkCode` |
| Discount set | os-discount | list, get | `discountSet.create`, `discountSet.save`, `discount.createBulkCodes` |
| App | app ecosystem | list (installed) | `app.install`, `app.update`, `app.uninstall` |
| Media asset | os-resources | list | `media.upload`, `media.update`, `media.delete`, `media.generateAltText` |

Missing endpoints for design features are listed in [deferred.md](deferred.md).

Production command definitions, with exact endpoints, confirmations and results: [../commands/registry.md](../commands/registry.md).

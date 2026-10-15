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
| Inventory | inventory | by location (filters), search, per-variant per-location | `inventory.bulkSet`, `inventory.bulkEdit`, `inventory.updateQuantities` (absolute values, as today), `inventory.import`, `inventory.export` |
| Location | inventory | list | `location.create`, `location.update`, `location.deactivate` |
| Supplier | inventory | list | — |
| Purchase order | inventory | list, get | `purchaseOrder.create`, `purchaseOrder.save`, `purchaseOrder.receive`, `purchaseOrder.delete` |
| Transfer | inventory | list, get | `transfer.create`, `transfer.save`, `transfer.receive`, `transfer.delete` |
| Custom field definition | inventory | by owner type, get | `fieldDefinition.create`, `fieldDefinition.update`, `fieldDefinition.delete` |
| Metaobject | inventory | definitions, entries | `metaobject.create`, `metaobject.update` |
| Order | os-order | list (rich filters, views, sort options), get | `order.create`, `order.edit` (calculate → save), `order.cancel`, `order.archive`, `order.addTags`, `order.removeTags`, `order.updateNote`, `order.comment`, bulk cancel / archive / tag |
| Draft order | os-order | list, get, calculate | `draftOrder.create`, `draftOrder.save`, `draftOrder.complete`, `draftOrder.delete` |
| Refund | os-order | calculate, get, list by order | `refund.create` (machine: calculate → confirm → poll) |
| Timeline | timeline | `GET {TIMELINE}/api/v1/admin/timeline/events/:type/:id?page&limit` | comments via order / customer services |
| Customer | os-customer | filter list, get, addresses | `customer.create`, `customer.save`, `customer.delete`, `customer.block`, `customer.import`, `customer.export`, `address.*` |
| Segment | os-customer | list, get, customers | `segment.create`, `segment.save`, `segment.delete` |
| Discount | os-discount | list (status, search, dates), get | `discount.create`, `discount.save`, `discount.delete`, `discount.setStatus`, `discount.bulkSetStatus`, `discount.createBulkCodes` |
| App | app ecosystem | list (installed) | `app.install`, `app.update`, `app.uninstall` |
| Media asset | os-resources | list | `media.upload`, `media.update`, `media.delete`, `media.generateAltText` |

Missing endpoints for design features are listed in [deferred.md](deferred.md).

Production command definitions, with exact endpoints, confirmations and results: [../commands/registry.md](../commands/registry.md).

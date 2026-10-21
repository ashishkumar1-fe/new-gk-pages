# Registry

[← Resources](README.md)

Every resource in the admin. Nav groups follow the Ratio design sidebar.

All routes live under `/store/$storeId` ([routing](../surfaces/routing.md)); paths here and in resource and command definitions are relative to it.

| Resource | Service | Routes | Screen | Nav | Definition |
|---|---|---|---|---|---|
| Order | os-order | `/orders`, `/orders/$id`, `/orders/$id/edit` | list + detail view + edit route | Orders (badge: count) | [order](defs/order.md) |
| Draft order | os-order | `/draft-orders`, `/draft-orders/$id`, `/draft-orders/new` | list + editor | Orders › Drafts | [draft-order](defs/draft-order.md) |
| Product | item | `/products`, `/products/$id`, `/products/new`, `/products/$id/variants` | list + editor | Products | [product](defs/product.md) |
| Collection | item | `/collections`, `/collections/$id`, `/collections/new` | list + editor | Products › Collections | [collection](defs/collection.md) |
| Inventory | inventory | `/inventory?location=` | list with cell edit | Products › Inventory | [inventory](defs/inventory.md) |
| Location | inventory | `/inventory/locations` | list (name + Default badge, address, status) + form; row menu edit, activate / deactivate / delete by status | — ("Manage locations" on the inventory page; the sidebar has two levels) | [location commands](../commands/defs/inventory.md#inventory) |
| Purchase order | inventory | `/purchase-orders`, `/purchase-orders/$id`, `/purchase-orders/new`, `/purchase-orders/$id/receive` | list + editor + receive | Products › Purchase orders | [purchase-order](defs/purchase-order.md) |
| Transfer | inventory | `/transfers`, `/transfers/$id`, `/transfers/new`, `/transfers/$id/receive` | list + editor + receive | Products › Transfers | [transfer](defs/transfer.md) |
| Customer | os-customer | `/customers`, `/customers/$id`, `/customers/new` | list + editor | Customers | [customer](defs/customer.md) |
| Segment | os-customer | `/segments`, `/segments/$id`, `/segments/new`, `/segments/$id/customers` | list + editor | Customers › Segments | [segment](defs/segment.md) |
| Discount | discount (V2) | `/discounts`, `/discounts/$id`, `/discounts/new` | list + editor | Discounts | [discount](defs/discount.md) |
| Discount set | discount (os-discount) | `/discount-sets`, `/discount-sets/$id`, `/discount-sets/new/$kind` | list + editor | Discounts › Bulk codes | [discount](defs/discount.md#discount-set) |

## Supporting resources (lookups and settings)

No list screen of their own in v1; used by pickers, filters and the settings sheet.

| Resource | Service | Used by |
|---|---|---|
| Supplier | inventory | PO supplier picker |
| Vendor, product type, tags | item | Product filters and organization fields |
| Taxonomy | item | Product category |
| Field definition | inventory | Settings › Custom fields; editors (runtime fields) |
| Metaobject | inventory | Settings › Custom fields; reference fields |
| Price schedule | item | Products › Flash sale ([bulk-action machine](../docs/machines.md#bulk-action)) and its schedules list with cancel |
| App | media-apps | Settings › Apps |
| Media asset | media-apps | Media pickers; Content |
| Timeline event | os-order (timeline) | Order and customer detail |
| Order tag | os-order | Order tags section and bulk tags |
| Job | bulk-ops | Jobs indicator, import / export history, `bulkOps.cancel` |

## Design-only (capability off until backend exists)

See [deferred](../domain/deferred.md).

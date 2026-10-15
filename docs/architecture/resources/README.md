# Resources

[← Architecture](../README.md)

A **resource** is one entity as the admin presents it: how it is fetched, listed, edited and found. Each is defined once; list screens, editors, ⌘K search, the assistant and extensions read the same definition.

Definitions here are the production ones, taken from today's gk-pages behaviour and the Ratio design, on top of the [schema](../schema/README.md). Parity rule applies: filters, validations and derived values behave as today; differences from the design are listed in [../schema/deferred.md](../schema/deferred.md).

## Layers

```
schema (Zod)            what the data is                    ../schema/
   ▼
data access             fetch functions, cache keys          data-access.md
   ▼
resource definition     how the admin presents it            contract.md, defs/
   ▼
generic screens         list, editor, quick create, ⌘K       list.md, editor.md
```

## Files

| File | Covers |
|---|---|
| [contract.md](contract.md) | The `ResourceDefinition` type |
| [data-access.md](data-access.md) | Fetch functions, query keys, cache policy, invalidation |
| [list.md](list.md) | List screen behaviour: URL state, search, filters, views, sort, selection, inline edit |
| [editor.md](editor.md) | Record editor: draft, sections, server calculation, save, sub-routes |
| [registry.md](registry.md) | Every resource: service, routes, screen kind, nav |
| [defs/](defs/) | One file per resource with its real definition |

## Definitions

| Resource | File |
|---|---|
| Product | [defs/product.md](defs/product.md) |
| Collection | [defs/collection.md](defs/collection.md) |
| Inventory | [defs/inventory.md](defs/inventory.md) |
| Purchase order | [defs/purchase-order.md](defs/purchase-order.md) |
| Transfer | [defs/transfer.md](defs/transfer.md) |
| Order | [defs/order.md](defs/order.md) |
| Draft order | [defs/draft-order.md](defs/draft-order.md) |
| Customer | [defs/customer.md](defs/customer.md) |
| Segment | [defs/segment.md](defs/segment.md) |
| Discount, discount set | [defs/discount.md](defs/discount.md) |

## Rules

1. **Reads only.** A resource never writes. Writes are commands, referenced by ID.
2. **Declarative first, escape hatch always.** Any column, filter, field or section can be a custom component; any route can use its own page.
3. **The URL is the list state.** A list view can always be shared or refreshed.
4. **Behaviour as today.** Filters map to today's API params, validations and derived values are ported with their gk-pages source lines.

## Today's UI issues and how the new admin treats them

| Issue in gk-pages | Treatment |
|---|---|
| Search debounced 500 ms in the shared list toolbar (fixed in gk-pages since 2026-08-21) | Kept: debounced everywhere |
| List state lost on navigation; held in Redux/session/local storage | Fixed: URL |
| Column sort on current page only (products, POs, transfers, customers; orders and drafts sort on the server since 2026-08) | Dropped: sort only where the API sorts |
| Filters/tabs applied to current page only (PO and transfer tabs, segment search) | Kept as today until the API has the param; listed in [deferred.md](../schema/deferred.md) |
| Edit saves that skip validation (PO, transfer) | Fixed: validation always runs |
| No unsaved-changes guard on any editor | Added (design has a save bar) |
| Product delete without confirmation | Confirmation added |
| Stub bulk actions (PO, transfer), stub duplicate (transfer), dead shipping-line modal (draft) | Not carried over |
| Receive drops lines with only rejected quantity (PO, transfer) | Affects stock: needs product sign-off before fixing |
| Segment editor resets AND/OR to AND on edit | Fixed: reads the saved value |
| Draft list doesn't refresh after bulk tag change | Fixed by cache invalidation |

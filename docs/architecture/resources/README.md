# Resources

[← Architecture](../README.md)

A **resource** is one entity as the admin presents it: how it is fetched, listed, edited and found. Each is defined once; list screens, editors, ⌘K search, the assistant and extensions read the same definition.

Built on the [domain](../domain/README.md) → [data access](data-access.md) → definition → generic screens ([list](list.md), [editor](editor.md)).

## Files

| File | Covers |
|---|---|
| [contract.md](contract.md) | The `ResourceDefinition` type |
| [data-access.md](data-access.md) | Fetch functions, query keys, cache policy, invalidation |
| [list.md](list.md) | List screen behaviour: URL state, search, filters, views, sort, selection, cell edit |
| [editor.md](editor.md) | Record editor: draft, sections, server calculation, save, sub-routes |
| [registry.md](registry.md) | Every resource: service, routes, screen kind, nav |
| [defs/](defs) | One file per resource with its real definition (index: [registry](registry.md)) |

## Rules

1. **Reads only.** Writes are commands, referenced by ID.
2. **Declarative first, escape hatch always.** Any column, filter, field or section can be a custom component; any route can use its own page. Bespoke screens (visual editor, analytics, onboarding) are plain feature code; their writes are still commands (d41).
3. **Behaviour as today** ([parity rule](../domain/README.md#five-rules-that-shape-everything)): filters map to today's API params; validations and derived values cite their gk-pages source lines.

## Today's UI issues and how the new admin treats them

| Issue in gk-pages | Treatment |
|---|---|
| List state lost on navigation; held in Redux/session/local storage | Fixed: URL |
| Column sort on current page only (products, POs, transfers, customers; orders and drafts sort on the server since 2026-08) | Dropped: sort only where the API sorts |
| Filters/tabs applied to current page only (PO and transfer tabs, segment search) | Kept as today until the API has the param; listed in [deferred.md](../domain/deferred.md) |
| Edit saves that skip validation (PO, transfer) | Fixed: validation always runs |
| No unsaved-changes guard on any editor | Added (design has a save bar) |
| Stub bulk actions (PO, transfer), stub duplicate (transfer), dead shipping-line modal (draft) | Not carried over |
| Segment editor resets AND/OR to AND on edit | Fixed: reads the saved value |
| Draft list doesn't refresh after bulk tag change | Fixed by cache invalidation |

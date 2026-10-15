# Deferred changes

[← Schema](README.md)

What v1 deliberately does not change or build, and how each item is prepared so it can land later as a local change. The parity rule is in the [schema README](README.md).

Three groups:

## A. Presentation: we handle, no logic change

| Item | How |
|---|---|
| Mixed case, envelopes, pagination names, status casing, sentinels | Transformers per service, lossless, no recalculation |
| Money units (customer `totalSpent` in rupees, PO decimal strings) | Unit conversion at the boundary only |
| ⌘K search across resources | Calls existing per-resource search endpoints |
| Nav counts | Existing list `total` |
| Draft order completion | Same two calls, same order, wrapped in one command |
| Discount transformer quirks (buy X get Y quantity) | Written exactly as today |

## Designing for the change

Deferred items in B and C will come. Today's work keeps each of them a **local change**: one schema field, one transformer, one command or one section, never a hunt across screens. The "Seam" column says what we do now so that holds.

Seams used throughout:

- **Lists, not booleans**, for anything that can grow (channels, tax lines, consent channels, payments).
- **Unions with exhaustive switches** for kinds and statuses, so adding a value makes TypeScript point at every place to update.
- **One owner per rule**: each calculation or rule lives in one domain function, covered by tests that pin today's gk-pages behaviour. Changing the rule is one diff, and the tests show exactly what moved.
- **One command per write**: the endpoint behind a command can change without touching screens or the assistant.
- **Registries for surfaces**: nav items, settings tabs, editor sections and list columns come from resource definitions, so a new feature is registered, not wired by hand.
- **Capability flags**: features without a backend are registered but switched off, so turning them on is a flag, not a build.
- **Labels in one dictionary**: names like "Compare-at price" vs "MRP" are copy, not code.

## B. Business logic: keep today's behaviour, change only with product sign-off

| # | Item | Today | Design / idea | Seam (what we do now) |
|---|---|---|---|---|
| 1 | GST per product | `taxable` + `hs_code`; server calculates | GST rate picker | Tax is its own editor section and its own schema block (`ProductTax`); adding `gstRate` is one field + one input |
| 2 | Tax lines | Generic lines from server; 18% display fallback | CGST/SGST/IGST split | UI renders `taxLines[]` as a list, never assumes one line; fallback lives in one function (`displayTax`) |
| 3 | Compare-at price | `compare_at_price` | Labelled MRP | Label from the copy dictionary |
| 4 | Sales channels | online, pos | Marketplaces | Modelled as channel rows now (`channels: { channelId, published }[]`); marketplaces are more rows |
| 5 | Inventory edits | Absolute values, no history | Adjustments with reason, history | All stock writes go through `inventory.bulkSet`, `inventory.bulkEdit`, `inventory.updateQuantities` and `product.save`; switching endpoint is inside the command. Stock model already has named states |
| 6 | Variant save | Full replace | Diff-based save | Replace vs diff decided inside `product.save` only |
| 7 | Validations, discount %, margin | As in gk-pages | Ported as is | One rules module per entity with characterization tests |
| 7a | Product status names | Active / Draft / Archived | Active / Draft / Hidden | Status labels from the copy dictionary |
| 7b | Pricing with variants | Pricing section hidden when variants exist | Pricing shown with the variants table | Pricing is its own section with `visibleWhen`; one predicate changes |
| 7c | Receive with only rejected quantity | Line dropped (not sent) | Send it | One line in `purchaseOrder.receive` / `transfer.receive` |

## C. New features: no backend today, out of v1 unless product prioritises

| # | Feature | Where in design | Seam (what we do now) |
|---|---|---|---|
| 8 | Store settings beyond merchant config | Settings → General | `Store` schema already defined; fields fill as the API grows |
| 9 | Shipping zones and rates | Settings → Shipping, Home | Settings tabs come from a registry; new tab = new resource + flag |
| 10 | Custom domains | Settings → Domains, Home | Same as 9 |
| 11 | Checkout connect, bank account | Settings → Checkout, Home | Same as 9 |
| 12 | Admin notification feed | Top bar | Top bar has a slot; bell registers when the feed exists |
| 13 | Onboarding checklist | Home | Checklist items are a list of `{ id, done: query }`; each item registers with its feature |
| 14 | Custom field groups | Product editor | Editor groups fields through one `groupFields()`; today it returns pinned / others |
| 15 | Gift cards | Products nav | New resource + nav entry from the registry |
| 16 | Fulfillment, tracking, returns, exchanges | Orders | Order statuses are already separate fields; order page sections are pluggable; new commands slot in |
| 17 | Payment transactions, mark COD paid | Orders | `Payment` is one object today; becomes a list behind the same accessor |
| 18 | WhatsApp marketing consent | Customers | Consent is a map by channel (`marketing.email`, `.sms`, `.push`); WhatsApp is one more key |
| 19 | Free shipping discounts | Discounts | `DiscountKind` union + transformer switch; new kind is one case, compiler finds the rest |
| 20 | Product insights (sell-through, days of inventory, ABC) | Products list | List `insights` slot, capability off |
| 21 | Return window, COD and package per product | Product editor, Shipping | Shipping section fields behind a capability |
| 22 | Server-side status and filter params for POs, transfers, drafts, segment search | Lists | Filters declared with `toParams`; moving off client-side is a provider change |
| 23 | Server sort for products, collections, customers | Lists | `sort` config per resource; add options when the API sorts |

Group C screens ship only when their backend exists; until then they are hidden, not faked.

## Backend consistency

When a service normalizes its case, envelopes or units, only that service's transformer changes. The domain model and screens don't.

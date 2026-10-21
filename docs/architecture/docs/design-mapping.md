# Design mapping

[← Architecture](../README.md)

How the Ratio design (Login, Home, Products, Product detail, Settings, top bar, loaders, Storefront placeholder) maps onto the architecture. Orders, customers and other sections are in the nav but not designed yet. Logic leads: where they differ, the design is asked to change ([below](#asks-to-design)).

## Features vs today

| Area | In the design | gk-pages today |
|---|---|---|
| Login | Email + password → OTP, Google sign-in | Dashboard shell |
| Shell | 2-level nav with counts, ⌘K across resources, notifications, store switcher, Arya panel | Dashboard shell; no search, notifications or AI |
| Home | Setup guide (product, checkout, domain, shipping, storefront) and Arya chat | — |
| Products list | Insights strip, status tabs, search and filter, selection, import/export, quick add | Exists |
| Product editor | One page: pricing, variant options, stock per location, shipping, SEO, sales channels, custom fields | Exists, split across large components |
| Settings sheet | General, checkout, shipping zones, domains, apps, metafields, with search | Custom fields and apps only |

## Where it lands

| Design element | v1 |
|---|---|
| Products list, product editor | [product resource](../resources/defs/product.md), [catalog commands](../commands/defs/catalog.md) |
| Inline "Create definition" | `fieldDefinition.create` |
| Quick add | `product.create` via quick create |
| Import / export | bulk-ops jobs |
| ⌘K, nav counts, store switcher, assistant panel, settings sheet | [chrome](../surfaces/chrome.md) |
| Page and table loaders | Skeletons ([pages](../surfaces/pages.md#page-states)) |
| Insights strip, gift cards, checkout, shipping zones, domains, bank account, notification feed, setup guide, GST rate, return window / COD / package, marketplaces, Storefront | Capability off; no backend ([deferred](../domain/deferred.md)) |

## Asks to design

| Ask | Why |
|---|---|
| A destructive colour; elevation for menus and dialogs; Dialog and form components; error and toast states | Destructive commands, confirms and errors need them |
| A motion rule | Home animates beyond the 120 ms rule |
| Page loader without invented Sales / AOV / Conversion numbers | Deferred data is hidden, never faked |
| Variant prices and per-location stock shown as saving on their own | They save separately (`product.updateVariant`, immediate `inventory.adjust`), not with the product |
| A Commands group in ⌘K, with disabled rows showing their reason | The palette runs commands |
| A jobs indicator in the top bar | Job results can't go to the bell while notifications are off |
| Login screens for unverified email and forced password change; drop "Forgot password" or add a flow | The Login machine has those branches; the gateway has no reset endpoint |
| A leave-guard dialog | Every editor asks before discarding |
| Status tabs Active / Draft / Archived on the product list | The list has those views |
| Critical button; info and neutral badge tones; overlay, focus-ring and page-background tokens; skeleton fill; AI-filled field highlight | Confirms, statuses (Draft, Archived), sheets and dialogs, keyboard focus, assistant |
| Contrast to AA: warning text (2.4:1), blue on tint (4.2:1), inactive tab (3.7:1) | WCAG 2.2 AA (d29) |
| Date picker, rich text, stepper, timeline, banner, drawer, dropdown, toast, filters, sort, column picker, bulk bar, proposal card | Used by v1 screens, not yet designed |

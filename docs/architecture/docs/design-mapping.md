# Design mapping

[← Architecture](../README.md)

How the Ratio design (Login, Home, Products, Product detail, Settings) maps onto the architecture. Orders, customers and other sections are in the nav but not designed yet.

## Features vs today

| Area | In the design | gk-pages today |
|---|---|---|
| Login | Email + password → OTP, Google sign-in | Dashboard shell |
| Shell | 2-level nav with counts, ⌘K across resources, notifications, store switcher, Arya panel | Dashboard shell; no search, notifications or AI |
| Home | Setup checklist (product, checkout, domain, shipping) | — |
| Products list | Insights strip, status tabs, search and filter, selection, import/export, quick add | Exists |
| Product editor | One page, one save: pricing, variant options, stock per location, shipping, SEO, sales channels, custom fields | Exists, split across large components |
| Settings sheet | General, checkout, shipping zones, domains, apps, field definitions | Custom fields and apps only |

## Where it lands

| Design element | v1 |
|---|---|
| Products list, product editor | [product resource](../resources/defs/product.md), [catalog commands](../commands/defs/catalog.md) |
| Inline "Create definition" | `fieldDefinition.create` |
| Quick add | `product.create` via quick create |
| Import / export | bulk-ops jobs |
| ⌘K, nav counts, store switcher, assistant panel | [chrome](../surfaces/chrome.md) |
| Insights strip, gift cards, checkout, shipping zones, domains, bank account, notification feed, onboarding checklist | Capability off; no backend ([deferred](../domain/deferred.md)) |

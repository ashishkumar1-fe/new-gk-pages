# Routing

[← Surfaces](README.md)

| # | Decision |
|---|---|
| d09 | URLs are `/store/$storeId/…`. The `/gk-pages` prefix only existed for single-spa mounting and is dropped. |
| d10 | Old dashboard URLs redirect at cutover. |

## Structure

```
/login
/pick-store                            store picker (Session machine)
/no-access
/store/$storeId                        home
/store/$storeId/products               list      ┐ generated from the
/store/$storeId/products/$id           editor    │ resources registry
/store/$storeId/products/new                     ┘
/store/$storeId/orders/$id/edit        flow (hand-written)
/store/$storeId/apps/$handle/*         embedded app
/store/$storeId/…?settings=<tab>       settings sheet over any page
*                                      404
```

All resource routes ([resources registry](../resources/registry.md)) live under `/store/$storeId`. Keeping the store in the URL keeps deep links, shared links and one-store-per-tab working. Templates and page states: [pages](pages.md).

- Document title: `{record} · {page} · {store}`.
- Page views go to PostHog by route template (`/store/$storeId/orders/$id`), never with raw ids.

## Old URLs

```
dashboard.gokwik.in/gk-pages/store/195qow8rsryx/products  ──▶  <ratio>.gokwik.in/store/195qow8rsryx/products
```

A rule at the dashboard host's edge (302, then 301 once cutover holds: [delivery](../operations/delivery.md#cutover)) maps `/gk-pages/*` to the same path on the new domain, keeping query and hash. It stays for a few months after cutover, then is removed.

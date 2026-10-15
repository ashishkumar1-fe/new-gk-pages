# Routing

[← Platform](README.md)

| # | Decision |
|---|---|
| d09 | URLs are `/store/:storeId/…`. The `/gk-pages` prefix only existed for single-spa mounting and is dropped. |
| d10 | Old dashboard URLs redirect at cutover. |

## Structure

```
/login
/store/:storeId                         home
/store/:storeId/products                list
/store/:storeId/products/:id            editor
/store/:storeId/products/new
/store/:storeId/orders/:id/edit
…
```

All resource routes ([resources registry](../resources/registry.md)) live under `/store/:storeId`. Keeping the store in the URL keeps deep links, shared links and one-store-per-tab working.

## Old URLs

```
dashboard.gokwik.in/gk-pages/store/7/products  ──301──▶  <ratio>.gokwik.in/store/7/products
```

A redirect stub in the dashboard maps `/gk-pages/*` to the same path on the new domain. It stays for a few months after cutover, then is removed.

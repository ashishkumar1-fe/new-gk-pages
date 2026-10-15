# Identity and access

[← Platform](README.md)

| # | Decision |
|---|---|
| d01 | The product is **Ratio**. |
| d02 | Domain deferred. Constraint: a `gokwik.in` subdomain ([auth-session](auth-session.md#why-a-gokwikin-subdomain)). |
| d03 | Who gets it: the existing per-merchant flag `selected_products.pages` is the single source of truth. All-at-once vs phased rollout is decided with the cutover. |
| d04 | Entitlement: the same flag, enforced by a route guard. |
| d08 | Permissions: the existing model, from the same user-details API. |
| d36 | Staff and roles UI: out of scope; staff stay managed in the existing system. |

## Entitlement

```
GET /api/dashboard/user/details
  → data.config.selected_products: { pages: true, checkout, rto, … }   // set per merchant by the internal team
```

| `pages` | Result |
|---|---|
| `true` | App opens |
| `false` | Every route blocked; "You don't have access. Talk to sales." screen |

- Today the flag only shows the sidebar item (`dashboard-ui` `sideNav/index.tsx:1476`, `SideNavMerger.tsx:667`); gk-pages still mounts by URL.
- Ratio's guard makes it real: it runs in the boot flow ([auth-session](auth-session.md#boot-flow)), before any route renders.

## Permissions

- Permission keys are declared on every command and resource ([commands registry](../commands/registry.md#permissions)).
- gk-pages `main` checks permissions only in Ratio Reports (`validatePermission(PermissionValues.reports.view)`, `reports.viewUnmaskedReport`). Those two checks carry over; everything else stays unchecked in v1, as today.
- The permission list comes with user details; `can(permission)` reads it. Enforcing the declared keys everywhere is one switch once roles are defined.

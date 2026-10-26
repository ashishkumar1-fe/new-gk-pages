# Chrome

[← Surfaces](README.md)

| # | Decision |
|---|---|
| d13 | No breadcrumbs; back and previous / next replace them ([pages](pages.md#templates)). |
| d14 | Navigation structure is product's call; the sidebar supports exactly two levels. |
| d15 | Own component kit, no antd ([UI kit](../docs/ui-kit.md)). |
| d16 | v1 shell: the pieces below. Notifications and support widget later. |

## Pieces

| Piece | v1 |
|---|---|
| Sidebar | Two levels, groups from resource `nav` ([resources registry](../resources/registry.md)); Orders count badge. An item whose capability is off or permission missing is hidden, as for commands |
| Top bar | Search, help, assistant button, store menu (switch store, store settings, account, shortcuts, logout); the save bar replaces the search while a form is dirty (design) |
| Search (⌘K) | Groups: Recent · Commands · records (Products, Orders, Customers) · Settings and pages. Records via the list APIs' search params, 2–3 resources in parallel (no backend search, d41). Order and matching: [commands › surfaces](../commands/surfaces.md#k-palette) |
| Store switcher | In the store menu; lists merchants from user details; the leave guard asks first, then the Session machine switches and lands on the new store's home ([auth-session](../platform/auth-session.md#merchant-context)) |
| Jobs indicator | Running jobs from the Jobs machine; a toast when one ends |
| Settings sheet | Opens over any page as `?settings=<tab>`; tabs: General, Apps, Metafields (field definitions), with search over them; Checkout, Shipping, Domains are capability off |
| Assistant panel | Right-side panel, stays open across pages; open by default on Home ([assistant](../docs/assistant.md)) |
| Notifications | Capability off until an admin feed API exists |

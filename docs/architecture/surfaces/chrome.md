# Chrome

[← Surfaces](README.md)

| # | Decision |
|---|---|
| d13 | No breadcrumbs. Today's 11 `updateBreadcrumbs` calls are removed; navigation replaces them. |
| d14 | Navigation structure is product's call; the sidebar supports exactly two levels. |
| d15 | Ratio builds its own component kit on Radix + Tailwind; gokwik-ui-kit / antd are not carried over ([UI kit](../docs/ui-kit.md)). The largest scope item: every gk-pages form, table and modal leans on antd. |
| d16 | v1 shell: global search, store switcher, profile and logout. Notifications and support widget later. |

## Pieces

| Piece | v1 |
|---|---|
| Sidebar | Two levels, groups from resource `nav` ([resources registry](../resources/registry.md)); Orders count badge |
| Top bar | Search, store switcher, profile menu (store settings, account, shortcuts, logout), assistant button |
| Search (⌘K) | Pages and commands from the registries; records via the list APIs' search params, 2–3 resources in parallel (no backend search, d41); recent items |
| Store switcher | Lists merchants from user details; switching clears merchant-scoped state ([auth-session](../platform/auth-session.md#merchant-context)) |
| Jobs indicator | Running import / export jobs |
| Settings sheet | Opens over any page; tab in the URL |
| Assistant panel | Right-side panel, stays open across pages ([assistant](../docs/assistant.md)) |
| Notifications | Capability off until an admin feed API exists |

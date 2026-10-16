# Pages

[← Surfaces](README.md)

Pages are built from contracts, not written per resource. A resource's config picks the template; machines drive flows.

## Templates

| Template | Built from | Layout |
|---|---|---|
| List | [`ListConfig`](../resources/list.md) | Header (title, page commands) · view tabs · search and filter · table · bulk bar on selection · pagination |
| Editor | [`EditorConfig`](../resources/editor.md) | Header · main 65 / aside 35 sections · save bar |
| Detail | [`DetailConfig`](../resources/contract.md) | Header with previous / next · read sections · record commands (orders) |
| Flow | a [machine](../docs/machines.md) hook | Its own route (wizard, order edit), a drawer (refund) or a dialog (import, export) |

- List, editor and detail routes are generated from the [resources registry](../resources/registry.md); flow and settings routes are written by hand.
- A section or cell given as a `ComponentId` is resolved in `features/components.ts`, the one map from id to React component. Extension targets render there too ([extensions](../docs/extensions.md)).
- Header: title, status, record commands ([commands › surfaces](../commands/surfaces.md)). Back returns to the list with its URL filters (no breadcrumbs, d13). On detail pages `j` / `k` move to the previous / next record.
- Money and dates render only through domain formatters ([conventions](../domain/conventions.md)).

## Machines on screen

| Machine | Surface |
|---|---|
| Session | Full-page loader while booting; `/login`; `/pick-store`; `/no-access` |
| Login | `/login`: credentials, code, unverified email, password change |
| Jobs | Top-bar jobs indicator and a toast when a job ends |
| Assistant | Right panel ([assistant](../docs/assistant.md)) |
| Record save | Save bar in the top bar (design) |
| Refund | Drawer on order detail |
| Order edit session | `/orders/$id/edit`; takeover dialog; waiting banner |
| Discount wizard | `/discounts/new`, `/discounts/$id`; finish dialog |
| Draft payment watch | Banner on the draft order |
| Import, Export | Dialog opened by the list's page commands |

## Page states

| State | Shows |
|---|---|
| Loading | The template's skeleton; never "not found" while loading |
| List empty, filtered empty, error | [list states](../resources/list.md#states) |
| Record not found | Not-found message with a link back to the list |
| No access (403 or missing permission) | Permission screen naming what is needed |
| Store in the URL not allowed for the user | `/no-access`; an allowed store switches first ([auth-session](../platform/auth-session.md#merchant-context)) |
| Unknown route | 404 page with a link home |
| Crash | [error boundaries](../operations/quality.md#error-boundaries) |

## Layout

- Desktop: the assistant panel pushes the page; the settings sheet covers it. One toast region.
- Mobile: the sidebar becomes a drawer; search and the assistant open full screen. Pages stay desktop-first and tables scroll sideways.

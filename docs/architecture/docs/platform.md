# Platform

[← Architecture](../README.md)

Everything the dashboard shell used to provide. No feature code lives here.

## Pieces

| Piece | Responsibility |
|---|---|
| **Login** | Email + password, then a 6-digit OTP; Google sign-in. Runs as a machine. |
| **Session** | Login via gateway, which sets an httpOnly cookie. JS never sees the token. A boot check decides logged-in vs login screen. |
| **API client** | One `apiClient` (fetch-based): service base URL, `credentials: 'include'`, merchant headers (`merchant-mid`, `gk-merchant-id`), staff identity in write bodies (per-service casing, see [schema conventions](../schema/conventions.md#write-metadata)), typed errors. |
| **Uploads** | Media uses presign → upload to storage → confirm; the storage upload does not go through `apiClient` (no cookies, no merchant headers). |
| **Merchant context** | After login, fetch user details → merchant picker → selected merchant id. Exposed through `useMerchant()`. |
| **Entitlement** | Route guard: no `pages` product → "no access" screen. |
| **Permissions** | `can(permission)` helper. Keys are declared on commands and resources; enforcement is off in v1 (no staff roles), the backend stays the authority. |
| **Telemetry** | Sentry (errors), PostHog (events, flags, Web Vitals, command audit events). Route-level error boundaries. |
| **Store switcher** | Switching merchant clears the query cache (keys start with merchant ID) and resets merchant-scoped UI state. |
| **Search (⌘K)** | Pages and commands, plus records from resources with search enabled: products, collections, orders, customers. Recent items per user. |
| **Jobs indicator** | Top-bar indicator for running import/export jobs ([bulk-ops](../commands/defs/bulk-ops.md#job-tracking)). |
| **Notifications** | Bell with an admin feed: capability off until a feed API exists ([deferred #12](../schema/deferred.md)). |
| **App chrome** | Sidebar (2-level, Orders count badge), top bar, settings sheet, assistant panel slot. |

## Services

Base URLs come from env, read only in `platform/config`.

| Token | Env | Serves |
|---|---|---|
| `{BASE}` | `REACT_APP_BASE_URL` | Item service: products, variants, collections, taxonomy, lookups, price schedules, content AI, reviews, discount code files |
| `{INVENTORY}` | `REACT_APP_INVENTORY_API_URL` | Inventory, locations, suppliers, purchase orders, transfers, custom fields, metaobjects |
| `{ORDER}` | `REACT_APP_ORDER_BASE_URL` | Orders, draft orders, refunds, order tags |
| `{TIMELINE}` | `REACT_APP_TIMELINE_SERVICE_API_URL` | Timeline events |
| `{CUSTOMER}` | `REACT_APP_CUSTOMER_BASE_URL` | Customers, addresses, segments, customer export |
| `{KWIKPASS_CUSTOMER}` | `KWIKPASS_CUSTOMER_API_URL` | Older customer paths (`/v1/admin/customers/...`): contact edit from orders, comments |
| `{DISCOUNT}` | `REACT_APP_KWIKPASS_DISCOUNT_API_URL` | Discounts, discount sets, redeem, discount AI sessions |
| `{BULK_OPS}` | `REACT_APP_BULK_OPS_API_URL` | Import / export jobs |
| `{RESOURCES}` | `OS_RESOURCE_API_URL` | Media library, uploads |
| `{APPS}` | `MERCHANT_APP_STORE_API_URL` | Apps, extensions |

Paths in [command definitions](../commands/registry.md) are relative to the base stated at the top of each file; paths starting with a token are full.

## Boot flow

```
checking session ─┬─ no session ──▶ login ──▶ checking session
                  └─ session ─────▶ loading user ─▶ picking merchant ─▶ checking entitlement ─┬─▶ ready
                                                                                               └─▶ no access
```

## Rules

- Feature code calls services through `api/<service>` modules, never `fetch` directly.
- Merchant headers are attached in exactly one place: the client.
- No env reads outside `platform/config`.

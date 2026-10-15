# Gateway APIs

[← Architecture](../README.md)

What each backend service accepts and returns, inferred from how gk-pages `main` (f41ed92b) calls it. Bottom of the stack: everything here is backend, unchanged by Ratio.

## Every request

| | |
|---|---|
| Auth | httpOnly `token` cookie on `.gokwik.in`, sent with `credentials: 'include'` ([auth](../platform/auth-session.md)) |
| Merchant | headers `merchant-mid`, `gk-merchant-id` (the merchant's `m_id`) |
| Staff | os-order writes: `staff_id`, `staff_name` in the body; os-customer: `staffId`, `staffName` |

## Services

| Page | Service | Base | Endpoints used |
|---|---|---|---|
| [dashboard](dashboard.md) | Login, session, user details, merchant config | `{BASE}/api/dashboard` | 20 |
| [os-order](os-order.md) | Orders, edit session, fulfilment, refunds, drafts, tags, timeline | `{ORDER}` | 54 |
| [item](item.md) | Products, variants, options, collections, lookups, price schedules | `{BASE}` | 41 |
| [inventory](inventory.md) | v3 stock and locations, v1 import/export, POs, transfers, custom fields | `{INVENTORY}` | 76 |
| [os-customer](os-customer.md) | Customers, addresses, segments, export; KwikPass customer host | `{CUSTOMER}`, `{KWIKPASS_CUSTOMER}` | 29 |
| [discount](discount.md) | Discount V2 (gateway); os-discount: sets, AI sessions, redeem | `{BASE}/dashboard/v2/discount`, `{DISCOUNT}` | 16 + V2 |
| [bulk-ops](bulk-ops.md) | Import and export jobs | `{BULK_OPS}` | 9 |
| [media-apps](media-apps.md) | Media library and uploads, app store | `{RESOURCES}`, `{APPS}` | 18 |

Tokens → env vars: [API client › services](../platform/api-client.md#services).

Not in v1, not documented: analytics, session analytics, search-discovery, loyalty, mega-menu, reviews, A/B testing, visual editor, brand mappings.

## Reading a page

- One table per group: `Endpoint | Request | Response`. Paths are relative to the base in the page header.
- Shapes use the **wire** names and types exactly as sent (snake_case where the service uses it).
- `?` after a field = inferred from how gk-pages reads it, not from a typed interface or captured response.
- **Source** line per group = the gk-pages files the shapes come from.
- Confirmed shapes replace inferred ones as backend specs or sandbox captures arrive ([open questions](../docs/open-questions.md) #20).

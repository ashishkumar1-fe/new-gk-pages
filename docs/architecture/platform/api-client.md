# API client

[← Platform](README.md)

| # | Decision |
|---|---|
| d11 | Ratio owns the API client in `src/platform`; it replaces `makeAPICall` from `@gokwik/utilities`. The tracker kept `makeAPICall`'s signature for in-place conversion; in the new codebase ([ADR 0002](../adr/0002-new-codebase.md)) the client has its own typed API and is called only from `api/<service>` modules. |
| d31 | React Query conventions: keys `[domain, storeId, params]` (storeId mandatory), invalidate on mutation; Zod at the boundary. |

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

## What the client does

| Concern | Behaviour |
|---|---|
| Credentials | `credentials: 'include'` on every call (cookie session) |
| Merchant | `merchant-mid` and `gk-merchant-id` headers from the selected merchant |
| Staff identity | Added to write bodies in each service's casing ([schema conventions](../schema/conventions.md#write-metadata)) |
| Errors | Typed errors mapped to the command result type ([execution](../commands/execution.md#errors-from-the-server)) |
| Uploads | Presign → upload to storage → confirm. The storage upload bypasses the client (no cookie, no merchant headers) |

Feature code calls services through `api/<service>` modules (client + transformer), never `fetch` directly ([structure](../docs/structure.md)).

## Query keys

```ts
[domain, storeId, ...rest]     // ['product', '7', 'list', params], ['order', '7', 'detail', id]
```

`storeId` is mandatory in every key: it is what prevents one merchant's cache from showing in another. Per-resource key factories: [data access](../resources/data-access.md#query-keys).

## Validation at the boundary

Every response is parsed with its schema, the same way, in the service's API module ([ADR 0004](../adr/0004-validate-every-response.md)):

| Case | Treatment |
|---|---|
| Shape matches | Transformed into the domain object |
| Shape drift (unknown, missing or wrong-typed field) | Zod `safeParse`; logged to Sentry with endpoint and field path; the data still renders |
| Money values | Strict parse; a bad value stops the render with an error |

The tracker (d31) limited this to critical endpoints because it assumed converting gk-pages in place. In the new codebase every resource already has a schema, so coverage is the default, not extra work.

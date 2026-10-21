# API client

[← Platform](README.md)

| # | Decision |
|---|---|
| d11 | Ratio owns the HTTP client in `src/platform`; it replaces `makeAPICall` from `@gokwik/utilities`. The tracker kept `makeAPICall`'s signature for in-place conversion; the new codebase ([ADR 0002](../adr/0002-new-codebase.md)) gives it its own typed API, called only from `api/<service>` modules. |
| d31 | Query keys `[domain, storeId, …]` ([data access](../resources/data-access.md#query-keys)); validation at the boundary ([ADR 0004](../adr/0004-validate-every-response.md)). |

## Base URLs

Read only in `platform/config`. What each service serves: [gateway](../gateway/README.md#services).

| Token | Env |
|---|---|
| `{BASE}` | `REACT_APP_BASE_URL` (gateway; also dashboard APIs and Discount V2) |
| `{ORDER}` | `REACT_APP_ORDER_BASE_URL` |
| `{INVENTORY}` | `REACT_APP_INVENTORY_API_URL` |
| `{CUSTOMER}` | `REACT_APP_CUSTOMER_BASE_URL` |
| `{KWIKPASS_CUSTOMER}` | `REACT_APP_KWIKPASS_CUSTOMER_API_URL` |
| `{DISCOUNT}` | `REACT_APP_KWIKPASS_DISCOUNT_API_URL` |
| `{TIMELINE}` | `REACT_APP_TIMELINE_SERVICE_API_URL` |
| `{BULK_OPS}` | `REACT_APP_BULK_OPS_API_URL` |
| `{RESOURCES}` | `REACT_APP_OS_RESOURCE_API_URL` |
| `{APPS}` | `REACT_APP_MERCHANT_APP_STORE_API_URL` |

Names as in gk-pages; Ratio reads them with Vite's `VITE_` prefix, and only allowlisted keys reach the bundle ([quality](../operations/quality.md#security-v1)).

URL = base + path, joined verbatim. Some bases already end in `/api`, so real paths can read `…/api/api/v1/…` (os-order); that is correct, and the client never collapses it. Each service module owns its path prefix.

## What the client does

| Concern | Behaviour |
|---|---|
| Credentials | `credentials: 'include'` on every call (cookie session) |
| Merchant | `merchant-mid` and `gk-merchant-id` = current `storeId` |
| Other headers | None, except an idempotency header a service needs; anything else fails the gateway CORS preflight ([access](../gateway/access.md#cors-change-platform-team)) |
| Idempotency | `newIdempotencyKey()` (UUID v4, one per attempt); the service module shapes it and puts it where its service wants it (refunds: `refund-<orderId>-<uuid>`, ≤ 64 chars) ([commands](../commands/execution.md#idempotency-and-retry)) |
| Response | Returns status and body as-is; envelopes differ per service, so unwrapping is the service module's job |
| Request id | `X-Request-Id` from every response goes into a Sentry breadcrumb (method, path, status) and into `ApiError` |
| Errors | Non-2xx → `ApiError` (below). `401` also emits `session-expired`, which sends the Session machine to login |
| Uploads | Presigned storage PUTs bypass the client (no cookie, no merchant headers) |

```ts
interface ApiError {
  status: number;
  code?: string;          // first of: body.code, body.error_code, body.errors[0].code (v3)
  message: string;        // body.message; a Nest string[] is joined
  requestId?: string;     // X-Request-Id, for backend logs
  raw: unknown;           // full body, for the service module
}
```

Not carried over from today's `makeAPICall` (read from the live bundle by Ashish): errors returned as data, security headers sent as request headers, the duplicate merchant header, the global loader event, the whole build env inlined into the bundle. Its internal-user write block and `mode` param: [open question 25](../docs/open-questions.md).

**Not the client's job** (layer 3, `api/<service>/`): envelopes, `success: false` in a 2xx body, scoping params (`?storeId=`, `merchant_id`, `?merchantId=`), staff fields in write bodies, case conversion, schema validation ([data flow](../service-api/README.md#data-flow-transform-once-never-mutate)).

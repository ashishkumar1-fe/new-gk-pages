# Gateway

[← Gateway](README.md)

| # | Decision |
|---|---|
| d17 | One gateway config opens the new origin; inner services need no change. |
| d18 | Calls that bypass the gateway are audited and smoke-tested from the new origin before launch. |

## CORS change (platform team)

```
allowed_origins   += https://<ratio>.gokwik.in       (exact origin; wildcards don't work with credentials)
Access-Control-Allow-Credentials: true
allowed_headers   += gk-merchant-id, merchant-mid, idempotency-key, x-idempotency-key
expose_headers    += x-request-id
```

- Auth (cookie) and CORS are both enforced at the gateway, so this one change opens every gateway-routed API.
- The idempotency headers are needed by v3 inventory writes and refunds ([inventory](inventory.md), [os-order](os-order.md)). Any other custom header fails the preflight, as it does today.
- `X-Request-Id` is already generated per call but not exposed, so JavaScript can't read it; exposing it lets a frontend report point at the backend log line.

## Bypass audit

| Step | |
|---|---|
| 1 | List every call per service from the [service pages](README.md#services) |
| 2 | Tag gateway-routed (safe) vs bypass: direct service hosts, storage uploads, third-party endpoints |
| 3 | Smoke-test the bypass list from the new origin on staging: login → products → one save → one upload |
| 4 | Backend fixes what fails |

Known candidates: presigned media uploads, the separate customer host (`{KWIKPASS_CUSTOMER}`). Discount V2 already goes through the gateway (`{BASE}/dashboard/v2/discount`).

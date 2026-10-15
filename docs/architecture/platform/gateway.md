# Gateway

[← Platform](README.md)

| # | Decision |
|---|---|
| d17 | One gateway config opens the new origin; inner services need no change. |
| d18 | Calls that bypass the gateway are audited and smoke-tested from the new origin before launch. |

## CORS change (platform team)

```
allowed_origins   += https://<ratio>.gokwik.in       (exact origin; wildcards don't work with credentials)
Access-Control-Allow-Credentials: true
allowed_headers   += gk-merchant-id, merchant-mid
```

Auth (cookie) and CORS are both enforced at the gateway, so this one change opens every gateway-routed API.

## Bypass audit

| Step | |
|---|---|
| 1 | List every call per service from the [services table](api-client.md#services) |
| 2 | Tag gateway-routed (safe) vs bypass: direct service hosts, storage uploads, third-party endpoints |
| 3 | Smoke-test the bypass list from the new origin on staging: login → products → one save → one upload |
| 4 | Backend fixes what fails |

Known candidates: presigned media uploads, discount service calls on a direct host (the discount V2 CORS issue), the separate customer host (`{KWIKPASS_CUSTOMER}`).

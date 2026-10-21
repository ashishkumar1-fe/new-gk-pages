# Platform core (layer 1)

[← Architecture](../README.md)

Plumbing every layer above uses; no feature code. Imports nothing from the app ([structure](../docs/structure.md#layers-and-imports)).

| Module (`src/platform/`) | Does | Page |
|---|---|---|
| `http` | One client for every service call: cookie, merchant headers, errors | [api-client.md](api-client.md) |
| `config` | Env and service base URLs, read only here | [api-client.md](api-client.md#base-urls) |
| `session` | Who is logged in; login, OTP, logout calls | [auth-session.md](auth-session.md) |
| `merchant` | Current `storeId`, switching store | [auth-session.md](auth-session.md#merchant-context) |
| `permissions` | Entitlement flag, `can(scope)` | [identity-access.md](identity-access.md) |
| `query` | Query client and [cache policy](../resources/data-access.md#cache-policy) | — |
| `telemetry` | Sentry, PostHog | [quality](../operations/quality.md#errors) |
| `tokens` | Short-lived tokens for embedded tools and apps, in memory per store | [auth-session.md](auth-session.md#app-tokens) |
| `embed` | Typed postMessage with iframes: origin and source checks, handshake, request ids | [extensions](../docs/extensions.md#bridge) |

Login and Session machines are orchestration ([machines](../docs/machines.md)); chrome is [surfaces](../surfaces/README.md); backend contracts are in [gateway](../gateway/README.md).

What this layer replaces from the dashboard shell (gk-pages `main`, 2026-10-14):

| Borrowed | Usage | Replaced by |
|---|---|---|
| `@gokwik/utilities` (import-mapped at runtime) | 9 exports: `makeAPICall` (44 imports), `dashboardStore` (18), `updateBreadcrumbs` (11 calls), `validatePermission` (2), `filterStore` (2), date helpers (3), `logUserEvent`, `downloadFromURL` | [API client](api-client.md), [merchant context](auth-session.md#merchant-context), [chrome](../surfaces/chrome.md) |
| `sessionStorage['merchant-mid']` | 79 reads and writes | [merchant context](auth-session.md#merchant-context) |
| Import-map entry `@gokwik/gk-pages` | 1 | Removed at cutover ([delivery](../operations/delivery.md#cutover)) |
| Single-spa error boundary | `return null` on crash | Route error boundaries ([quality](../operations/quality.md#error-boundaries)) |

# Quality

[← Operations](README.md)

| # | Decision |
|---|---|
| d22 | Sentry for errors; alerts through the existing Sentry → OpsGuard pipe. |
| d23 | Route-level code splitting; initial-bundle budget enforced in CI. |
| d24 | Security headers in one CloudFront policy; full CSP later. |
| d25 | One synthetic uptime check; CDN alarms; alerts to OpsGuard. |
| d26 | Route error boundaries; never a blank screen. |
| d27 | PostHog feature flags for risky features and rollout. |
| d28 | Blocking CI gates and a staging smoke test ([delivery](delivery.md#pipeline)). |
| d29 | Every screen ships loading, empty and error states; keyboard, focus, AA contrast ([page states](../surfaces/pages.md#page-states), [UI kit](../docs/ui-kit.md#rules)). |
| d30 | Web Vitals via PostHog autocapture only. |
| d33 | Image transforms, lazy loading, font loading, no layout shift. |
| d35 | Runbook, decision records, tracking plan, PII policy. |

## Errors

- Sentry (already in the org), new project. Route boundaries call `captureException`.
- Source maps: built hidden, uploaded by CI, removed from the deployed bundle.
- Tags: release (`ratio@<version>`), merchant ID, route. No PII.
- Reported: 5xx, network errors, schema drift, boundary crashes. Not reported: 4xx `ApiError`s, which are results.
- Release health checked after each deploy; a regression is a rollback.
- Session replay in PostHog; Microsoft Clarity for heatmaps, rage and dead clicks (d45). Inputs masked in both, recording sampled; Sentry replay off.

## Bug evidence (d44, d45)

- **Support box** on every error screen: a short Error ID (also a Sentry tag), route, filters, time, version, store, the last failed call (method, path, status, request id prefix) and the last few steps in words; Copy button. Never stack traces or request bodies. "Report a problem" in the help menu opens the same box.
- **Passbook:** every `runCommand` leaves a breadcrumb (command id, target, result), so a replay plus the passbook show which command a button really ran.
- **Invariants** (a refund can't exceed the order total; saved data equals what was sent) report to Sentry without crashing.

## Error boundaries

Today gk-pages' single-spa error boundary returns `null` (`src/gokwik-gk-pages.tsx`): a crash makes the section disappear silently. Ratio:

| Level | Shows |
|---|---|
| Route / section | "Something went wrong here" with Retry; rest of the app keeps working; reported to Sentry |
| App | One crash page with Reload |
| Extension | Per-extension boundary ([extensions](../docs/extensions.md)) |

## Security (v1)

One CloudFront response-headers policy:

| Header | Value |
|---|---|
| `Strict-Transport-Security` | on |
| `Content-Security-Policy: frame-ancestors 'none'` + `X-Frame-Options: DENY` | no framing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | camera, microphone, geolocation off |
| `X-Content-Type-Options` | `nosniff` |

Plus: no secrets in the bundle (public-env allowlist in the build config), no public source maps; login rate limit to confirm with backend. Full CSP rolls out in report-only mode after launch, reporting to Sentry, then enforced.

Embedded apps run in iframes inside Ratio; `frame-ancestors 'none'` applies to Ratio itself being framed, not to the apps it frames.

## Uptime

One external check every minute (login page + one API round trip), CloudFront error alarms, alerts to OpsGuard. API latency stays with backend on-call.

## Feature flags

| Kind | What | Lifetime |
|---|---|---|
| Release flag | PostHog; percentage or per merchant (group `storeId`); kill switch: rollback is a toggle | Removed once stable at 100% |
| Capability | A feature without a backend ([resources](../resources/contract.md), [commands](../commands/contract.md)) | Until the API exists |

- Flags load at boot, before routes; every flag has a safe default for when PostHog is blocked (calls go through a proxy).
- Entitlement stays `selected_products.pages` (d03), never a flag.

## Performance

- CDN image transforms (resize, WebP / AVIF) for list thumbnails, native lazy loading, `font-display: swap` + preconnect, skeleton-first loading with no layout shift.

## Team documents

| Document | When |
|---|---|
| Runbook | before launch |
| Tracking plan (`object_verb` snake_case event names) | before the first event |
| PII masking policy | before launch |

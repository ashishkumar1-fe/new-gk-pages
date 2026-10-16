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
| d29 | Every screen ships loading, empty and error states; keyboard, focus, AA contrast. |
| d30 | Web Vitals via PostHog autocapture only. |
| d33 | Image transforms, lazy loading, font loading, no layout shift. |
| d35 | Runbook, decision records, tracking plan, PII policy. |

## Errors

- Sentry (already in the org), new project. Route boundaries call `captureException`.
- Source maps: built hidden, uploaded by CI, removed from the deployed bundle.
- Tags: release (`ratio@<version>`), merchant ID, route. No PII.
- Alerts only for new errors and spikes, through the existing Sentry → OpsGuard pipe.
- Session replay in one tool only.

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

Plus: no secrets in the bundle (public-env allowlist in the build config), no public source maps; login rate limit to confirm with backend. Full CSP rolls out in report-only mode after launch, then enforced.

Embedded apps run in iframes inside Ratio; `frame-ancestors 'none'` applies to Ratio itself being framed, not to the apps it frames.

## Uptime

One external check every minute (login page + one API round trip), CloudFront error alarms, alerts to OpsGuard. API latency stays with backend on-call.

## Feature flags

PostHog flags:

- Percentage and per-merchant rollout.
- Kill switches: rollback is a toggle, not a deploy. Launch itself can be a flag.
- Removed once a feature is stable at 100%.
- Features without a backend use the same mechanism (capability flags in [resources](../resources/contract.md) and [commands](../commands/contract.md)).

## Performance

- Route-level code splitting; initial-bundle budget fails the PR when exceeded.
- CDN image transforms (resize, WebP / AVIF) for list thumbnails, native lazy loading, `font-display: swap` + preconnect, skeleton-first loading with no layout shift.

## UX baseline

Every screen: loading skeleton, empty state with an action, error state with retry; keyboard navigation, visible focus, AA contrast, inline form errors. Checked in the PR checklist.

## Team documents

| Document | When |
|---|---|
| Runbook | before launch |
| Decision records | [adr/](../adr/README.md) |
| Tracking plan (`object_verb` snake_case event names) | before the first event |
| PII masking policy | before launch |

They live in this repo for now (the tracker said Confluence only); the folder can move later as a whole ([ADR 0002](../adr/0002-new-codebase.md#docs)).

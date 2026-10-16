# 05 — Quality & operations

[← Engineering](README.md) · Decisions: d22–d30, d33

A standalone product owns its own failures: errors reach us before merchants do, nothing renders as a blank screen, and the basics are locked at the CDN.

## Errors (d22, d26)

- **Sentry** (already in the org). Every route has an **ErrorBoundary** with a retry card that calls `captureException` — a crashed section never takes the page down. One global crash page with reload. **Blank screens are banned** (the old single-spa `errorBoundary: () => null` pattern dies here).
- CI uploads **source maps** to Sentry (`build.sourcemap: 'hidden'`) and strips them from the deployed bundle — readable `ProductForm.tsx:142` traces for us, no source disclosure on the CDN.
- Releases tagged `ratio@<version>`; merchant id + route as context; **no PII** in events or breadcrumbs.
- **Alerts → OpsGuard** through the org's existing Sentry→OpsGuard pipe — add the project to the pipe, don't build a new one. Rules fire only on **new issues** and **spikes/affected-user thresholds**; noisy alerts train people to ignore alerts.
- PostHog handles events, feature flags and Web Vitals. **Session replay lives in exactly one tool**; Sentry replay stays off.

## Security v1 (d24) — one CloudFront response-headers policy

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: frame-ancestors 'none'      ← clickjacking; one directive, not full CSP
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Plus: no secrets in the bundle (public-env allowlist in the build config), no public source maps, login rate-limit confirmed with backend. **Full CSP is deferred, not deleted:** after launch, ship `Content-Security-Policy-Report-Only`, watch reports (PostHog/uploads/visual-editor will surface their endpoints), then enforce. The old dashboard has CSP today — shipping without a plan would be an audit finding.

## Uptime & vitals (d25, d30)

- One external synthetic check per minute (login page + one API round-trip) + CDN error alarms → the same OpsGuard pipe, with a written owner.
- **API-latency SLOs belong to backend on-call** — we do not duplicate them.
- **Web Vitals:** PostHog autocapture on, nothing more — no dashboards, no alerting. The data exists for the day someone says "it feels slow" (bundle parse, render and INP are invisible to backend monitoring).

## Performance & assets (d23, d33)

- Route-level code splitting (every page lazy); an **initial-bundle budget enforced in CI** — a budget that doesn't fail PRs doesn't exist.
- CDN image transforms (resize + webp/avif) for listing thumbnails; native lazy loading below the fold; `font-display: swap` + preconnect; **skeleton-first loading with zero layout shift**.

## UX baseline (d29)

Every screen ships skeleton / empty-with-CTA / error-with-retry / ready; keyboard navigation works; focus is visible; contrast meets AA; form errors are specific and in place. Enforced through the PR checklist and the scaffolder's page template.

# 06 — Release engineering

[← Engineering](README.md) · Decisions: d19, d21, d28, d32, d34

## CI gates (d28) — red locks the merge button

```
lint → tsc --noEmit → tests → bundle budget → npm audit (high/critical)
```

All blocking, branch protection on, no exceptions (including "the AI wrote it"). On staging, a **Playwright smoke** (login → merchant select → products list → one save) is the **deploy** gate. *(Proposed sequencing, not yet ratified: fix or quarantine any inherited failing suites before the gate switches on — a gate with known-red tests teaches people to ignore red.)*

## Preview deploys (d32)

Every PR gets a URL (`pr-43.preview…`): QA, design and product review from a link, zero local setup. Previews always point at the **QA backend**, never prod. Environment is baked at build time (per-env builds through the public-env allowlist) with a visible non-prod badge.

## Versioning (d32)

Git tag is the source of truth. CI stamps `__APP_VERSION__ = "1.4.0+<sha>"` into the bundle, creates the GitHub release, registers the Sentry release. "What is prod running?" is answered by a console line or any Sentry event. **Rollback = repoint to the previous version** — a deploy, not an investigation.

## Cache correctness (d32) — "hard refresh" is a bug

```
main.<contenthash>.js   → Cache-Control: max-age=31536000, immutable   (names change per deploy)
index.html              → Cache-Control: no-cache                      (always revalidated)
deploy                  → CDN invalidation of index.html
```

New deploy → new filenames → browsers fetch them automatically. If anyone is ever told to hard-refresh, this section was violated.

## Dependency hygiene (d34)

Renovate weekly auto-PRs (enabled once the repo settles — not in month one), `npm audit` as a CI gate, committed lockfile, and a one-page **browser-support matrix** that the Playwright smokes follow. Small regular upgrades instead of one painful yearly migration.

## Hosting & cutover (d19, d21)

S3/CloudFront SPA hosting — own `index.html`, all routes falling back to it. Cutover sequence:

1. New subdomain live + smoke test passes.
2. The old dashboard's GK Pages navigation becomes a **redirect** to the same path on the new domain.
3. The `@gokwik/gk-pages` import-map entry is removed from the root config.

**Rollback = restore the entry** — both stay deployable through the transition. Merchant rollout rides the `selected_products.pages` flag and can itself be a feature flag (phased).

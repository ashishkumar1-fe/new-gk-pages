# Ratio — Standalone Admin: Design Specification

> Status: **approved** (discovery + architecture review complete) · Owner: Ashish Kumar · 2026-10-16
> Decision record: 42 closed decisions ([architecture/discovery-decisions.md](../architecture/discovery-decisions.md)). System architecture: [architecture/](../architecture/README.md) (Aman Zaid, v0). Engineering standards: [engineering/](../engineering/README.md). Jira: INFN-3338.

## 1. Goal

Rebuild the merchant admin (today: `gk-pages`, a Single-SPA microfrontend inside the GoKwik dashboard) as **Ratio** — a standalone product with its own login, chrome and pipeline, modelled on the Shopify-admin experience, with an AI assistant on top of a contracts-based CRUD core. **The backend does not change**: same gateway, same services.

## 2. Non-negotiable constraints (verified in code)

1. **Domain must be a `gokwik.in` subdomain.** Auth is a gateway-set httpOnly cookie (`Domain=.gokwik.in`, effectively SameSite=Lax in prod); on a foreign domain the browser never attaches it — auth fails in every browser. On a subdomain, auth works with zero backend change.
2. **The frontend never touches a token** — `withCredentials: true` everywhere; session presence via `is_logged_in`/`me`.
3. **Entitlement = `selected_products.pages`** (from `GET user/details`), enforced by a real route guard (the old dashboard only hid a menu item).
4. **One gateway config unlocks the APIs:** exact origin + `Access-Control-Allow-Credentials` + merchant headers allowlisted; inner services untouched. Gateway-bypass calls (uploads, direct hosts) are audited and smoke-tested from the new origin before launch.

## 3. Architecture (summary — details in `architecture/`)

- **Layers, dependencies down only:** surfaces → contracts → logic → state → platform → gateway.
- **Contracts:** reads are `defineResource()`, writes are `defineCommand()`; one `runCommand()` execution path serves buttons, menus, bulk bar, shortcuts, ⌘K and the AI assistant. Screens never call write endpoints.
- **Scope (d41):** writes = 100% commands, no exceptions; the ~11 table+form entities = resource definitions; bespoke experiences (visual editor, analytics, onboarding) = normal feature code whose writes still go through commands. The registry is a plumber, not a UI generator — complex UIs are hand-built components plugged into definitions.
- **Flows:** XState v5 for 3+ step flows only (login, boot, record editor, refund, import, job tracker, assistant); one record-editor machine serves all entity editors; 2–3 machine authors, everyone else consumes hooks.
- **Stack:** Vite · React 18 · strict TS · TanStack Router/Query/Table · RHF + Zod · Zustand (UI flags only) · Radix + Tailwind tokens (own kit) · Sentry · PostHog · Vitest/Testing Library/MSW · Playwright.
- **State:** server data in Query (freshness per d42: architecture defaults + explicit `staleTime: 0` where needed + global focus-refetch + scaffolder-mandated per-resource staleTime); view state in the URL; UI flags in Zustand; **no Redux**.
- **Assistant (Arya):** tools generated from commands with MCP-style risk annotations; every write human-approved; LLM calls backend-hosted.
- **⌘K:** palette-lite (navigation + actions; record search dropped — no backend search). Global search reuses per-entity list APIs.
- **Extensions:** targets declared in contracts now; host built later (build-order #6) — adding the surface requires no feature changes.

## 4. Repo & delivery

- **Fresh codebase** (d42) — domain logic/transformers lifted selectively from gk-pages for parity.
- **Build order:** platform shell → registry engine → **products (golden exemplar)** → orders → assistant → remaining resources → extensions.
- **Shipping:** CI gates (lint/types/tests/budget/audit; Playwright smoke as deploy gate), PR preview deploys against QA, git-tag versioning stamped into bundle+Sentry, contenthash/no-cache-index cache strategy, S3/CloudFront SPA hosting.
- **Cutover:** subdomain live → dashboard nav redirects → import-map entry removed; rollback = restore the entry; rollout rides the `pages` flag.

## 5. Quality & operations

Sentry (route ErrorBoundaries, hidden source maps, release+mid tags, no PII) with alerts through the existing **Sentry→OpsGuard** pipe; one synthetic uptime check + CDN alarms; security v1 headers at the CDN (HSTS, frame-ancestors 'none', Referrer/Permissions-Policy) with **full CSP as a post-launch report-only → enforce rollout**; bundle budget + route splitting; PostHog Web Vitals autocapture only; 4-state UX baseline with AA accessibility.

## 6. Contribution model

Recipe-style `CLAUDE.md` (+ nested + `AGENTS.md`) · Plop scaffolder (`new:resource` — correct by construction, explicit staleTime mandatory) · ESLint boundaries + pattern bans · CODEOWNERS (`/src/`, stricter `/src/ui/`) · **UI-kit lockdown** (closed APIs, change-request flow with 1–2-day SLA, Storybook-lite `/playground`) · **AI-native repo** (committed `.claude/skills/`, team `mistakes.md`, AI-PR contract ≤400 lines + "I ran it", committed settings with secrets-read denied).

## 7. Docs policy (d42)

Operational docs (runbook, ADRs, tracking plan, PII policy) live on **Confluence**. **Exception:** `CLAUDE.md`, `mistakes.md`, `.claude/skills/`, `.claude/settings.json` live **in-repo** — they are the AI contributors' operating system, not documentation.

## 8. Explicitly deferred / out of scope (v1)

Full CSP (report-only rollout post-launch) · staff-management UI (d36) · record search in ⌘K · npm-packaged UI kit (written triggers exist) · full Storybook · extensions host (contracts ready; build-order #6) · i18n/mobile strategy (consciously deferred — Shopify-admin desktop-first model).

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Registry engine is upfront cost with no screens (~2–3 weeks) | Products + orders built first; contracts adjusted where real screens disagree (spec-first, confirmed by real code). Thin-slice fallback agreed. |
| Rewrite drift from today's behaviour | Parity rule: business logic behaves exactly as gk-pages; known future changes isolated as named seams ([schema/deferred](../architecture/schema/deferred.md)); write-defect list needs product sign-off before parity port. |
| Forgotten freshness override → silent stale data | Global focus-refetch + scaffolder-mandated explicit staleTime (d42). |
| Backend instability | Every endpoint referenced in exactly one file; per-service transformers; Zod drift-logging to Sentry (d41). |
| Outside/AI contributors diverging | Guardrails + paved road (engineering/02, 04); lockdown on the kit (engineering/03). |

## 10. Next step

Implementation plan (phases and tasks along the build order), then build — starting with the platform shell and the registry engine, validated by the products exemplar.

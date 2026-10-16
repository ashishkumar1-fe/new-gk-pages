# Ratio — Discovery decisions & architecture review

> Status: complete (discovery phase) · Owner: Ashish Kumar · Updated: 2026-10-15
> Companion to the draft architecture in this folder (owner: Aman Zaid, v0, 2026-10-14).
> Sources: decision tracker (39 closed decisions), code-level investigation of `gk-pages`, `dashboard-ui`, `dashboard-ui-configuration`, and the live `@gokwik/utilities` bundle. Jira: INFN-3338.

This document does three things:

1. Records **everything decided in discovery** (39 decisions + 12 coding principles).
2. Reviews the draft architecture against those decisions — **what aligns, what conflicts, what each side adds**.
3. **Answers several of `open-questions.md`** with verified findings.

---

## 1. Verified ground truth (code-level findings)

These were verified in code / DevTools, not assumed:

- **Auth is a gateway cookie, not a header.** The auth token is an httpOnly + Secure cookie set by the gateway. Prod: `token` on `Domain=.gokwik.in`, **no SameSite attribute → Chrome treats it as Lax**. Sandbox: `sandbox_token` on `api-gw-v4.dev.gokwik.in`, `SameSite=None` (only so localhost dev works). `makeAPICall` sends `withCredentials: true` everywhere; **JS never reads or sends the token** (the utilities bundle's only read of the cookie is a leftover `console.log`, always null).
- **Consequence: the new domain MUST be a `gokwik.in` subdomain.** On a foreign domain the Lax prod cookie is never attached — auth fails even in Chrome. On a subdomain, the existing `.gokwik.in` cookie is already valid: auth works with zero backend change.
- **Entitlement already exists.** `GET /api/dashboard/user/details` → `config.selected_products.pages` gates the GK Pages nav (dashboard `sideNav/index.tsx:1386`). It only hides the menu today — the app still mounts by URL. The standalone app adds a real route guard.
- **Coupling surface of gk-pages** (what the shell provides): `makeAPICall` ×39 imports, `dashboardStore` ×17, `updateBreadcrumbs` ×11, `validatePermission`/`filterStore`/`logUserEvent`/`getCookie` ×1–2; `sessionStorage['merchant-mid']` read in 77 places; one import-map entry + `/gk-pages` activity route in the root config.
- **Gateway is the single enforcement point** for auth and CORS. Inner services (os-item, os-order, …) trust the gateway's verified context — they need zero changes for a new origin. Known gateway-bypass categories to audit: direct service hosts (the discount-V2 CORS incident), `fetch`-based uploads with manual merchant headers, third-party endpoints.

---

## 2. All 39 discovery decisions

### Identity (level 0)
| # | Decision |
|---|---|
| d01 | Product name: **Ratio**. |
| d02 | Domain: name deferred; **must be a gokwik.in subdomain** (hard constraint from d06). |
| d03 | Merchant access: backend's `selected_products.pages` flag is the single source of truth; all-at-once vs phased decided with cutover. |
| d04 | Entitlement: reuse that flag, **add a frontend route guard** (flag false → "no access" screen). No new backend flag. |

### Auth & session (level 15)
| # | Decision |
|---|---|
| d05 | Login/OTP from the new origin: backend will allowlist — confirmed, not a blocker. |
| d06 | **Token is stored nowhere.** Reuse the gateway httpOnly-cookie design + `withCredentials`; FE keeps an `is_logged_in`/`me` check for session state. |
| d07 | Merchant selection: `user/details` via TanStack Query → picker → `sessionStorage['merchant-mid']` (same key; 77 call sites untouched) + `user-details` mirror. No Redux. |
| d08 | Permissions: existing roles/permissions model from the same API. |
| d36 | Staff-management UI: out of scope for v1. |

### Routing (level 30)
| # | Decision |
|---|---|
| d09 | URLs: `/store/:storeId/…` — `/gk-pages` prefix dropped; storeId stays in the URL (deep links, multi-store tabs). |
| d10 | Old dashboard URLs: redirect stub at cutover. |

### Platform layer (level 45)
| # | Decision |
|---|---|
| d11 | Own `apiClient` with `makeAPICall`'s exact signature (39 call sites untouched); owns merchant headers, credentials, loading/error. |
| d12 | **No Redux anywhere.** `useUserDetails` (Query) is the source of truth; sessionStorage mirror for sync reads; the 17 `dashboardStore` imports replaced by one util. |
| d13 | Breadcrumbs dropped; shared components documented in a Storybook-lite instead. |

### Chrome & design (level 60)
| # | Decision |
|---|---|
| d14 | IA finalised by product; sidebar supports **two levels of nesting**. |
| d15 | **Own UI kit** — gokwik-ui-kit/antd not carried over. |
| d16 | v1 ships **global search** (+ store switcher, profile/logout). |

### Backend & CORS (level 75)
| # | Decision |
|---|---|
| d17 | Gateway CORS: exact new origin (wildcards don't work with credentials) + `Access-Control-Allow-Credentials: true` + `gk-merchant-id`/`merchant-mid` in allowed headers. One config; services untouched. |
| d18 | Gateway-bypass audit: tag every call gateway-routed vs bypass; smoke-test bypass list from the new origin on staging; backend fixes what breaks. |

### Delivery (level 90)
| # | Decision |
|---|---|
| d19 | Real SPA hosting (own `index.html`, route fallback, CDN); detailed deploy process finalised with platform last. |
| d20 | Separate PostHog project for Ratio. |
| d21 | Cutover: new domain live → dashboard link redirects → import-map entry removed. Rollback = restore the entry. |

### Production quality (level 95)
| # | Decision |
|---|---|
| d22 | **Sentry** (already in the org): route ErrorBoundaries → `captureException`; CI uploads source maps (hidden-source-map, deleted before deploy); release + merchant-id tags; no PII. **Alerts → OpsGuard** via the existing Sentry→OpsGuard pipe; rules only for new errors/spikes. PostHog stays for events/flags/Web Vitals; session replay in one tool only. |
| d23 | Route-level code splitting + initial-bundle budget enforced in CI. |
| d24 | Security v1 (one CDN response-headers policy): HSTS; `frame-ancestors 'none'` + `X-Frame-Options: DENY`; `Referrer-Policy: strict-origin-when-cross-origin`; `Permissions-Policy` (camera/mic/geo off); no secrets in bundle; no public source maps; login rate-limit confirmed with backend. **Full CSP deferred** — Report-Only after launch, then enforce. |
| d25 | Uptime: one external synthetic check (login page + API round-trip) + CDN alarms → same OpsGuard pipe. API-latency SLOs stay with backend on-call. |
| d26 | ErrorBoundary per route (retry card) + one global crash page. Blank screens never. |
| d27 | PostHog feature flags: percentage/per-merchant rollout, kill-switches; flag-debt cleanup rule. |
| d28 | CI gates (blocking): lint, `tsc --noEmit`, tests (fix/quarantine the 7 legacy failing suites first), bundle budget, npm audit. Playwright smoke on staging = deploy gate. Branch protection on. |
| d29 | Every screen ships skeleton / empty-with-CTA / error-with-retry / ready; keyboard nav, visible focus, AA contrast — PR checklist. |

### Engine room (level 97)
| # | Decision |
|---|---|
| d30 | Web Vitals: PostHog autocapture only — no alerting/SLO dashboards (backend owns API latency). |
| d31 | Query conventions: keys `[domain, storeId, params]` (**storeId mandatory** — prevents cross-merchant cache bleed), staleTime defaults, invalidate-on-mutation. Zod `safeParse` + Sentry log (never throw) on critical endpoints; hard parse for money; schemas accompany new code; full coverage is a non-goal. |
| d32 | Release engineering: PR preview deploys (QA backend, env baked at build, non-prod badge); git-tag versioning stamped into bundle + Sentry + GitHub Releases; contenthash filenames + no-cache `index.html` + long-cache assets + CDN invalidation. |
| d33 | Asset pipeline: CDN image transforms (resize/webp) for thumbnails, native lazy loading, `font-display: swap`, skeleton-first (zero CLS). |
| d34 | Renovate weekly (once the repo settles), audit gate, committed lockfile, one-page browser-support matrix. |
| d35 | Team docs on **Confluence**, one home per doc: Runbook (before launch), ADRs, Tracking plan (`object_verb` snake_case), PII masking policy. *(See conflict #5 below — the draft architecture keeps docs in-repo.)* |

### Contribution & AI (problem-first additions)
| # | Decision |
|---|---|
| d37 | **Contribution guardrails:** recipe-style `CLAUDE.md` (root + nested + `AGENTS.md` symlink); **Plop scaffolder** `npm run new:feature` (correct-by-construction folders/templates — hand-made folders banned); ESLint boundaries + restricted imports; CODEOWNERS on `/src/`. Milestone: ui kit + one golden exemplar feature first — it is the copy-source. |
| d38 | **UI-kit lockdown:** `src/ui/` in-repo + CODEOWNERS (`/src/ui/` → kit owners, code-owner review required); **closed component APIs** (variant unions only, no `className`/`style` passthrough, colors only via tokens); lint bans raw elements / kit-internal imports / shadow components; "UI Kit change request" issue template with a 1–2-day SLA for small variants; catalog = **Storybook-lite** `/playground` route (non-prod only); npm package **not now** — written trigger: a second consumer app or repeated bypasses. |
| d39 | **AI-native repo:** repo-committed `.claude/skills/` (`new-feature`, `review-pr`, `fix-bug`, `add-api`) so every dev's AI runs the same workflows; team `mistakes.md` (committed, PR-updated: mistake/fix/how-found); AI-PR contract (≤ ~400 lines, author's "I ran it myself" confirmation, tests included, reviewer asks "is this our pattern?"); committed `.claude/settings.json` (pre-allowed safe commands, `.env`/secrets read denied, auto-lint hooks). |

### Coding principles (agreed set)
1. Feature-sliced layers, one-way deps (`app → features → ui/platform → lib`), ESLint-enforced; features expose only `index.ts`.
2. Colocation; a thing goes global on its third use.
3. **Server state = TanStack Query · UI state = useState · view state = URL · Redux = nowhere.** Query defaults are **freshness-first**: `staleTime: 0`, `refetchOnWindowFocus`, `refetchInterval` on live screens — cache exists to kill skeleton flashes, never to serve stale data.
4. Composition over configuration (compound components, not 30-prop tables).
5. Unidirectional data; no side-channel events.
6. Make impossible states impossible (union-typed state).
7. Parse, don't validate (Zod at boundaries; types via `z.infer`).
8. Every async UI has 4 designed states: skeleton / empty / error / ready.
9. Testing Trophy: mostly integration (RTL + MSW), some unit (pure logic), few E2E smoke, zero snapshots.
10. Boring > clever; AHA (abstract on the third duplication); ~150-line component guideline.
11. Accessibility by default, built once into the kit.
12. Lint/format/strict-TS are CI's job, never a reviewer's.

---

## 3. Review: draft architecture vs discovery decisions

### Strongly aligned (no action)
- Standalone SPA, gateway unchanged; httpOnly cookie auth; **subdomain requirement and `selected_products.pages` entitlement** (context.md matches the verified findings exactly).
- TanStack Query as the only home for server data; **no Redux**; view state in the URL; no `useEffect` fetching.
- One Zod schema per shape (API boundary + RHF + AI tool inputs) — extends our d31/principle 7.
- Own UI kit on Radix + Tailwind + tokens (d15); Sentry + PostHog; Playwright; ESLint-enforced import boundaries; one-way layer deps; ADR log; build order starting with a real exemplar (products) — matches the d37 "golden feature first" milestone.
- Merchant-id first in every query key; headers attached in exactly one apiClient; store switch clears the cache — matches d31/d07/d11.

### Resolved on 2026-10-15 (d40 — adopted from the draft)
- **TanStack Router** ✓ (typed routes + Zod-validated search params; natural fit for URL-as-state).
- **Vite** ✓ (d23/d32 webpack mechanics translate 1:1 — contenthash, budgets, previews).
- **Zustand** ✓ for UI flags only, hard rule: a single byte of server data in Zustand fails review.
- **⌘K palette in v1** ✓ — falls out of the command registry for free.
- **Resources & commands registries** ✓ — supersede plain feature `api.ts` for entity CRUD; the d37 scaffolder generates resource/command/machine skeletons.
- **XState v5** ✓ with the 3-steps/3-booleans rule (login, boot, record editor, refund, import, job tracker, assistant).

### Resolved on 2026-10-16 (d42 — the last three)
1. **Repo: fresh codebase** — not an in-place conversion; domain logic/transformers lifted selectively from gk-pages for parity.
2. **Cache freshness: the draft's defaults win** (lists 30 s, detail 60 s, lookups 10 min), with **explicit `staleTime: 0`** wherever freshness matters. Two mandatory safety nets so a forgotten override can never cause silent stale data: `refetchOnWindowFocus: true` globally, and the scaffolder requires an explicit `staleTime` on every resource definition.
3. **Docs: Confluence** (runbook, ADRs, tracking plan, PII policy). Exception: `CLAUDE.md`, `mistakes.md`, `.claude/skills/`, `.claude/settings.json` stay in-repo — they are the AI operating system (d37/d39), not documentation.

**Nothing remains open between the two workstreams.** Architecture is 100% decided; next step is the implementation plan.

### What the draft adds that discovery didn't have (adopt)
- **Resources & commands registries** (`defineResource`/`defineCommand`): define once → tables, forms, bulk bar, ⌘K, shortcuts, assistant tools, extensions all consume the same definitions; single `runCommand` execution path (confirm/optimistic/jobs/audit). This **supersedes** the plain "feature folder with api.ts" shape for entity CRUD; the scaffolder (d37) should generate resource/command/machine skeletons, not bare folders.
- **XState v5 machines** for real flows (login, boot, record editor, refund, import, job tracker, assistant) with the 3-booleans rule.
- **Assistant (Arya) architecture**: tools generated from commands with MCP-style risk annotations, human approval on every write, backend-hosted LLM.
- **Extensions** (sandboxed UI extensions + embedded apps) on the same contracts.
- **Schema layer**: per-entity domain shapes reconciled against real backend responses (money in paise, mixed-case normalisation in per-service transformers), endpoints table, deferred-changes list with named seams, and a defects list for today's writes (price double-conversion first).

### What discovery adds that the draft doesn't cover (bring in)
- **Operational layer:** OpsGuard alerting via the existing Sentry pipe (d22), uptime checks (d25), security headers + CSP plan (d24), release engineering — previews/versioning/cache invalidation (d32), Renovate + audit gates (d34), bundle budget (d23).
- **Contribution & AI guardrails:** d37 (CLAUDE.md recipes, scaffolder, CODEOWNERS), d38 (kit lockdown: closed APIs, change-request flow, Storybook-lite), d39 (repo skills, team mistakes.md, AI-PR contract, committed settings). The draft's registry pattern makes these *easier* — commands/resources are exactly the kind of templates a scaffolder generates.
- **Cutover mechanics** (d21/d10) and the merchant-rollout question tied to `pages` flag (d03).

---

## 4. Answers to `open-questions.md` from discovery

| OQ | Answer from discovery |
|---|---|
| 2 (name/subdomain) | Name: **Ratio** (d01). Subdomain of gokwik.in is **mandatory** — verified cookie behaviour (d02/d06); only the exact name is open with product. |
| 3 (gateway CORS) | Scoped precisely (d17): exact origin + `Allow-Credentials: true` + `gk-merchant-id`/`merchant-mid` headers. One gateway config; inner services untouched. Backend conversation owned by us. |
| 4 (login from new origin) | Confirmed with backend as doable; not a blocker (d05). "Who am I" = `user/details` (also carries entitlement + merchant list). |
| 8 (hosting/CI) | Decided shape (d19/d32): S3/CloudFront SPA hosting, PR preview deploys against QA, git-tag versioning, contenthash + no-cache index + invalidation. Details with platform near the end. |
| 9 (gateway bypasses) | Known categories already identified (d18): direct service hosts (discount-V2 incident), fetch-based uploads (manual merchant headers), third-party. Audit + staging smoke-test plan agreed; backend resolves breakages. |
| 15 (activity log) | v1 = PostHog only — consistent with d35's tracking plan. |
| 1 (fresh vs reuse) | **Still genuinely open** — see conflict #1 above; needs an explicit joint call. |

---

## 5. Where everything lives

- **Decision tracker** (operational, 39 closed decisions, Hinglish): claude.ai artifact `af4bb5ce…` — decisions collection is the machine-readable record.
- **Handbook** (English, animated, chapters 1–10 + appendix of d01–d36): claude.ai artifact `11ba7e95…`; PDF: `~/Desktop/Ratio-Standalone-Handbook.pdf`.
- **Draft architecture** (this folder): Aman's v0 — schema/resources/commands/docs.
- **Jira:** INFN-3338 (discovery).
- This file: the bridge between the two workstreams.

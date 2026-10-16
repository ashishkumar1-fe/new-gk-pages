# Ratio — Decision Log (with rationale & provenance)

> Status: complete — 42 decisions, zero open · Owner: Ashish Kumar · Updated: 2026-10-16
> Companion to the draft architecture in this folder (Aman Zaid, v0). Formal spec: [`../specs/2026-10-16-ratio-standalone-design.md`](../specs/2026-10-16-ratio-standalone-design.md). Engineering standards: [`../engineering/`](../engineering/README.md). Jira: INFN-3338.

Every decision below records **what** we decided, **why**, and **where it came from**. Two workstreams ran independently — a code-level discovery of today's gk-pages/dashboard (Ashish) and a draft architecture (Aman) — and converged on ~85% of the same answers before we compared notes. This log is the merge of both, with the disagreements and their resolutions recorded honestly.

**Provenance labels:**

| Label | Means |
|---|---|
| 🔍 code-verified | Forced by a fact we verified in code/DevTools — not a preference |
| 🧑‍💻 discovery | Originated in the discovery workstream |
| 📐 draft | Originated in Aman's draft architecture; adopted after discussion |
| 🤝 merged | Both workstreams had a position; the final is a deliberate merge |
| 💬 product call | A judgement call by the product/team, recorded as made |

---

## 1. Verified ground truth (the facts that forced decisions)

- **Auth is a gateway cookie, not a header.** The token is an httpOnly + Secure cookie set by the gateway — prod: `token` @ `Domain=.gokwik.in`, **no SameSite attribute → Chrome default Lax**; sandbox: `sandbox_token` @ `api-gw-v4.dev.gokwik.in`, `SameSite=None` (exists only so localhost dev works). `makeAPICall` sends `withCredentials: true` everywhere; **JS never reads or sends the token** — the live utilities bundle's only read of the cookie is a leftover `console.log` that always prints null (httpOnly). *Verified in the shipped `@gokwik/utilities` bundle and production DevTools.*
- **Entitlement already exists:** `GET /api/dashboard/user/details` → `config.selected_products.pages` gates the GK Pages nav (dashboard `sideNav/index.tsx:1386`). It is menu-only — the app still mounts by URL for anyone who knows it.
- **Coupling surface of gk-pages:** `makeAPICall` ×39 imports · `dashboardStore` ×17 · `updateBreadcrumbs` ×11 · `validatePermission`/`filterStore`/`logUserEvent`/`getCookie` ×1–2 · `sessionStorage['merchant-mid']` read in **77 places** · one import-map entry + `/gk-pages` activity route.
- **The gateway is the single enforcement point** for auth and CORS; inner services receive verified context and need zero changes for a new origin. Known gateway-bypass categories: direct service hosts (the discount-V2 CORS incident), `fetch`-based uploads with manual merchant headers, third-party endpoints.

---

## 2. Decision log

### Identity & access

**d01 — Product name: Ratio.** 💬
*Why:* product identity needed before domain, analytics project, branding and emails could be scoped. *Source:* product call, closed on the tracker.

**d02 — Domain: name deferred; MUST be a gokwik.in subdomain.** 🔍
*Why:* the prod auth cookie lives on `Domain=.gokwik.in` and is effectively SameSite=Lax — on a foreign domain the browser never attaches it, so **auth fails in every browser, CORS approval cannot fix it**. On a subdomain the existing cookie is already valid: auth works with zero backend change. *Rejected:* a fully separate domain (e.g. ratio.in) — would require either third-party-cookie reliance (breaks in Safari, fragile in Chrome) or an entirely new header-based auth with backend work; also considered proxying the gateway under the new domain (`api.ratio.in`) — possible but real infra+auth work for no v1 benefit. *Source:* discovery (DevTools cookie table + bundle analysis).

**d03 — Which merchants: the backend's `selected_products.pages` flag is the single source of truth.** 🔍
*Why:* the mechanism already exists and is already how the dashboard gates access — nothing new to build or migrate. All-at-once vs phased rollout is a cutover-time product call and composes with feature flags (d27). *Source:* traced in dashboard code.

**d04 — Entitlement: reuse the flag + add a real frontend route guard.** 🤝
*Why:* today the flag only hides a menu item — anyone with the URL can mount the app. Standalone, that hole would be public. A route guard (flag false → blocked + "no access / talk to sales" screen) closes it at the cost of one frontend check. Originally scoped as "backend must build an entitlement flag" (a blocker) — the code trace showed the flag already exists, downgrading this from external blocker to frontend work. *Source:* discovery; Aman's platform.md independently specifies the same guard.

### Auth & session

**d05 — Login/OTP callable from the new origin.** 💬
*Why:* the only genuinely new thing auth needs. Confirmed with backend as a config change (origin allowlist on login/verify-otp), not a blocker. *Source:* discovery raised it; backend confirmed.

**d06 — Token storage: NOWHERE.** 🔍
*Why:* the strongest finding of discovery — the frontend never stores a token today (httpOnly gateway cookie + `withCredentials`), which is already best practice: XSS cannot steal what JS cannot read. Standalone **reuses the design unchanged**: login via gateway → gateway sets its cookie → every call `withCredentials: true` → FE keeps only an `is_logged_in`/`me` check. *Rejected:* sessionStorage token (logout on tab close, XSS-readable — and would be a security DOWNGRADE from today), localStorage (same, persists), building a new header-token auth (backend work for negative benefit). *Source:* discovery (verified); Aman's platform.md matches it exactly.

**d07 — Merchant selection: React Query + sessionStorage, no Redux.** 🧑‍💻
*Why:* after login, `user/details` (fetched via Query) carries the merchant list; picking a store writes `sessionStorage['merchant-mid']` — **the same key today's code reads in 77 places**, so ported code keeps working untouched — plus a `user-details` mirror for sync reads. Components use a `useUserDetails` hook. *Rejected:* rebuilding the shell's Redux store (nothing needs it; two sources of truth invite staleness). *Source:* discovery; explicit user call ("Redux nahi rakhenge").

**d08 — Permissions: the existing roles/permissions model, from the same API.** 💬
*Why:* the API already returns permissions including whether GK Pages is allowed; a new RBAC model is scope without benefit for v1. Commands declare `permission` keys now so enforcement can tighten later without code changes. *Source:* team call on the tracker.

**d36 — Staff-management UI: out of scope for v1.** 💬
*Why:* staff continue to be managed in the existing system; a Ratio-native staff & roles section is v2 (the draft's registry/commands make it cheap to add later). *Source:* explicit scope call.

### Routing

**d09 — URLs: `/store/:storeId/…`, prefix dropped, storeId stays in the URL.** 🤝
*Why:* `/gk-pages` existed only so the Single-SPA root config knew when to mount the app — an artifact, not a design. `storeId` stays in the path so deep links, shared links and multi-store tabs work (and because view state belongs in the URL — see d40/TanStack Router). *Source:* discovery recommendation, user-approved; matches the draft's routes.

**d10 — Old dashboard URLs: redirect stub at cutover.** 💬
*Why:* merchants' bookmarks and support docs point at `dashboard…/gk-pages/…`; a temporary 301 stub (same path, new domain) for a transition window prevents a 404-and-support-ticket wave at near-zero cost. *Source:* discovery; deferred detail to cutover.

### Platform layer

**d11 — Own `apiClient` with `makeAPICall`'s exact signature.** 🧑‍💻
*Why:* the riskiest part of any migration is touching working call sites; keeping the signature means 39 call sites port unchanged, and the entire data-access migration concentrates in one file. The client owns merchant headers (attached in exactly one place), credentials, and consistent loading/error behaviour. *Rejected:* adopting a generic HTTP lib interface and rewriting call sites (needless churn). *Source:* discovery; the draft's platform.md specifies the same single-client principle.

**d12 — User/merchant data: Query is the source of truth; no Redux anywhere.** 🤝
*Why:* the shell's `dashboardStore` (17 imports) is a second copy of server state — the pattern behind an entire family of staleness bugs in gk-pages. One `useUserDetails` hook + sessionStorage mirror replaces it; the old Redux user slice retires. *Source:* discovery + user call; identical to the draft's state.md ("server data never copied into a store").

**d13 — Breadcrumbs dropped; shared components get a Storybook-lite instead.** 💬
*Why:* the shell's breadcrumb bar (11 call sites) disappears with the shell; good navigation makes breadcrumbs redundant (the Ratio design reference has none). The component-discoverability need behind "document shared components" is served by the `/playground` catalog (d38). *Source:* user call on the tracker.

### Chrome & design

**d14 — Navigation/IA: product finalises; the sidebar supports two levels of nesting.** 💬
*Why:* IA is a product decision; the build requirement (2-level nesting) is fixed so the shell component can be built without waiting. *Source:* user call.

**d15 — Own UI kit; gokwik-ui-kit/antd not carried over.** 🤝
*Why:* a standalone product needs its own brand and should not inherit antd's CSS weight and override wars (the `gk-ant` prefix saga). Radix + Tailwind + tokens give accessible primitives with full visual control. *Cost acknowledged:* this is the single biggest scope item in the project; the Storybook-lite and kit governance (d38) exist to keep it coherent. *Rejected:* carrying gokwik-ui-kit for v1 and reskinning later (discovery's original lean) — superseded by the explicit user call "we will create our own" + the draft's identical choice. *Source:* merged.

**d16 — v1 ships global search (+ store switcher, profile/logout).** 💬
*Why:* table-stakes for a Shopify-class admin. Mechanism settled in d41: reuse per-entity list APIs' search params across 2–3 entities in parallel (no new backend). *Source:* user call.

### Backend & CORS

**d17 — Gateway CORS: one config (exact origin + Allow-Credentials + merchant headers).** 🔍
*Why:* auth and CORS are both enforced at the gateway, so one config unlocks ~90% of APIs at once; wildcards don't work with credentialed requests (browser rule), and the merchant headers must be explicitly allowlisted (the discount-V2 direct-host failure was exactly this). Inner services need zero changes — they trust gateway-verified context. *Source:* discovery (verified behaviour + incident history).

**d18 — Gateway-bypass audit; backend resolves breakages.** 🧑‍💻
*Why:* d17's free pass covers only gateway-routed calls. Three known bypass categories (direct hosts, fetch-based uploads, third-party) each carry their own CORS story; the audit tags every call gateway-routed vs bypass and smoke-tests the bypass list from the new origin on staging before launch. *Source:* discovery.

### Delivery

**d19 — Real SPA hosting (own index.html, route fallback, CDN); deploy detail finalised with platform last.** 💬
*Why:* today "deploy" is replacing one bundle behind an import map — there is no index.html to own. Standalone needs standard SPA hosting; the exact pipeline is platform's domain and intentionally sequenced late. *Source:* user call.

**d20 — Separate PostHog project for Ratio.** 💬
*Why:* clean event space fully in the team's hands, new login/activation funnels that the shell used to own. *Trade-off accepted:* historical continuity with dashboard events resets. *Source:* user call.

**d21 — Cutover: domain live → dashboard link redirects → import-map entry removed; rollback = restore the entry.** 🧑‍💻
*Why:* the import map makes rollback a one-line restore — so both apps stay deployable through the transition and launch day has a parachute. *Source:* discovery.

### Production quality

**d22 — Error tracking: Sentry; alerts via the existing Sentry→OpsGuard pipe.** 🤝
*Why:* Sentry is already in the org (procurement solved) and is the best-in-class error tool; the org's on-call already consumes Sentry alerts through OpsGuard — we add a project to an existing pipe instead of building one. Source maps uploaded privately and stripped from the bundle (readable traces for us, no source disclosure). PostHog remains for events/flags/vitals; replay in exactly one tool. *Rejected:* PostHog error tracking (younger grouping/release-health; chosen initially for vendor-count reasons, flipped when "Sentry already in org" surfaced). *Source:* merged through discussion.

**d23 — Bundle budget + route splitting, enforced in CI.** 💬
*Why:* bundles grow silently (one `moment.js` import = +70KB nobody notices); a CI size gate catches it at the PR. Today's gk-pages is one unsplit bundle — the anti-example. *Source:* user call ("very important, will do").

**d24 — Security v1: five headers at the CDN; full CSP deferred (report-only → enforce after launch).** 🤝
*Why:* today the root config owns security headers — standalone inherits the duty. The v1 set (HSTS, `frame-ancestors 'none'` + XFO, Referrer-Policy, Permissions-Policy) is ~30 minutes in one CloudFront policy and closes the real risks (clickjacking on an admin). Full CSP is the one genuinely expensive item; shipping it blind breaks things on launch day, so it rolls out post-launch via Report-Only. **Deferral, not deletion** — the old dashboard has CSP; an audit would flag its absence. *Source:* discovery proposal, user-scoped ("full CSP abhi nahi; Referrer/Permissions-Policy mandatory me daal do").

**d25 — Uptime: one synthetic check + CDN alarms → same OpsGuard pipe.** 🧑‍💻
*Why:* "the app is down" must reach us before merchants; one login-page + API-round-trip check is sufficient and deliberately minimal. **API-latency SLOs stay with backend on-call** — duplicating them would be noise and theirs to own. *Source:* discovery, scoped down by the user's correct observation that backend already owns API alerting.

**d26 — ErrorBoundary per route + global crash page; blank screens banned.** 🧑‍💻
*Why:* today's single-spa wrapper literally `return null`s on crash — sections vanish silently. Route-level boundaries (retry card + Sentry capture) keep the rest of the app alive; granularity stays at route/section level so errors don't get swallowed. *Source:* discovery (anti-pattern found in code).

**d27 — Feature flags: PostHog — percentage/per-merchant rollout, kill-switches, flag-debt cleanup rule.** 🧑‍💻
*Why:* rollback-by-toggle instead of rollback-by-deploy for risky features; PostHog is already integrated so flags are free; launch itself can ride a flag (ties to d03 phased rollout). The cleanup rule exists because stale flags rot into dead if/else forests. *Source:* discovery.

**d28 — CI gates, blocking: lint, tsc, tests, budget, audit; Playwright smoke = deploy gate.** 🧑‍💻
*Why:* gates that don't block don't exist; the 7 legacy failing suites inherited from gk-pages get fixed/quarantined first because a gate with known-red teaches people to ignore red. *Source:* discovery.

**d29 — UX baseline: 4 states per screen, keyboard, AA contrast — PR checklist.** 🧑‍💻
*Why:* a new product's first impression is made of loading/empty/error moments; improvised states read as cheap. The scaffolder's page template ships all four so compliance is the default. *Source:* discovery.

### Engine room

**d30 — Web Vitals: PostHog autocapture only; no alerting/SLO dashboards.** 💬
*Why:* backend on-call owns API latency; the browser-side half (bundle parse, render, INP — invisible to backend monitoring) just needs to be *recorded* so "it feels slow" can be answered with numbers. Zero-effort insurance, deliberately not an alerting system. *Source:* user call after discussion.

**d31 — Query conventions + pragmatic Zod boundaries.** 🤝
*Why:* query keys `[domain, merchantId, params]` with **merchantId first and mandatory** — cross-merchant cache bleed is a security bug and this makes it structurally impossible. Zod policy is deliberately pragmatic: `safeParse` + Sentry log (never throw) on critical endpoints — detect backend drift without breaking pages; **hard parse for money** (a wrongly-parsed price must stop, not render); full schema coverage is an explicit non-goal (40+ modules of schemas would be over-engineering). *Source:* merged — draft's data-access + discovery's safeParse/money-hard-parse refinement.

**d32 — Release engineering: PR previews, git-tag versioning, contenthash cache strategy.** 🧑‍💻
*Why:* previews turn review into "open a link" for QA/design/PM; version stamps make "what is prod running?" a console line and rollback a repoint; contenthash + no-cache index means nobody is ever told to hard-refresh (if they are, it's a bug). *Source:* discovery.

**d33 — Asset pipeline: CDN image transforms, lazy loading, font swap, skeleton-first.** 🧑‍💻
*Why:* product images are a content-heavy admin's biggest weight; skeleton-first keeps layout stable (zero CLS) and is the ground-level half of the d23 budget. *Source:* discovery.

**d34 — Renovate weekly + audit gate + lockfile discipline + browser matrix.** 🧑‍💻
*Why:* small continuous upgrades instead of one painful yearly migration (gk-pages is pinned on TS 4.3 as the cautionary tale). Enabled once the repo settles, not in month one. *Source:* discovery.

**d35 — Team docs on Confluence; one home per doc.** 💬
*Why:* docs live where the team already reads (Jira/Confluence org). Four one-pagers: Runbook (before launch), ADRs, Tracking plan (before the first event), PII policy. See d42 for the in-repo exception. *Source:* user call.

### Contribution & AI (problem-first additions — not in the draft; we bring these)

**d37 — Contribution guardrails: CLAUDE.md recipes + scaffolder + lint boundaries + CODEOWNERS.** 🧑‍💻
*Problem stated by the team:* outside (often backend, AI-assisted) contributors write code in their own style and the codebase degrades. *Why this shape:* instructions alone stop nobody — so recipes teach (AI agents follow steps, not policy prose), the scaffolder makes right the fastest path (generated code *is* the pattern), lint makes wrong unmergeable, CODEOWNERS is the human backstop. Milestone: kit + one golden exemplar first — guardrails without a paved example produce frustration. *Details:* [engineering/02](../engineering/02-contribution-guardrails.md).

**d38 — UI-kit lockdown: CODEOWNERS on `/src/ui/` + closed component APIs + change-request flow + Storybook-lite.** 🧑‍💻
*Problem stated:* nobody may add/edit/delete kit components; a pink variant must go through the owners — and even direct edits must be unmergeable without approval. *Why this shape:* CODEOWNERS enforces the merge gate; **closed APIs enforce the process in the type system** (no `className`/`style` passthrough — "pink" cannot be expressed without a kit change, which triggers CODEOWNERS); the 1–2-day change-request SLA is the open door that prevents shadow kits. npm packaging deferred with written triggers (second consumer app, or repeated bypasses) because publish-bump-install cycles would kill build-phase velocity. *Details:* [engineering/03](../engineering/03-ui-kit-governance.md).

**d39 — AI-native repo: committed skills, team mistakes.md, AI-PR contract, committed settings.** 🧑‍💻
*Problem stated:* everyone codes with Claude/Codex now; five developers = five prompting styles, knowledge trapped in individuals' AI sessions, AI-sized PRs collapsing review. *Why this shape:* committed `.claude/skills/` makes prompt quality a repo property; `mistakes.md` turns one person's debugging pain into every AI's permanent knowledge; the PR contract (≤400 lines, "I ran it", tests included) keeps review human-scale; committed settings deny secrets reads uniformly. *Details:* [engineering/04](../engineering/04-ai-native-repo.md).

### Draft-architecture adoptions (from Aman's v0, after discussion)

**d40 — Adopt: Vite, TanStack Router, Zustand (UI flags only), resources/commands registries, XState v5, ⌘K.** 📐
*Why each:*
- **Vite** — admin behind login: no SEO/SSR need, so Next.js is complexity without benefit; discovery's webpack mechanics (contenthash, budgets) translate 1:1.
- **TanStack Router** — our view state lives in the URL, and TanStack Router gives **typed routes + Zod-validated search params** (a path typo is a compile error; `?page=banana` never reaches code). React Router would mean manual string parsing of exactly the state we care most about.
- **Zustand** — a global `useState` for UI flags (sidebar, modals, selection) with zero boilerplate; does not conflict with "no Redux" because the banned thing was *server data in a store* — which remains banned in Zustand too (lint).
- **Registries** — "define once, consume everywhere" (see d41 for scope); prior art is mainstream (CQRS, VS Code commands, React-Admin resources, Shopify bulk/extensions, MCP tools) — the pattern is standard, only the assembly is ours.
- **XState v5** — flows with 3+ steps/booleans become diagrams with impossible states unrepresentable; one record-editor machine serves all 11 entity editors.
- **⌘K** — falls out of the command registry nearly free (see d41 for the scope cut).
*Source:* Aman's draft; adopted after a full walkthrough discussion.

**d41 — Scope rules for the adopted architecture.** 🤝
*Why each rule:*
- **Writes = 100% commands, no exceptions** — the safety property everything else (AI assistant, audit, consistency) depends on; one bypassed write endpoint = an unsafe path for the assistant.
- **Registry is a plumber, not a UI generator** — table+form screens (the ~11 resources) are definition-driven; complex UIs (variant matrix, image uploader) are hand-built components **plugged into** definitions; bespoke experiences (visual editor, analytics, onboarding) are normal feature code whose writes still go through commands. This boundary prevents the classic failure of such systems: force-fitting everything.
- **Unstable backend is an argument FOR the pattern, not against:** every endpoint referenced in exactly one file (backend change = one-file edit), per-service transformers normalise mixed snake/camel at the door, Zod drift-logging alarms us before merchants notice.
- **Palette-lite only** — navigation + actions are zero-backend (they read the registries); **record search dropped because the backend has no search support**; global search (d16) reuses per-entity list APIs instead.
- **XState ownership: 2–3 machine authors, everyone else consumes hooks** — contains the learning curve; the 3-steps/3-booleans rule is review-enforced to prevent machine-everything zeal.
*Source:* merged — draft's architecture, discovery's constraints (backend search, team reality).

**d42 — The last three calls (resolving the only real disagreements).** 🤝
- **Repo: FRESH codebase** (not in-place conversion of gk-pages). *Why:* the registry model wants a clean skeleton; parity is preserved by lifting domain logic/transformers selectively. This was the one structural disagreement between workstreams (discovery leaned in-place for history/muscle-memory; the draft leaned fresh) — resolved fresh.
- **Freshness: the draft's defaults win** (lists 30s / detail 60s / lookups 10min) **+ explicit `staleTime: 0` wherever freshness matters.** *Why:* discovery's requirement was "the dashboard must never feel stale" (originally staleTime-0 default); the draft optimised API load. The merge keeps the draft's defaults but neutralises the silent-staleness failure mode with **two mandatory safety nets**: `refetchOnWindowFocus: true` globally (tab-return always revalidates), and the scaffolder requires an explicit `staleTime` on every resource — forgetting is structurally impossible.
- **Docs: Confluence** (runbook, ADRs, tracking plan, PII policy) — where the team already reads. **Non-negotiable exception:** `CLAUDE.md`, `mistakes.md`, `.claude/skills/`, `.claude/settings.json` stay **in-repo** — they are the AI contributors' operating system (d37/d39 depend on agents reading them from the repo), not documentation.
*Source:* merged, final call by the team.

---

## 3. How the two workstreams merged (summary)

| Area | Discovery had | Draft had | Final |
|---|---|---|---|
| Server state | React Query, no Redux | TanStack Query, no Redux | Same — merged trivially 🤝 |
| Auth/domain/entitlement | Code-verified facts | Identical conclusions in context/platform.md | Same 🔍 |
| URL-as-state, Zod-one-schema, own kit | Yes | Yes | Same 🤝 |
| Router / build tool | React Router / webpack (assumed) | TanStack Router / Vite | **Draft adopted** (d40) 📐 |
| Data layer shape | Feature folders + api.ts | Resources/commands registries | **Draft adopted, scope-bounded** (d40/d41) 📐 |
| Flows | Not addressed | XState v5 | **Draft adopted with ownership model** 📐 |
| Ops layer (Sentry→OpsGuard, security, uptime, release engg, budgets) | Fully decided | Absent | **Discovery contributed** 🧑‍💻 |
| Contribution & AI (guardrails, lockdown, AI-repo) | d37/d38/d39 | Absent | **Discovery contributed** 🧑‍💻 |
| Repo strategy | In-place lean | Fresh lean | **Fresh** (d42) 🤝 |
| Freshness | staleTime-0 default | 30s/60s defaults | **Draft defaults + explicit overrides + 2 safety nets** (d42) 🤝 |
| Docs home | Confluence | In-repo | **Confluence, AI-files in-repo** (d42) 🤝 |

## 4. Answers to the draft's `open-questions.md` from discovery

| OQ | Answer |
|---|---|
| 1 (fresh vs reuse) | **Resolved: fresh** (d42). |
| 2 (name/subdomain) | Name: **Ratio** (d01). Subdomain of gokwik.in **mandatory** — cookie behaviour, verified (d02/d06). Exact name open with product. |
| 3 (gateway CORS) | Scoped precisely (d17): exact origin + `Allow-Credentials: true` + `gk-merchant-id`/`merchant-mid` headers. One config; services untouched. |
| 4 (login from new origin) | Confirmed doable with backend; not a blocker (d05). "Who am I" = `user/details` (also carries entitlement + merchant list). |
| 8 (hosting/CI) | Shape decided (d19/d32): S3/CloudFront SPA hosting, PR previews against QA, git-tag versioning, contenthash + no-cache index + invalidation. Detail with platform near the end. |
| 9 (gateway bypasses) | Categories identified + audit/smoke-test plan agreed (d18); backend resolves breakages. |
| 15 (activity log) | v1 = PostHog only — consistent with d35's tracking plan. |

**Nothing remains open between the two workstreams. Next step: the implementation plan.**

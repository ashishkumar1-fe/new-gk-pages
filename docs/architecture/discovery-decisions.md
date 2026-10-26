# Ratio — Decision Log

> Status: 42 decisions closed, zero open · Owner: Ashish Kumar · Updated: 2026-10-16
> Companions: draft architecture in this folder (Aman Zaid, v0) · [design spec](../specs/2026-10-16-ratio-standalone-design.md) · [engineering standards](../engineering/README.md) · Jira INFN-3338.

This log records each decision **the way it was actually reached** — the question that started it, what we investigated or argued, and what settled it. Two workstreams ran independently (a code-level discovery of today's gk-pages/dashboard, and the draft architecture in this folder) and converged on ~85% of the same answers before comparing notes; the disagreements and their resolutions are recorded honestly.

A decision marked **ratified** was explicitly discussed and called. Items that came in as recommendations and were accepted in bulk ("close the rest per your recommendation") are decisions too — but the finer defaults inside them that were never individually discussed are collected separately in [§4 Proposed defaults](#4-proposed-defaults-not-yet-ratified), so reviewers can tell a made call from a sensible suggestion.

---

## 1. Verified ground truth

Facts established in code and DevTools — constraints, not opinions:

- **Auth is a gateway cookie; the frontend never touches a token.** The shipped `@gokwik/utilities` bundle sends `withCredentials: true` on every call and never puts the token in a header — its only read of the cookie is a leftover `console.log` that always prints null, because the cookie is httpOnly. DevTools confirmed: sandbox `sandbox_token` lives on the **gateway's own domain** (`api-gw-v4.dev.gokwik.in`, httpOnly, Secure, SameSite=None — None only so localhost dev works); production `token` lives on **`Domain=.gokwik.in`** with **no SameSite attribute, which Chrome treats as Lax**.
- **Entitlement already exists.** `GET /api/dashboard/user/details` returns `config.selected_products` — the per-merchant map of purchased products. The dashboard gates the GK Pages menu on `selected_products.pages` (sideNav/index.tsx:1386). It is **menu-only**: the app still mounts by URL for anyone who knows it.
- **The coupling surface of gk-pages:** `makeAPICall` ×39 imports · shell Redux `dashboardStore` ×17 · `updateBreadcrumbs` ×11 · `sessionStorage['merchant-mid']` read in **77 places** · one import-map entry + `/gk-pages` activity route. Small and fully enumerable.
- **The gateway is the single enforcement point** for auth and CORS; inner services receive verified context and need zero changes for a new origin. Known bypass categories: direct service hosts (the discount-V2 CORS incident), fetch-based uploads with manual merchant headers, third-party endpoints.

---

## 2. The decisions — as the discussions actually went

### d01 · Name — **Ratio** *(ratified)*

Needed before domain, analytics project and branding could be scoped. Product call.

### d02 + d06 · Domain & token storage — the auth investigation *(ratified; code-forced)*

This began as a normal-sounding question — *"where will we store the token: sessionStorage like today, or an httpOnly cookie?"* — and ended somewhere nobody expected.

First finding (from the shipped utilities bundle): the frontend **doesn't store a token today**. Every call goes out with `withCredentials: true` and the browser attaches a cookie; no JavaScript ever reads or sends the token. The "sessionStorage like today" premise was false.

Second finding (DevTools, raised by Ashish — *"ye dekh bhai, httpOnly h"*): the auth cookie doesn't even live on the app's domain. It lives on the **gateway's** domain — which is why localhost development works at all. Production's cookie sits on `Domain=.gokwik.in` with no SameSite attribute.

That last detail decided the domain question. No SameSite attribute means Chrome treats the cookie as **Lax**: browsers attach it only when the page and the gateway belong to the same site. We walked the scenario explicitly — *"suppose ratio.in is the new domain and backend allows it in CORS?"* — and the answer is that it still fails, because **CORS is the server's permission and SameSite is the browser's rule**; the backend cannot override the browser. A cookie is also never "ours": it belongs to the domain that set it, wherever the page runs.

We also pressure-tested the security model (*"can't someone take the token and hit our APIs from their own site?"*): three independent locks — httpOnly (scripts can't read it), Lax (other sites' fetches don't carry it), CORS preflight on our custom merchant headers (cross-site requests die before sending). Outside a browser (curl with a stolen value) no cookie scheme helps — that's what expiry and server-side validation are for, true of any auth design.

**Decisions:** token is stored **nowhere** — reuse the gateway-cookie design unchanged, with an `is_logged_in`/`me` check for session state; and the new domain **must be a `gokwik.in` subdomain** (exact name open with product). *Rejected:* sessionStorage/localStorage tokens (a security downgrade from today), a foreign domain (auth dead in every browser), proxying the gateway under a new domain (real infra+auth work for no v1 benefit).

### d03 + d04 · Which merchants, and entitlement *(ratified; code-traced)*

Question asked plainly: *"kaise ho raha hai aaj? API me kuch aata hoga? kahan save hota hai?"* Traced end to end: backend stores per-merchant `selected_products`; login's `user/details` returns it; Redux holds it; one line in the sidebar shows or hides the GK Pages menu. So "which merchants get Ratio" already has a mechanism — **nothing new to build**; all-at-once vs phased is a cutover-time call.

The trace also exposed a hole: the flag only hides the **menu**. The app itself mounts by URL — anyone with a link gets in. Fine inside the dashboard (nobody knew the URL); not fine for a standalone product. **Decision:** reuse the flag, and add a real **route guard** — flag false → routes blocked → a clean "no access / talk to sales" screen. What began as an external blocker ("backend must build an entitlement flag") closed as pure frontend work.

### d05 · Login from the new origin *(ratified)*

The only genuinely new thing auth needs: the login/verify-OTP endpoints allowlisting the new origin. Confirmed with backend as a config change — *"hn ye krwa lenge, blocker nahi h"*.

### d07 + d12 · Merchant selection & user data — no Redux *(ratified; explicit call)*

Explicit direction from Ashish: *"Redux nahi rakhenge — React Query is good to have — user details sessionStorage me, sab merchant ka."* Shape that follows: after login, `user/details` via Query → merchant picker → selection writes `sessionStorage['merchant-mid']` (**the same key today's code reads in 77 places**, so ported code keeps working) plus a `user-details` mirror for sync reads. The shell's `dashboardStore` (17 imports) is replaced by one small hook/util; the old Redux user slice retires. Matches the draft's state.md independently.

### d08 + d36 · Permissions & staff UI *(ratified)*

*"Same rahega — gk-pages allowed hai ya nahi wo existing API me aa hi jata hai, kaam ban jayega."* Existing roles/permissions model, unchanged. A Ratio-native staff & roles section: *"abhi nahi, out of scope"* (v2 candidate — the command registry makes it cheap to add later).

### d09 + d10 · URLs *(ratified)*

`/gk-pages` existed only so the Single-SPA root config knew when to mount the app — an artifact, not a design. **`/store/:storeId/…`**, storeId kept in the path so deep links and multi-store tabs keep working. Old dashboard URLs: *"iski koi tension nahi"* — a redirect stub at cutover.

### d11 · The api client *(ratified)*

Own client with **`makeAPICall`'s exact call signature**, so the 39 call sites port untouched and the data-access migration concentrates in one file; it owns merchant headers (attached in exactly one place), credentials and consistent error behaviour.

### d13 · Breadcrumbs *(ratified)*

The shell's breadcrumb bar (11 call sites) dies with the shell; the component-discoverability need behind it is served by the playground catalog instead — *"ye to hum ek component storybook-lite banayenge"*.

### d14–d16 · Chrome *(ratified)*

IA: *"product finalize kar dega — but humein 2-level nesting support karna hai"* (the build requirement is fixed so the shell can be built without waiting). UI kit: *"nahi — we will create our own"* — gokwik-ui-kit/antd not carried over (a standalone product shouldn't inherit antd's weight and override wars; Radix+Tailwind+tokens instead; acknowledged as the project's single biggest scope item). Global search: *"global search to hum denge yr"* — committed for v1; its mechanism was settled later in d41 when the backend-search constraint surfaced.

### d17 + d18 · "Won't every API have to support us?" *(ratified)*

The worry was that every API would need new work for the new origin. The architecture answer: auth and CORS are both enforced **at the gateway** — inner services trust gateway-verified context and need zero changes. So "support the new app" collapses to **one gateway config**: the exact new origin in the allowlist (wildcards don't work with credentialed requests), `Access-Control-Allow-Credentials: true` (or the cookie never flows), and `gk-merchant-id`/`merchant-mid` in allowed headers (the discount-V2 direct-host incident was precisely a missing header allowlist). What the free pass does **not** cover is anything that bypasses the gateway — direct service hosts, fetch-based uploads, third-party — hence a bypass **audit** with smoke tests from the new origin on staging; *"backend will resolve"* what it finds.

### d19–d21 · Hosting, analytics, cutover *(ratified)*

Real SPA hosting (own index.html, route fallback, CDN) with the detailed pipeline deliberately sequenced last with platform — *"deployment process last me discuss karenge"*. A **separate PostHog project** — *"ye to apne haath me hai, gk-pages ka sab alag se hoga"* (accepted trade-off: historical continuity resets). Cutover: new domain live → dashboard link becomes a redirect → import-map entry removed; **rollback = restore the entry**, so both apps stay deployable through the transition.

### d22 · Error tracking — the Sentry/PostHog/OpsGuard discussion *(ratified)*

Started from zero (*"maine ye kaam kabhi kiya nahi — Sentry, p95 — explain karo"*): what an error tracker does, and why **source maps** matter (prod stack traces are minified garbage — `x.js:1:482917`; maps are the translation file that turns them back into `ProductForm.tsx:142`; uploaded privately, stripped from the bundle so the CDN discloses nothing).

First recommendation was PostHog error tracking — purely to avoid a new vendor. Then the real constraint surfaced: *"hum dono use karte hain — Sentry bhi, PostHog bhi."* That flipped the call, and the tools split by their strengths: **Sentry = what broke** (grouping, releases, readable traces), **PostHog = what users do** (events, funnels, feature flags, Web Vitals); session replay in exactly one tool. Then the alerting question — *"mujhe OpsGuard pe alerts chahiye, possible hai na?"* — and the answer that made it cheap: backend already runs a **Sentry→OpsGuard pipe**; we add our project to it rather than building anything.

### d23 · Performance budget *(ratified)*

*"It is very important, will do this."* Route-level code splitting + an initial-bundle budget enforced in CI (bundles grow silently; a gate catches the +70KB import at the PR). Today's gk-pages — one unsplit bundle — is the anti-example.

### d24 · Security — scoped down deliberately *(ratified)*

The full proposal was headers + CSP + bundle hygiene. Pushback was direct: *"ye zaroori hai? main hata dunga naye wale me?"* — so it was re-cut into launch-mandatory vs deferrable. Then *"frame-ancestors 'none' kya hai, kahan likha jata hai?"* — answered (it's the header that stops anyone iframing the admin for clickjacking; it lives in one CDN response-headers policy, not in code; it doesn't affect what *we* embed, so the visual-editor iframe is safe). Final call by Ashish: **HSTS + frame-ancestors/XFO + Referrer-Policy + Permissions-Policy mandatory; full CSP not now** — deferred to a post-launch Report-Only → enforce rollout. Recorded as a deferral, not a deletion: the old dashboard has CSP today, so its absence would be an audit finding.

### d25 + d30 · Monitoring — trimmed to what backend doesn't own *(ratified)*

Key scoping input from Ashish: *"SLO wala part backend me hai — API slow ho toh unka alert aata hai, on-call dekhta hai; mujhe p95/p75 ki zaroorat nahi."* Correct — with one carve-out: backend monitoring ends at the server; the browser half (bundle parse, render, INP) is invisible to it. So: **no FE SLO dashboards, no latency alerting** — just PostHog Web Vitals autocapture as zero-effort insurance for the day someone says "it feels slow", plus one synthetic **is-the-site-up** check (login page + an API round-trip) with CDN alarms into the same OpsGuard pipe — because backend's on-call doesn't watch our domain.

### d26–d29 · Boundaries, flags, CI gates, UX baseline *(ratified in bulk — "close the rest per your recommendation")*

- **d26:** route-level ErrorBoundaries with retry + one global crash page; **blank screens banned** — today's single-spa wrapper literally `return null`s on crash, sections vanish silently; that pattern dies here.
- **d27:** PostHog feature flags — percentage/per-merchant rollout and kill-switches (rollback = a toggle, not a deploy); launch itself can ride a flag (ties to d03 phased rollout).
- **d28:** blocking CI gates (lint, types, tests, budget, audit) + a staging Playwright smoke as the deploy gate.
- **d29:** every screen ships skeleton / empty-with-CTA / error-with-retry / ready, keyboard-operable, AA contrast — via PR checklist and the scaffolder's page template.

### d31 · Data layer — and the React Query freshness debate *(ratified; genuinely argued)*

The honest objection, verbatim in spirit: *"mujhe React Query se dikkat hai — mujhe kuch cache NahiN karna, ye dashboard hai, har second updated value dikhani hai."* The resolution reframed what cache means: Query's model is **stale-while-revalidate** — show the cached result instantly *while fetching fresh in the background* — so the cache kills skeleton flashes, it never serves old data as final. The counter-intuitive part: plain `useEffect` fetching is *staler* (it fetches once on mount and never again; a 20-minute-old tab shows 20-minute-old data), while Query gives focus-refetch and polling. Settled then as freshness-first defaults; **superseded by d42's merge** (architecture defaults + explicit zero where it matters + safety nets). The rest of d31: query keys **`[domain, merchantId, params]` with merchantId first and mandatory** (cross-merchant cache bleed is a security bug, structurally prevented), and pragmatic Zod — `safeParse` + Sentry log on critical reads (detect backend drift without breaking pages), **hard parse for money** (a wrongly-parsed price must stop, not render), full schema coverage an explicit non-goal.

### d32–d35 · Release engineering, assets, hygiene, docs *(ratified in bulk; d35 refined in d42)*

Previews (QA-backend only, env baked at build), git-tag versioning stamped into bundle + Sentry (rollback = repoint), contenthash + no-cache index + CDN invalidation ("hard refresh" is a bug), image CDN/lazy/skeleton-first, Renovate + audit gate. Docs: *"main Confluence pe rakh sakta hoon properly"* — yes, that's where the team reads; see d42 for the in-repo exception.

### d37 · Contribution guardrails — the problem that started the architecture phase *(ratified; problem-first)*

The problem, as stated: *"backend wale aate hain, apne Claude se jaisa marzi code likhwa lete hain, phir bolte hain frontend me support nahi hai. Mujhe code me instruction daalna hai aur aisa pattern banana hai ki koi bhi third person aaye, code hamare level ka hi bane."* The solution's logic: **instructions alone stop nobody — machines enforce, recipes teach, and the paved road makes right the fastest path.** Four layers: recipe-style CLAUDE.md (AI agents follow steps, not policy prose; nested + AGENTS.md for other tools) · a **scaffolder** (`new:resource` generates correct-by-construction skeletons — the generated code *is* the pattern, so contributor creativity goes into business logic, not structure; this was the piece Ashish rated highest) · lint boundaries + pattern bans · CODEOWNERS as the human backstop. Standing milestone: the kit + one golden exemplar must exist early — they're the copy-source every recipe points to.

### d38 · UI-kit lockdown — the pink-tag problem *(ratified; problem-first)*

The problem, as stated: *"kisi ko bhi UI/basic components me add ya delete karne se block karna hai. Maine blue tag banaya, kisi ko pink chahiye — to wo request raise kare, hum change karenge; khud kare to approval ke bina merge na ho."* Three locks plus a door: **CODEOWNERS on `/src/ui/`** (GitHub itself blocks the merge — exactly the "without approval" requirement) · **closed component APIs** — the subtle lock: if `Tag` accepted a style/className prop, pink could happen inside a feature without touching the kit, invisible to CODEOWNERS; with a closed variant list, *pink cannot be expressed* without a kit change, which triggers the owners — the API design enforces the process · lint closing the bypasses (raw elements, kit-internal imports, shadow components). The door: a change-request flow so legitimate needs land fast (slow doors breed shadow kits — how design systems die). Catalog: **Storybook-lite** — a non-prod `/playground` route — chosen over full Storybook (tooling tax while the kit is young) via explicit option pick. Packaging: **in-repo folder**, not an npm package — discussed head-on; publish-bump-install cycles would kill build-phase velocity; written triggers for revisiting (a second consumer app, or repeated bypasses).

### d39 · AI-native repo *(ratified; problem-first)*

Raised by Ashish as its own topic: *"aajkal sab Claude/Codex se hi kaam kar rahe hain — iske liye kaise banayein?"* Gaps identified in today's gk-pages setup: knowledge trapped in one person's AI sessions; five developers = five prompting styles; AI-sized PRs collapsing review; per-laptop AI behaviour. Four pieces, each mapped to a gap: **committed `.claude/skills/`** (shared workflows — prompt quality becomes a repo property) · **team `mistakes.md`** (one person's debugging pain becomes every AI's permanent knowledge, by PR) · an **AI-PR contract** (small PRs, author ran it, tests included; reviewers ask "is this our pattern?" — "does it work" is CI's job) · **committed `.claude/settings.json`** (uniform permissions, secrets reads denied). Confirmed with an explicit problem→solution mapping on the tracker.

### d40 · Adopting the draft's stack — after real scrutiny *(ratified)*

The five adoptions weren't rubber-stamped; each survived a "why?" round:

- **TanStack Router** — because our view state lives in the URL, and it gives typed routes + Zod-validated search params (a path typo is a compile error; `?page=banana` never reaches code). React Router would mean hand-parsing exactly the state we care most about.
- **Zustand** — challenged against "no Redux". Resolution: the banned thing was *server data in a store*, which stays banned in Zustand too; Zustand is a zero-boilerplate global `useState` for UI flags only.
- **Registries** — the breakthrough came from Ashish's own summary: *"to basically ye aisa hai ki function ek file me likh diya, wahi function har jagah use ho raha hai"* — exactly. Then the strongest objection: *"hamara backend kaafi unstable hai — order/product APIs alag ho sakti hain."* The answer flipped it into the pattern's best argument: when every endpoint is referenced in exactly one file, a backend change is a one-file edit with every surface fixed at once; per-service transformers quarantine the inconsistencies (snake/camel, staff_id vs staffId) at the door; Zod drift-logging alarms us before merchants notice. The more unstable the backend, the more the single choke point pays.
- **XState v5** — motivated by the double-save/boolean-soup class of bugs: a flow with three booleans has eight states, five of them nonsense; a machine has exactly the states that exist, so "Save clicked twice during saving" is ignored *by design*. Scoped to multi-step flows only.
- **Vite** — admin behind login: no SEO, no SSR need; Next.js rejected (its SSR also complicates the cookie story).
- Also checked: **is any of this actually standard, and what's the profit?** Each piece has mainstream prior art (CQRS, VS Code's command registry, React-Admin's resources, Shopify's bulk/extensions, MCP tools) — the pattern is standard, only the assembly is ours; and the profit math is our scale (11 entities × 5 surfaces × outside contributors × an AI assistant). The honest counter was stated too: for a 3-screen tool this would be overkill.

### d41 · Scope — how far the registry goes *(ratified; the hardest-won one)*

Driven by Ashish's questions in sequence: *"kis extent tak karna hai?"*, then — unsatisfied with the first answer — *"kahan tak kar payenge?"*, then *"profit kya hai, standard hai kya?"* The settled frame:

- **Writes = 100% commands, no exceptions.** The safety property everything else depends on — one bypassed write endpoint is an unsafe path for the AI assistant.
- **The registry is a plumber, not a UI generator.** The ~11 table+form entity screens are definition-driven; complex UIs (variant matrix, image uploader) are hand-built components **plugged into** definitions — the registry carries their fetching/saving/errors/cache so the component only carries the experience; bespoke screens (visual editor, analytics, onboarding) are normal feature code whose writes still go through commands. The screen-by-screen walkthrough of today's actual pages is what produced satisfaction here.
- **⌘K: palette-lite only.** Ashish's constraint ended record search: *"palette wala kaam nahi karenge — hamara backend search support nahi karta."* But two of the palette's three parts (navigation, actions) need zero backend and come free from the registry — kept. The same constraint re-scoped d16's global search: reuse the per-entity **list APIs' search params** across 2–3 entities in parallel; no new backend ask.
- **XState ownership:** 2–3 machine authors; everyone else consumes hooks and never sees XState — contains the learning curve; the 3-steps/3-booleans rule is review-enforced to prevent machine-everything zeal.

### d42 · The last three calls *(ratified — closes the Aman-alignment agenda)*

- **Repo: fresh codebase.** The one structural disagreement (discovery leaned in-place for history; the draft leaned fresh for the registry skeleton). Called fresh by Ashish; parity preserved by lifting domain logic/transformers selectively.
- **Freshness: the draft's defaults win** (lists 30s / detail 60s / lookups 10min) **+ explicit `staleTime: 0` wherever freshness matters** — Ashish's own formulation: *"Aman wala choose karte hain; jahan chahiye hoga wahan 0 explicitly daal denge — chalega na?"* It works, with one asymmetry acknowledged: the failure mode of a forgotten override is **silent stale data** (vs. a harmless extra API call the other way). Two safety nets close it: `refetchOnWindowFocus: true` globally, and the scaffolder requiring an explicit `staleTime` on every resource — forgetting is structurally impossible.
- **Docs: Confluence** — with one non-negotiable exception: `CLAUDE.md`, `mistakes.md`, `.claude/skills/`, `.claude/settings.json` stay **in-repo**. They are not documentation; they are the AI contributors' operating system (d37/d39 depend on agents reading them from the repo).

---

## 3. How the two workstreams merged

| Area | Discovery had | Draft had | Final |
|---|---|---|---|
| Server state, no Redux, URL-as-state, Zod, own kit | ✓ | ✓ | Same — converged independently |
| Auth / domain / entitlement | Code-verified facts | Identical conclusions | Same |
| Router / build tool | React Router / webpack (assumed) | TanStack Router / Vite | **Draft adopted** (d40) |
| Data-layer shape | Feature folders + api files | Resources/commands registries | **Draft adopted, scope-bounded** (d40/d41) |
| Flows | — | XState v5 | **Draft adopted + ownership model** (d41) |
| Ops layer (Sentry→OpsGuard, security, uptime, release engg, budgets) | ✓ fully decided | — | **Discovery contributed** |
| Contribution & AI (d37/d38/d39) | ✓ | — | **Discovery contributed** |
| Repo strategy | in-place lean | fresh lean | **Fresh** (d42) |
| Freshness | staleTime-0 default | 30s/60s defaults | **Draft defaults + explicit 0 + safety nets** (d42) |
| Docs home | Confluence | in-repo | **Confluence; AI files in-repo** (d42) |

## 4. Proposed defaults (NOT yet ratified)

These arrived as recommendations inside bulk-closed decisions and were never individually discussed. They are sensible suggestions awaiting a team call — not commitments. Promote or strike during review:

1. PR size guideline ≤ ~400 lines (d39's contract)
2. Component size guideline ~150 lines (principles)
3. Kit change-request SLA of 1–2 days (d38's door)
4. Uptime check cadence (per minute) (d25)
5. Flag-debt cleanup rule (d27)
6. Browser-support matrix as a written one-pager (d34)
7. PII masking policy as a named doc (d35)
8. Tracking-plan naming convention `object_verb` snake_case (d35)
9. "Runbook written before launch" sequencing (d35)
10. "Renovate on only after the repo settles" timing (d34)
11. "Fix/quarantine the 7 legacy failing suites before gates go blocking" (d28)
12. Login rate-limit confirmation with backend (d24 adjunct)
13. Testing specifics: MSW for integration tests, zero snapshot tests, role-based queries (principles)
14. The "Rejected:" alternatives recorded per decision above are the author's analysis of the discussion, not separately ratified statements

## 5. Answers to the draft's `open-questions.md`

| OQ | Answer |
|---|---|
| 1 (fresh vs reuse) | **Resolved: fresh** (d42) |
| 2 (name/subdomain) | Name **Ratio** (d01); gokwik.in subdomain **mandatory** — cookie behaviour, verified (d02/d06); exact name open with product |
| 3 (gateway CORS) | Scoped (d17): exact origin + Allow-Credentials + merchant headers; one config, services untouched |
| 4 (login from new origin) | Confirmed with backend; not a blocker (d05); "who am I" = `user/details` |
| 8 (hosting/CI) | Shape decided (d19/d32); detail with platform near the end |
| 9 (gateway bypasses) | Categories identified + audit/smoke-test plan (d18); backend resolves |
| 15 (activity log) | v1 = PostHog only (consistent with d35) |

**Nothing is open between the two workstreams. Next: the implementation plan.**

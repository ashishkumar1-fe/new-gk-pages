# 08 — Bugs & debugging

[← Engineering](README.md) · Decisions: d44, d45 (builds on d22, d26, d28, d32, d39, d41)

**The problem.** A product manager reads a Jira ticket, hands it to Claude and says "fix this". The PM does not know the code. The merchant who reported it knows even less. If the app does not collect the evidence itself, the AI guesses, and a guessed fix is worse than no fix.

**The answer.** The app gathers the evidence, the code is laid out so evidence leads straight to a file, and Claude follows a written intake + fix procedure ([`.claude/skills/fix-bug/SKILL.md`](../../.claude/skills/fix-bug/SKILL.md)).

> Analogy: a hospital. The patient only says "my stomach hurts". The lab report, the body map and the follow-up test do the rest. The reception desk asks the missing questions before the doctor's time is spent.

---

## 1. The error screen carries its own evidence (d44)

Every route has an ErrorBoundary (d26). When it catches a crash it shows a friendly message for the merchant and, below it, a **support box**. One screenshot of this screen must be enough to start debugging.

```
┌──────────────────────────────────────────────┐
│  😕 Something went wrong                      │
│  This section couldn't load.      [ Retry ]   │
│                                              │
│  ─────────────── for support ───────────     │
│  Error ID   K7F3-2Q9A                        │
│  Page       /store/123/orders/98765          │
│  Filters    status=pending · page=3          │
│  Time       17 Oct 2026, 2:39 PM             │
│  Version    1.4.0+a1b2c3                     │
│  Store      12wyqc2guqmkrw6406j              │
│  Last API   GET /orders/98765 → 500          │
│             req bb1fefd3                     │
│  Steps      Opened Orders → Opened order     │
│             98765 → Clicked "Refund"         │
│                                     [Copy]   │
└──────────────────────────────────────────────┘
```

### What the box shows

| Field | Source | Why it is safe to show |
|---|---|---|
| **Error ID** | Short code generated per crash, attached to the Sentry event as a searchable tag | Opaque reference, no data |
| **Page** | Current route | The merchant's own URL |
| **Filters** | Validated search params (TanStack Router, d40) — the URL already holds the exact screen state | Same |
| **Time** | Client timestamp | — |
| **Version** | `__APP_VERSION__` stamped by CI (d32) | Public anyway |
| **Store** | Active merchant id | The merchant's own id |
| **Last API** | apiClient's last failed call: method, path, status, first 8 chars of `X-Request-Id` | Address and status only, never the body |
| **Steps** | Last 3–5 navigations/commands, in human words (command labels from `defineCommand`) | *What* was done, never *what was typed* |

### What the box never shows (it lives in Sentry, behind the Error ID)

| Not shown | Why |
|---|---|
| Stack trace / file names | Exposes our internals — same reasoning as "no public source maps" (d24) |
| Request / response bodies | May contain customer name, phone, address; screenshots travel through Jira and chat |
| Full breadcrumb list | Long, and may carry data; the short "Steps" is enough on screen |

**Rule of thumb: the screen says *where and what happened*; Sentry holds *what was inside*.**

### Practical details

- **Short Error ID** (`K7F3-2Q9A` style). Long UUIDs get misread in screenshots (`0/O`, `1/l`). Request-id is shown as its first 8 characters — enough for a backend log search.
- **[Copy] button** copies the same fields as text. The screenshot is the main path; text removes any misreading.
- The box uses small grey type below the friendly message — informative for support, not alarming for the merchant.

## 2. Bugs that don't crash — "Report a problem" (d44, d45)

A wrong total or the wrong action never reaches an ErrorBoundary. The help menu has **"Report a problem"**, which opens the same support box (without a crash Error ID, with a fresh one for the report) plus:

- the **last 5 commands** from the command log (§4), and
- a **link to this session's replay** (§5).

## 3. Frontend bug or backend bug — settled by `X-Request-Id` (d44)

Verified on the current gateway: **Envoy already generates `X-Request-Id`** on every response — the frontend does not send it (no code in gk-pages, dashboard-ui or `@gokwik/utilities` sets it). But the header is **not in `Access-Control-Expose-Headers`**, so browser JavaScript cannot read it cross-origin (DevTools can; our code and Sentry cannot).

Needed:

| Change | Owner |
|---|---|
| Add `X-Request-Id` to `Access-Control-Expose-Headers` — part of the same gateway CORS change already planned for the new origin (d09) | Backend / gateway |
| Confirm the services log this same id | Backend (question, not yet confirmed) |
| apiClient reads the id from every response and adds it to the Sentry breadcrumb | Us — one place |

Result: when the API returned wrong data, the ticket gets "backend bug, request-id `bb1fefd3…`, this came back, this was expected" — and backend searches its logs by that id. **Hiding a backend bug inside a frontend transformer is not allowed**; it would never get fixed at the source.

## 4. Silent bugs — prevent, catch, see (d45)

A silent bug: nothing crashes, but the wrong thing happens (wrong API, wrong amount, wrong flow step).

> Analogy: a bank. The cashier checks the slip before paying (prevent), every transaction goes into the passbook (record), CCTV settles disputes later (see).

### Prevent — before production

- **Every command has a test** asserting it calls *this* endpoint with *this* payload. A wrong endpoint turns the test red and CI blocks the merge (d28).
- **Outgoing payloads are Zod-checked** inside the command (not only incoming data, d42). A wrong shape — amount not in paise, empty order id — never leaves the browser.
- **Multi-step flows are XState machines** (d40): the machine is a map of allowed steps, so an illegal step is impossible and every path is testable.

### Catch — while it happens

- **Command log ("passbook").** All writes go through `runCommand` (d41), so one place records every action as a Sentry breadcrumb:
  `order.refund → POST /orders/98765/refund → 200 · req bb1fe…`
- **Invariant checks.** Things that must always be true — refund ≤ order total, saved data equals what was sent, discount not negative. A broken invariant **does not crash the page**; it sends a silent Sentry event so we hear about it before the merchant does.
- **Handled API failures still reach Sentry.** A 4xx/5xx that the UI turned into a toast is still reported once, from the apiClient.

### See — afterwards

- Session replay (§5) and the "Report a problem" box (§2).

## 5. Tools — one job each (d22 updated by d45)

| Tool | Job |
|---|---|
| **Sentry** | Errors, Error IDs, alerts → OpsGuard. Sentry replay **off**. |
| **PostHog** | Events, flags, Web Vitals and the **debugging replay** — video with the network calls and console errors alongside. |
| **Microsoft Clarity** | UX: heatmaps, rage clicks, dead clicks. |

Notes:

- Today Clarity is loaded by the root config (`dashboard-ui-configuration/src/index.ejs`) with a `merchant-mid` tag set in `dashboard-ui/src/root.component.tsx`. **Ratio has its own `index.html`, so Clarity must be added there explicitly**, with the same merchant tag and `clarity.ms` allowed in CSP.
- Two recorders run, so **all inputs are masked in both** and recording is **sampled** (not every session).
- Replay is for humans. Claude cannot reliably "watch" it; Claude works from the command log and Sentry, which are text.

## 6. Ticket → fix — the whole path

```
Merchant/PM ──screenshot──▶ Jira ticket (template: page link, what happened vs expected, Error ID/screenshot)
                                │
                                ▼
                     Claude (fix-bug skill)
                       ├─ reads ticket (Jira MCP)
                       ├─ opens Error ID in Sentry (Sentry MCP): trace, breadcrumbs, release
                       ├─ reads request-ids / command log
                       └─ classifies into one of 4 buckets
                                │
     ┌───────────────┬──────────┴─────────┬──────────────────┐
  FE bug          BE bug              Not a bug          Info missing
  failing test    Jira comment with   explain in plain   ONE Jira comment,
  → fix → PR      request-id + got    words, change      all questions,
  + preview link  vs expected         nothing            plain language
     │
     ▼
  Developer reviews the code (CODEOWNERS) · PM checks behaviour on the preview link (d32)
```

**Two separate checks:** the PM verifies *behaviour* ("it looks right now"), the developer verifies *code* ("it's our pattern, not a hack").

The code map that makes "evidence → file" deterministic — the same for every resource because the scaffolder generates it (d37):

```
URL /store/:id/orders/:orderId
 └→ route file → resource (orders) → endpoint file (one per API) → transformer → command
```

## 7. Jira bug template

Only what a PM can provide without knowing code:

1. **Page link** — copied from the browser address bar
2. **What happened** / **what should have happened** — two lines, plain words
3. **Error ID or screenshot** of the support box, if one appeared
4. *(optional)* video, every time or sometimes, approximate time, one merchant or many

Everything else Claude collects itself (see the skill).

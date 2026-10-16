# 07 — Data & state policy

[← Engineering](README.md) · Decisions: d31, d41, d42 · Base: [architecture/state](../architecture/docs/state.md), [resources/data-access](../architecture/resources/data-access.md)

The final, agreed refinements on top of the architecture's state and data-access docs.

## Freshness policy (d42 — final)

**Defaults follow the architecture's data-access policy:** lists 30 s, detail 60 s, lookups 10 min. **Wherever freshness matters, set `staleTime: 0` explicitly** on that resource.

Two mandatory safety nets, because the failure mode of a forgotten override is *silent stale data*:

1. **`refetchOnWindowFocus: true` globally** — returning to the tab always revalidates, regardless of any staleTime.
2. **The scaffolder requires `staleTime` as an explicit field** on every resource definition — the template cannot be completed with it blank, so every resource gets a conscious freshness decision.

Live screens (today's orders, job progress) add `refetchInterval` (5–30 s). `calculate`-style endpoints are never cached.

## Query keys (d31)

`[domain, merchantId, params]` — **merchantId first and mandatory.** A merchant switch clears the cache; keys can never collide across merchants (cross-merchant cache bleed is a security bug, not a UX bug). `merchantId` stays out of domain entities — it lives in keys and headers only.

## Zod at the boundary (d31)

- **Critical reads** (`user/details`, product/order list & detail): `safeParse` + Sentry log on mismatch — the page renders anyway; we learn about backend drift before merchants do. Never crash the page for a drifted optional field.
- **Money values:** **hard parse.** A wrongly-parsed price must stop, not render (amounts are integer paise — [schema/conventions](../architecture/schema/conventions.md)).
- Schemas accompany new code; **full coverage is explicitly a non-goal.**

## Unstable-backend containment (d41)

- Every endpoint is referenced in **exactly one place** (a command's `run` or a resource's provider) — a backend change is a one-file edit, with every surface fixed at once.
- **Per-service transformers** normalise backend inconsistencies at the door (snake/camel case, `staff_id` vs `staffId`, service URL quirks). Inside the app, shapes are always clean and camelCase.
- Zod drift-logging (above) is the alarm system: we find out the day the backend changes, not the week a merchant complains.

## Registry scope (d41 — where the pattern applies)

| The thing is… | Treatment |
|---|---|
| Changing data (save, delete, refund, import…) | **A command. Always. No exceptions.** Screens never call write endpoints. |
| A table+form entity screen (the ~11 resources) | A resource definition drives list/editor/search. |
| A bespoke experience (visual editor, analytics, onboarding) | Normal feature code — the registry's UI role is zero — but its writes still go through commands. |

The registry is a **plumber, not a UI designer**: complex UIs (variant matrix, image uploader) are hand-built components plugged into definitions as sections; the registry carries their fetching, saving, errors and cache so the component only carries the experience.

## Command palette scope (d41)

**Palette-lite only:** navigation + actions — both zero-backend (they read the registries). **Record search is dropped** (no backend search support). Global search (d16) is served by reusing the per-entity **list APIs' search params** across 2–3 entities in parallel.

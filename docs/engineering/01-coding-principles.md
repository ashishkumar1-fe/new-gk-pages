# 01 — Coding principles

[← Engineering](README.md)

The twelve rules every PR is judged against. Where a rule can be machine-checked, it is (lint/CI — see [02](02-contribution-guardrails.md)); reviewers spend their attention only on what machines can't judge.

## 1. One-way layers

`app → features/resources → ui/platform → lib`. A layer never imports from a layer above it; a feature never imports another feature's internals (only its public `index.ts`). ESLint-enforced. See [architecture/structure](../architecture/docs/structure.md).

## 2. Colocation — rule of three

A component's styles, tests, hooks and schemas live next to it. Nothing moves to a shared location until its **third** use. Global `helpers/`, `constants/`, `types/` dumping grounds are banned.

## 3. One home per state

| The data is… | Home |
|---|---|
| From the server | TanStack Query cache — and nowhere else |
| How a list is being viewed (filters, sort, page, tab) | **URL search params** (typed + Zod-validated by the router) |
| A UI flag shared across components | Zustand (sidebar collapsed, open modal, selection) |
| Local to one component | `useState` |
| A multi-step flow | XState machine ([architecture/machines](../architecture/docs/machines.md)) |

Banned (lint): copying query data into any store or `useState`; `useEffect`-driven fetching; any server data in Zustand; Redux. Freshness policy details: [07](07-data-policy.md).

## 4. Composition over configuration

Compound components (`<Table.Toolbar>…`), never 30-prop mega-components. A new use case is a new composition, not a new prop.

## 5. Unidirectional data

Props down, events up. Siblings communicate by lifting state, the URL, or the query cache — never event buses or window events.

## 6. Make impossible states impossible

Union types over boolean soup:

```ts
type SaveState =
  | { status: 'pristine' }
  | { status: 'dirty' }
  | { status: 'saving' }
  | { status: 'error'; error: ApiError };
```

Three booleans have 8 combinations, 5 of them nonsense. A union has exactly the states that exist. Flows with 3+ steps graduate to a machine.

## 7. Parse, don't validate

Everything that crosses a boundary (API response, URL params, storage) is parsed with Zod **at the boundary**; inside, code trusts types. Types come from schemas (`z.infer`) — never hand-written twice. Policy details (safeParse vs hard parse, which endpoints): [07](07-data-policy.md).

## 8. Four states per async UI

Every data-backed screen ships **skeleton / empty-with-CTA / error-with-retry / ready** — designed, not improvised. The scaffolder's page template contains all four; deleting one needs a reason in the PR.

## 9. Testing Trophy

Mostly **integration** tests (Testing Library + MSW: "user searches, sees results"), some **unit** tests for pure logic (money, rules, transformers), a few **Playwright smokes** (login → list → save), **zero snapshot tests**. Query like a user: `getByRole('button', { name: 'Save' })`; `getByTestId` is a last resort.

## 10. Boring > clever; AHA

Duplicate up to three times before abstracting — the wrong abstraction costs more than duplication. ~150-line component guideline; past ~250, split. The review question is never "does it work?" (CI's job) — it is "will a new dev understand this in six months?"

## 11. Accessibility by default

Semantic HTML first; ARIA only where semantics can't express it; every flow keyboard-operable; focus visible; AA contrast. Built into the UI kit once (Radix underneath), inherited by every feature.

## 12. Machines do style

Prettier, ESLint, strict TS (`any` is an error; escape hatch is `unknown` + narrowing) run in CI. A style comment in review means a missing lint rule — add the rule, don't repeat the comment.

# Testing and release

How a change is checked, from the first line of code to production. There is no separate QA phase: tests live next to the code they test, hooks run them before code leaves the machine, CI repeats them on the PR, and a two-minute smoke on staging gates the release.

## 1. What runs where

| Moment | Who runs it | What | Time |
|---|---|---|---|
| File saved by an AI session | `.claude/settings.json` PostToolUse hook | `eslint` on that file (layer boundaries) | instant |
| `git commit` | husky `pre-commit` → `lint-staged` | prettier (auto-fix) + eslint (zero warnings) on staged `.ts/.tsx/.css/.json` | 1–2 s |
| commit message written | husky `commit-msg` → `scripts/check-commit-msg.mjs` | `[Type]: one line` format | instant |
| `git push` | husky `pre-push` | `typecheck` · `lint` · `check-format` · `test` · `build` | ~15 s |
| PR opened / updated | GitHub Actions `ci.yml` | the same five, plus every commit message, plus bundle budget (900 KB) | ~2 min |
| PR preview | CI (spec d32, not wired yet) | a URL per PR on the QA backend; the reporter verifies behaviour there | |
| Merge → staging | Playwright smoke (spec, not written yet) | login → pick merchant → products list → one save | 2 min |
| Release | a person | tag → prod with approval; rollback = repoint to the previous tag | |
| Runtime | Sentry / PostHog (placeholders in `platform/telemetry.ts`) | exceptions with release version, Zod drift events, command audit | |

Hooks can be skipped with `--no-verify`; CI cannot. Do not skip; fix.

## 2. Tests by layer

Each layer answers one kind of question, with the lightest possible test. Lower layers have many cheap tests; the top has two heavy integration tests that cover all six layers at once.

| Layer | File | Question | How |
|---|---|---|---|
| domain | `domain/<entity>/rules.test.ts` | Is the rule right? ("COD orders cannot be refunded") | pure function, no React, no network |
| api | `api/<service>/<entity>.test.ts` | Does the recorded response parse? Does the transformer produce the domain shape, and send integer paise back? | fixture JSON through wire schema and transformer |
| api | `api/_shared/errors.test.ts` | Does each HTTP status map to the right `CommandResult`? | ApiError in, result out |
| commands | `commands/<entity>.test.ts` | **Exactly** which endpoint and payload did the command send? Right toast, right invalidation? | MSW node server; request events captured and asserted |
| commands | `commands/runCommand.behaviour.test.ts` | Engine rules: retry on 5xx only for idempotent commands, never on 4xx; partial results; optimistic rollback; bulk caps; confirm thresholds | throwaway commands registered per test |
| machines | `machines/<flow>/machine.test.ts` | States and transitions; recordSave queues one follow-up save | XState actor, no React |
| routes | `routes/_templates/ListPage.test.tsx`, `EditorPage.test.tsx` | Does `/products?view=draft` render only drafts? Does an edit save through the command and show field errors? | memory-history router + React Query + MSW node + jsdom |
| platform | `platform/permissions.test.ts` | scope → backend permission mapping, `ENFORCE` behaviour | |
| assistant | `assistant/tools.test.ts` | Tools are generated from command cards with the right annotations | |

Tools: Vitest (runner), jsdom (DOM in Node), Testing Library (query the screen like a user), MSW (the same mock backend `npm run dev` uses). Tests run in `src/`, next to the file they test, included by `vite.config.ts` → `test.include`.

## 3. Adding a feature: which tests to write

Example: "Archive button on orders; archived orders leave the list."

1. `domain/order/rules.ts` → `canArchive`. Test: open → true, cancelled → false. Write this first; it is the logic.
2. `api/os-order` → turn the `bulkArchive` stub into a typed function. Record the sandbox response into `fixtures/`, shape `wire.ts`, write the transformer. Test: fixture parses; transformer output matches the domain shape.
3. `commands/order.ts` → fill the `archive` card (`enabled` from the rule, `invalidates` order lists, `onSuccess` toast). Test: exact endpoint + payload via MSW capture, and the invalidation.
4. `resources/order.ts` → the id is already in `commands.row`. No change, no new test.
5. `routes` → nothing. The template is already tested.

One feature, three small tests, each in its own layer. `npm run new:command` scaffolds the command test for you; replace the expected payload with the real one.

## 4. What tests cannot catch, and what catches it instead

| Problem | Caught by |
|---|---|
| A component imports an api client, or `fetch`, or XState | ESLint boundaries (hook on save, pre-commit, CI) |
| Rupees passed where `Money` is expected | TypeScript (`typecheck`) |
| Backend changed a response shape | `safeParse` + `reportDrift` at runtime → Sentry; then the fixture test when the fixture is refreshed |
| The deployed app does not boot, login or save against the real staging backend | Playwright smoke (deploy gate) |
| A regression only a person would notice | PR preview, verified by the reporter |

## 5. Fixing a bug

`.claude/skills/fix-bug`: write a **failing test first** that shows the bug. If you cannot make it fail, you have not understood the bug; go back to the report. Then fix, the test goes green, the suite stays green, small PR with the preview link on the ticket. Propose a `mistakes.md` entry if the trap could catch someone again.

## 6. Commit message rule

```
[<Type>]: <one-line description>
```

`Type` is `Hotfix` | `Bugfix` | `Feature`. `Refactor` | `Chore` | `Docs` | `Test` only when none of the three fit. One line, under 100 characters, no body, no footer, no `Co-Authored-By`. `Merge …` and `Revert …` (git-generated) pass. Enforced by `commit-msg` locally and by CI on every commit in the PR.

```
[Feature]: Add archive command for orders with canArchive rule
[Bugfix]: Keep variants when setStatus sends bulk-update
[Hotfix]: Handle null customer in orders table
```

## 7. Commands

```
npm test                 # all tests once
npm run test:watch       # watch mode
npx vitest run --changed origin/main   # only tests related to your diff
npm run typecheck · npm run lint · npm run check-format · npm run build
npm run format           # fix formatting everywhere
```

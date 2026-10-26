# Ratio — contributor recipes

Read this first. Then `docs/mistakes.md`. Recipes, not prose.

## New entity screen?
1. `npm run new:resource <name>` (asks: service, cache class, route). It generates domain, api functions, fixture, MSW handlers, resource card, command cards, tests and registry entries.
2. Record a real sandbox response into `src/api/<service>/fixtures/<name>.list.json` and shape `<name>.wire.ts` from it.
3. Port rules into `src/domain/<name>/rules.ts`, one function per rule, each with the gk-pages source line in a comment and a test.
4. Fill `src/resources/<name>.ts` by copying `src/resources/product.ts`. Pages, routes, sidebar and search come from the registry; do not write a page.
5. `npm test`, `npm run typecheck`, `npm run lint`.

## New action?
1. Add a `defineCommand` card in `src/commands/<resource>.ts` (copy one from `product.ts`). Set `effect`, `confirm`, `steps`, `invalidates`, `expose`.
2. Reference its id from the resource (`commands.page / row / bulk / more`). Never call an endpoint from a component.

## Where does this go?
- Knows HTTP, cookie, headers, env → `platform/`
- Knows one backend service's shape → `api/<service>/`
- Knows an entity's rules → `domain/<entity>/rules.ts`; display → `format.ts`; shared → `domain/shared/`
- Knows React / DOM → a hook under `routes/_hooks/` or `features/`
- Knows nothing about the app → `lib/`

## Forbidden (lint errors)
- `fetch` / `axios` outside `platform/http`
- fetching in `useEffect`; server data in Zustand; mutating query data
- a component calling an `api/*` client function or a write endpoint
- XState imports in components (use the machine's hook)
- raw hex / px / arbitrary Tailwind values / `className` on kit components; raw `<button>` `<input>` in features. Need a new size or colour? Add a token in `config/tailwind.js`, do not inline it.
- `any`

## Repo layout
Root holds only what identifies the project (package.json, tsconfig.json, index.html, CLAUDE.md, README). Every tool config lives in `config/` (eslint, prettier, tailwind, postcss, vite + vitest setup, plop + templates); npm scripts pass the paths, so always run tools through `npm run …`. Scripts in `scripts/`, the mistakes log in `docs/mistakes.md`.

## Layers (import only downward)
surfaces → machines → contracts (resources, commands) → api → domain → platform → lib. `ui/` is a side layer used only by surfaces.

## Git rules (enforced by husky)
- **pre-commit**: `lint-staged` formats (prettier) and lints (eslint, zero warnings) only the staged `.ts/.tsx/.css/.json` files. Seconds.
- **commit-msg**: `[Type]: one-line description`. Type is `Hotfix` | `Bugfix` | `Feature`; `Refactor` | `Chore` | `Docs` | `Test` only when none of the three fit. One line, under 100 chars, no body, no footer, no Co-Authored-By. `scripts/check-commit-msg.mjs`.
- **pre-push**: everything CI runs: `typecheck`, `lint`, `check-format`, `test`, `build`. Red = push blocked. Fix, do not `--no-verify`.
- CI repeats all of it on the PR plus the bundle budget, so a hook skipped locally still fails the PR.
- Format is prettier (`config/prettier.json`: 140 cols, single quotes, trailing commas). `npm run format` fixes everything; never argue about style in review.

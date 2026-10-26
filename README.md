# Ratio

Standalone admin for GoKwik merchants: the replacement for gk-pages. This repo is the **architecture skeleton**: every layer, service module, entity, resource card, command card and machine exists once, in the place the architecture says it lives. The product slice is fully working end to end; everything else is a typed stub that throws `NotImplemented` until it is ported with a recorded fixture.

Reference: `docs/trd/ratio-code-architecture.md` (and `docs/architecture/` underneath it).

## Run

```
npm install
npm run dev          # http://localhost:5173/store/demo-store/products  (MSW mocks on)
npm test             # vitest
npm run typecheck    # tsc --noEmit
npm run lint         # eslint + layer boundaries
npm run build
npm run new:resource # plop scaffolder: one entity across every layer
```

## Layers (imports only go downward)

```
src/
├── lib/            cn, id, notImplemented                       (no app knowledge)
├── platform/       http client · config · merchant · session · permissions · flags · events · telemetry · query/{queryClient, cachePolicy, pollPolicy}
├── domain/         one folder per entity: schema.ts (Zod) · rules.ts (pure, cites gk-pages line) · format.ts · rules.test.ts
│   └── shared/     money (paise) · entity · format · result (CommandResult)
├── api/            one folder per backend service: client · wire · transformer · errors · mocks · fixtures/
│   ├── _shared/    generic ApiError → CommandResult mapper
│   ├── item/       products (working) · collections · lookups · price schedules
│   ├── dashboard/  os-order/  inventory/  os-customer/  discount/  bulk-ops/  media-apps/
│   └── index.ts    api = { item, dashboard, osOrder, inventory, osCustomer, discount, bulkOps, mediaApps }
├── resources/      defineResource + one card per entity + supporting.ts + registry.ts
├── commands/       defineCommand + runCommand (9 steps) + one file per resource + registry.ts
├── machines/       XState v5, one folder each: machine · types · actors · actions · index (hook) · test
├── ui/             the kit: primitives · patterns · toast · dialog · dataTable · shell
├── routes/         router (generated from registry) · StoreLayout · CommandHost · _templates/{List,Editor,Detail}Page · _hooks · flows/
├── features/       bespoke pieces: components registry · errors (SupportBox, RouteErrorCard) · palette · settings
├── assistant/      tools generated from cards · screen context · ProposalCard
├── extensions/     UI-extension host · app bridge
└── mocks/          MSW handlers (browser worker + node server)
```

## What exists once

| Layer | Count | Where |
|---|---|---|
| Domain entities | 17 | `src/domain/*` |
| API service modules | 8 (146 endpoint stubs) | `src/api/*` |
| Resource cards | 12 + 13 supporting | `src/resources/*` |
| Command cards | 102 | `src/commands/*` |
| Machines | 12 | `src/machines/*` |
| Flow routes | login · pick-store · no-access · orders/$id/edit · discounts wizard · apps/$handle | `src/routes/flows` |

## Working today

- `product`: domain rules (all catalog rules from gk-pages, with source lines and tests), item client with wire schema, transformer, fixtures and MSW, resource card to spec, all 14 commands, list, editor and duplicate prefill, import and export as bulk-ops jobs.
- bulk-ops service: export template and preview, process, import preview (multipart), job progress and cancel, with MSW handlers.
- Machines with actors and tests: `recordSave` (with partial and conflict), `jobs` and `jobChild` (poll policy, pause when hidden, cancel), `importFlow`, `exportFlow`. The other machines have states and transitions with actors still to fill.
- Domain rules ported with gk-pages source lines for orders, drafts, refunds, inventory, purchase orders, transfers, locations, customers, segments, discounts, discount sets, price schedules and custom fields.
- Scaffolders: `npm run new:resource` (one entity across every layer) and `npm run new:command` (one command card plus its test).

## Porting order

`docs/architecture/docs/build-order.md`. For each resource: record fixture → wire schema → transformer → domain rules with source lines → fill the resource card → fill the command cards → tests. Replace a `notImplemented(...)` stub only together with its fixture.

## Commit and push

Testing and release, end to end: `docs/engineering/testing-and-release.md`.

Husky runs three hooks: `pre-commit` (prettier + eslint on staged files), `commit-msg` (`[Feature|Bugfix|Hotfix]: one line`), `pre-push` (typecheck, lint, format check, tests, build). Rules in CLAUDE.md › Git rules.

## Guardrails

CLAUDE.md recipes · `mistakes.md` · `.claude/skills/{new-resource,add-command,review-pr,fix-bug}` · ESLint boundaries · CODEOWNERS · PR template · CI workflow with bundle budget.

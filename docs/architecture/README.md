# GK Admin — Architecture

> Status: **Draft v0** · Owner: Aman Zaid · Updated: 2026-10-14

The new merchant admin, **Ratio** (products, collections, inventory, orders, customers, discounts…) built as a fresh codebase, with an AI assistant and a modern interaction layer on top of a CRUD core.

This file is the map. Each linked doc is short and covers one topic.

---

## What we are building

- **Core:** tables + forms over 11 resources (CRUD, filters, bulk actions, import/export).
- **Flows:** a handful of multi-step processes (bulk edit, CSV import, draft order → order, price schedules).
- **Assistant:** an in-app AI that can read the current screen and propose actions the user confirms.
- **Extensibility:** third-party UI extensions and embedded apps, as today.

## Layers

```
┌──────────────────────────────────────────────────────────────────────┐
│ SURFACES   Tables · Forms · Detail pages · ⌘K · AI assistant · Ext.  │  render + interact
├──────────────────────────────────────────────────────────────────────┤
│ CONTRACTS  defineResource()  ·  defineCommand()  ·  extension targets │  what exists, what can be done
├──────────────────────────────────────────────────────────────────────┤
│ LOGIC      domain schemas · pure rules · state machines              │  business truth, flows
├──────────────────────────────────────────────────────────────────────┤
│ STATE      server cache (Query) · URL · tiny UI store                │  where data lives
├──────────────────────────────────────────────────────────────────────┤
│ PLATFORM   session · API client · merchant · permissions · telemetry │  plumbing
├──────────────────────────────────────────────────────────────────────┤
│ GATEWAY    os-item · os-order · os-resources …  (unchanged)          │
└──────────────────────────────────────────────────────────────────────┘
```

Dependencies point **down only**. A layer never imports from a layer above it.

## Principles

1. **Define once, use everywhere.** An entity is described once (resource), an action is described once (command). Tables, menus, ⌘K, AI and extensions all consume the same definitions.
2. **Server data lives in the server cache.** Never copied into a global store. No `useEffect` decides when to fetch.
3. **View state lives in the URL.** Filters, sort, page, tab. Refresh and shared links restore the view.
4. **One schema per shape.** Zod schemas validate API responses, drive forms and become AI tool inputs.
5. **Machines for flows, hooks for rendering.** If it needs 3+ booleans or an effect chain, it is a state machine.
6. **Spec first, confirmed by real screens.** Resource and command definitions are the target spec; products and orders are built first and the contracts adjusted where real code disagrees.
7. **Parity now, change later in one place.** Business logic behaves exactly as in today's gk-pages. Known future changes (tax, channels, inventory history, new settings) are prepared as local seams: a schema field, a transformer, a command, a registered section. See [schema/deferred.md](schema/deferred.md).

## Docs

| Area | Doc | One line |
|---|---|---|
| Context | [context.md](docs/context.md) | What today's GK does, and what we keep or drop |
| Design mapping | [design-mapping.md](docs/design-mapping.md) | Features in the Ratio design → resources, commands, machines |
| Schema | [schema/](schema/README.md) | The data model: entities, fields, statuses, money, stock |
| Platform | [platform/](platform/README.md) | Identity, auth and session, routing, API client, chrome, gateway, delivery, quality (tracker decisions d01–d36) |
| State | [state.md](docs/state.md) | The three homes for state and the rules between them |
| Domain | [domain.md](docs/domain.md) | Schemas and pure business rules per entity |
| Resources | [resources/](resources/README.md) | Resource contract, data access, list and editor standards |
| Commands | [commands/](commands/README.md) | Command contract, execution path, bulk and jobs, surfaces (assistant, ⌘K, extensions) |
| Machines | [machines.md](docs/machines.md) | When to use XState, and how files are laid out |
| Assistant | [assistant.md](docs/assistant.md) | AI panel, tools from commands, human-in-the-loop |
| Extensions | [extensions.md](docs/extensions.md) | UI extensions + embedded apps on top of contracts |
| UI kit | [ui-kit.md](docs/ui-kit.md) | Own components on Radix + Tailwind |
| Stack | [stack.md](docs/stack.md) | Library choices with reasons and alternatives |
| Structure | [structure.md](docs/structure.md) | Folder layout and import rules |
| Build order | [build-order.md](docs/build-order.md) | Sequence from platform shell to all domains |
| Open questions | [open-questions.md](docs/open-questions.md) | Decisions still needed, with owners |

## Decisions log

Settled decisions: [`adr/`](adr/README.md).

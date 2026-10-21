# Structure

[← Architecture](../README.md)

```
src/
  routes/          route tree                                                   6 surfaces
  features/        custom sections and screens that don't fit the generic ones
  assistant/       panel, context collector, proposal cards, tool generation
  extensions/      extension host, app bridge
  machines/        <flow>/machine.ts, actors.ts, actions.ts, types.ts           5 orchestration
  resources/       <resource>.ts  (defineResource: data provider, keys, list, editor)   4 contracts
  commands/        <resource>.ts  (defineCommand: steps call api/)
  api/             <service>/client.ts, wire.ts, transformer.ts, errors.ts, fixtures/   3 service API
  domain/          <entity>/schema.ts, rules.ts, format.ts  (Zod schemas, pure rules)   2 domain
  platform/        http client, session, merchant (storeId), permissions, query client, telemetry, config   1 platform core
  ui/              tokens, primitives, patterns, shell components               side: UI kit
```

## Layers and imports

Same layers as the [README](../README.md#layers). A layer imports only from layers below it, never above.

| Layer | Folders | May import | Must not import |
|---|---|---|---|
| 6 Surfaces | `routes/`, `features/`, `assistant/`, `extensions/` | orchestration, contracts, domain (rules, formatters), platform core (session, permissions, telemetry), `ui/` | `api/` and the HTTP client: reads go through resources, writes through `runCommand` |
| 5 Orchestration | `machines/` | contracts, domain, platform core | `api/` (writes are commands), `ui/`, React components |
| 4 Contracts | `resources/`, `commands/` | `api/`, domain, platform core | `machines/`, `ui/`, surfaces |
| 3 Service API | `api/<service>/` (client, wire schema, transformer) | domain (schemas), platform core (HTTP client, config) | React; every layer above |
| 2 Domain | `domain/` | other domain modules | anything else in the app; React; network |
| 1 Platform core | `platform/` | nothing in the app | every layer above |
| Side: UI kit | `ui/` | nothing in the app | everything in the app |

- Machines import `runCommand` and resource queries directly; async work stays in `actors.ts` so tests can replace it.
- Every write endpoint is called from exactly one command ([ADR 0001](../adr/0001-resources-and-commands.md)). Exception: login, OTP, logout and store switch are platform session calls.
- Enforced with ESLint import boundaries, one element per row above.

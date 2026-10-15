# Structure

[← Architecture](../README.md)

```
src/
  platform/        session, apiClient, merchant, permissions, telemetry, config (env, service base URLs)
  api/             <service>/client.ts, transformer.ts       (one per backend service; no React)
  domain/          <entity>/schema.ts, rules.ts, format.ts    (Zod schemas, pure rules; no React)
  resources/       <resource>.ts                              (defineResource: data provider, keys, list, editor)
  commands/        <resource>.ts                              (defineCommand: steps call api/)
  machines/        <flow>/machine.ts, actors.ts, actions.ts, types.ts
  features/        custom sections and screens that don't fit the generic ones
  assistant/       panel, context collector, proposal cards, tool generation
  extensions/      extension host, app bridge
  ui/              tokens, primitives, patterns, shell
  routes/          route tree
```

## Layers and imports

Matches the layers in the [README](../README.md#layers). Imports point down only.

```
routes / features / assistant / extensions      surfaces
        ▼
resources / commands                            contracts
        ▼
machines / domain                               logic
        ▼
api                                             service access
        ▼
platform / ui                                   plumbing
```

- Machines call commands and queries through injected actors, not by importing `resources/` or `commands/` directly.
- `domain/` imports nothing from the app except other domain modules.
- `ui/` knows nothing about domains.
- Enforced with ESLint import boundaries.

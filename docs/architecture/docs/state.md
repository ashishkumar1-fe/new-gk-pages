# State

[← Architecture](../README.md)

State has three homes. It is not a layer of its own; where each home sits in the stack is in the [README](../README.md#layers).

| Kind | Home | Examples |
|---|---|---|
| **Server data** | TanStack Query cache | product list, order detail, user details |
| **View state** | URL search params | `?view=unfulfilled&q=rahul&financial_status=paid&sort=created_at:desc&page=2` |
| **UI state** | Component state, or a small Zustand store when global | modal open, assistant panel open, row selection |

Flow state (multi-step processes) lives in a state machine; see [machines.md](machines.md). URL format and list params: [../resources/list.md](../resources/list.md#url-state).

## The table loop

```mermaid
flowchart LR
  URL["URL params"] --> K["Query key"] --> Cache["Query cache"] --> T["Table"]
  T -- "user changes filter" --> URL
  T -- "user acts" --> Cmd["Command"] --> API["API"] --> Upd["Set detail · invalidate lists"] --> Cache
```

## Query keys

Defined per resource as `[domain, storeId, …]`; see [../resources/data-access.md](../resources/data-access.md#query-keys).

## Rules

- Never copy query data into a store or `useState`, and never mutate it; derive display values at render ([data flow](../schema/conventions.md#data-flow-transform-once-never-mutate)).
- Never fetch in `useEffect`.
- Writes go through commands; how each updates the UI (pessimistic, optimistic, undoable) is set per command ([../commands/execution.md](../commands/execution.md#modes)).
- Row selection is UI state; it clears when the URL changes.

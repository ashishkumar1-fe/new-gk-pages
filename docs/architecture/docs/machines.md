# State machines

[← Architecture](../README.md)

XState v5 for flows that have steps. Not for every screen.

## Use a machine when

- the flow has 3+ distinct steps, or
- you would otherwise need 3+ booleans, or
- the next step depends on an async result, a timer, or a user decision.

Lists, records and single commands don't need one: the query cache and `runCommand` cover them.

## v1 machines

| Machine | States | Used by |
|---|---|---|
| Login | form → otp → loading; resend timer; Google | [auth-session](../platform/auth-session.md) |
| App boot | checking session → login / loading user → picking merchant → checking entitlement → ready / no access | [auth-session](../platform/auth-session.md#boot-flow) |
| Record editor | loading → pristine ⇄ dirty → saving → pristine; invalid; conflict; error; navigation guard | [resources/editor](../resources/editor.md#draft-lifecycle) |
| Refund | select items ⇄ calculating → preview → submitting → polling → success / failed / still processing | [order commands](../commands/defs/orders.md#refund-flow) |
| Order edit session | beginning → (waiting on stale collision) → active ⇄ staging → previewing → committing → committed; error; discard on leave | [order commands](../commands/defs/orders.md#order) |
| Draft payment watch | awaiting payment (poll `GET /draft-orders/:id` every 8 s; paused while hidden; ≤ 30 min; stops after 5 failures) → converted (open order) / stopped | [order commands](../commands/defs/orders.md#draftordercomplete-today) |
| Import | upload → validating (preview) → invalid / ready → importing (job) → done / failed | [bulk-ops](../commands/defs/bulk-ops.md#import-productimport-orderimport) |
| Job tracker | running → completed / failed / cancelled; polls progress | [bulk-ops](../commands/defs/bulk-ops.md#job-tracking) |
| Assistant | idle → thinking → proposed → confirming → executing → done / error | [assistant](assistant.md) |

The machine drives the UI; writes inside it are still commands (`refund.create`, `order.edit`, `product.import`).

## File layout

Every machine is a folder; `machine.ts` only orchestrates.

```
machines/refund/
  machine.ts   # states and transitions only
  actors.ts    # async work (queries, runCommand)
  actions.ts   # pure assign helpers
  types.ts     # context and events
  index.ts
```

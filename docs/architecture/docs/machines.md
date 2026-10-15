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
| Login | form → otp → loading; resend timer; Google | [platform](platform.md) |
| App boot | checking session → login / loading user → picking merchant → checking entitlement → ready / no access | [platform](platform.md#boot-flow) |
| Record editor | loading → pristine ⇄ dirty → saving → pristine; invalid; conflict; error; navigation guard | [resources/editor](../resources/editor.md#draft-lifecycle) |
| Refund | select items ⇄ calculating → preview → submitting → polling → success / failed / still processing | [order commands](../commands/defs/orders.md#refund-flow) |
| Draft order complete | runs `draftOrder.complete` steps; shows which step failed and retries the rest | [order commands](../commands/defs/orders.md#draftordercomplete-steps-todays-order) |
| Import | upload → validating (preview) → invalid / ready → importing (job) → done / failed | [bulk-ops](../commands/defs/bulk-ops.md#import-productimport-orderimport) |
| Job tracker | running → completed / failed / cancelled; polls progress | [bulk-ops](../commands/defs/bulk-ops.md#job-tracking) |
| Assistant | idle → thinking → proposed → confirming → executing → done / error | [assistant](assistant.md) |

The machine drives the UI; writes inside it are still commands (`refund.create`, `draftOrder.complete`, `product.import`).

## Assistant machine

```
idle ─▶ thinking ─▶ proposed ─▶ confirming ─▶ executing ─▶ done
  ▲                     │            │              │
  └──── reject ─────────┴────────────┘              ▼
  └──────────────── retry / dismiss ──────────── error
```

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

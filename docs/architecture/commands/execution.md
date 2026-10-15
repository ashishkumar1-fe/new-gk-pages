# Execution

[← Commands](README.md)

Every command, from every surface, runs through `runCommand(id, input?, ctx)`.

| # | Step | What happens | Ends as |
|---|---|---|---|
| 1 | Resolve | ID → definition | not found (unknown, or capability off) |
| 2 | Availability | visible? permission? enabled? | `denied`, with reason |
| 3 | Input | `fromContext` + caller input → form if incomplete → schema validate | `invalid` |
| 4 | Confirm | policy from definition + effect + surface → dialog | `cancelled` (dismissed) |
| 5 | Optimistic | apply cache updates (optimistic / undoable modes) | — |
| 6 | Run | steps in order; idempotency key; timeout | — |
| 7 | Settle | success → set detail cache, invalidate keys; failure → roll back optimistic, compensate finished steps in reverse | `success` / `partial` / `error` |
| 8 | Feedback | toast (Undo when undoable), field errors to the form, navigate | — |
| 9 | Audit | event: command, input summary, staff, surface, result, duration | — |

## Availability

Evaluated per context, cheaply (no network):

| Check | Fails as |
|---|---|
| Capability flag off | Command not registered |
| `visible` false | Not shown |
| Missing permission | Not shown in menus; `denied` if called directly (assistant, extension) |
| `enabled` returns a reason | Shown disabled with the reason |

The server remains the final authority; a passed client check is a UX hint, not security.

## Confirmation policy

| Case | Confirm |
|---|---|
| `confirm: 'always'` or a `ConfirmSpec` | Yes |
| `effect.destructive` | Yes, critical tone |
| `effect.external` (customer-facing, money, other systems) | Yes |
| Bulk above 25 items (proposed) | Yes, with the count in the label |
| Surface is `assistant` and `effect.readOnly` is false | Always yes, regardless of the above |
| Assistant + destructive | Proposal card, then a second critical confirm (no destructive command is assistant-exposed in v1) |
| Everything else | No |

Confirm labels state the action and count ("Archive 12 orders"), never "OK".

## Modes

| Mode | Behaviour | Use for |
|---|---|---|
| Pessimistic | Wait for the server, then update UI | Default; money, stock, status changes with server rules |
| Optimistic | Update UI now, roll back on failure | Cheap reversible edits (tags, notes) |
| Undoable | Update UI now, toast with Undo; undo runs the inverse command | Archive, status toggles where an inverse exists |

## Steps and compensation

- Steps run in order. A step's output is available to later steps.
- On failure in an `abort` step: earlier steps with `compensate` are undone in reverse order; the result is `error` with which step failed.
- Steps without compensation (irreversible) are placed as late as possible. If a later step fails, the result says what already happened ("Order created; draft not marked completed") and offers retry of the remaining steps.
- `continue-with-warning` steps never fail the command; their failure becomes a warning in the result.

## Idempotency and retry

- `per-attempt` key: generated when the dialog opens and reused for retries of that attempt (prevents double refunds on a double click or flaky network).
- `per-input` key: derived from input, for APIs that dedupe by key (order bulk archive / unarchive, draft completion, v3 inventory set / adjust today; bulk-ops does not).
- Automatic retry only for idempotent commands, on network errors and 5xx, 2 attempts with backoff (proposed; same as reads).
- The same command for the same target can't run twice at once; a second call while the first is running is ignored.

## Cache

- `updates` set the detail cache from the response (no refetch).
- `invalidates` mark lists and related resources stale; visible queries refetch.
- Optimistic changes are recorded and rolled back exactly on failure.

## Feedback

| Result | User sees |
|---|---|
| success | Toast (or none for silent saves), navigate if defined |
| success + warnings | Toast with warning tone listing them |
| partial | Summary ("10 archived, 2 failed") with the failed items and Retry failed |
| invalid | Errors on the form fields; toast only if no field matches |
| denied | Reason in a toast; button was already disabled where possible |
| error | Message from the server when meaningful, else generic; Retry if retryable |

## Audit and analytics

- Each run emits one PostHog event: command ID, resource, target IDs (not full input), actor (`Actor`: staff, app or assistant), surface, result status, duration.
- Assistant runs also record the conversation ID and the approved proposal.
- A staff-visible activity log can use the Audit Service gk-pages already writes field-level changes to (`AUDIT_SERVICEURL`; [open question 15](../docs/open-questions.md)).

## Errors from the server

API modules map `ApiError` ([client](../platform/api-client.md#what-the-client-does)) and soft failures to the result type:

| Server says | Result |
|---|---|
| Validation error with field | `invalid` with field paths in domain names |
| 403 | `denied` |
| 409 / version mismatch | `error` with "changed elsewhere", editor offers reload |
| Known business code (`ALREADY_ARCHIVED`) | `success` with a warning, when harmless |
| 2xx body with `success: false` | `error` (never shown as success) |
| 401 | session expired; boot sends the user to login |
| 5xx / network | `error`, retryable |

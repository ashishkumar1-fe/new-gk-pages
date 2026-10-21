# State machines

[← Architecture](../README.md)

XState v5 for flows that have steps. Not for every screen.

## Use a machine when

- the flow has 3+ distinct steps, or
- you would otherwise need 3+ booleans, or
- the next step depends on an async result, a timer, or a user decision.

Lists, records and single commands don't need one: the query cache and `runCommand` cover them.

## Rules

- **Events, not watchers.** User actions and actor results are events. What can't send events (URL, tab visibility, other tabs) is wrapped in one subscription actor that sends a named event. No `useEffect` chains for async work.
- **One state per distinct outcome.** A state exists only if it allows different events, exits or UI; failures with the same exits share a state.
- **Every async state has a way out:** a timeout (`after`) or a limit, an error state, and RETRY or CLOSE.
- **Ids, not copies.** Context holds ids and flow choices; server data stays in the query cache, form values in the form.
- **Actors call contracts only:** `runCommand` and resource queries, with the actor's `signal`; Session and Login also call platform session; Embed calls the platform token broker and bridge. The idempotency key is created on entering the submit state and reused for its retries; changed input gets a new key.
- **Flow-owned confirm.** A review state (refund review, wizard finish, assistant proposal) is the confirm: the machine runs the command with `confirmed: true` ([execution](../commands/execution.md#confirmation-policy)).
- **UI reads tags.** One hook per machine returns plain values and senders; components never import XState.
- **Lifetime.** Page machines start with their route, drawer or dialog and stop when it closes, aborting their actors. App-wide machines live at the root with a `systemId`. A store switch stops everything merchant-scoped.
- **Tests:** `createActor(machine.provide({ actors }))` with fake timers, one test per transition. Entering a failure state or abandoning a flow is a PostHog event.

## App-wide machines

One instance each, at the app root.

| Machine | Calls | Notes |
|---|---|---|
| [Session](#session) | `GET /user/details`, switch-merchant, logout ([auth-session](../platform/auth-session.md)) | The one source of `storeId` |
| [Jobs](#jobs) | `job` status query, `bulkOps.cancel` | Parent with one child per running job |
| [Assistant](#assistant) | assistant backend, read queries, `runCommand` | The os-discount AI session ([discounts](../commands/defs/discounts.md#create-with-the-assistant)) runs as its child |

### Session

```mermaid
stateDiagram-v2
  [*] --> Booting
  Booting --> Login: 401
  Booting --> PickingMerchant: 200
  Login --> Booting: signed in
  PickingMerchant --> CheckingEntitlement
  CheckingEntitlement --> Ready: pages = true
  CheckingEntitlement --> NoAccess: pages = false
  Ready --> SwitchingStore: switch
  SwitchingStore --> Booting: stop merchant actors · clear cache and tokens
  Ready --> Login: 401 on any call · return to the same URL
  Ready --> LoggingOut: logout
  LoggingOut --> Login
```

- `GET /user/details` is both the session check and the user load ([auth](../platform/auth-session.md#cookie-session)). Routes render only in Ready.
- Logout and login reach other tabs; the store stays per tab (pending [open question 21](open-questions.md)).

### Jobs

```mermaid
stateDiagram-v2
  state "Jobs (parent, 1 instance)" as Parent {
    [*] --> Tracking
    note right of Tracking
      TRACK jobId → spawn a child
      child ended → toast, remove it
    end note
    Tracking --> Stopped: store switch or logout → stop all children
  }
  state "Job child (1 per jobId)" as Child {
    [*] --> Waiting
    Waiting --> Checking: after intervalMs
    Waiting --> Paused: tab hidden
    Paused --> Checking: tab visible
    Checking --> Waiting: still running (progress)
    Checking --> Completed: finished
    Checking --> Failed: failed (errorMessage)
    Checking --> GaveUp: limit or 5 errors in a row
    Waiting --> Cancelled: CANCEL → bulkOps.cancel
  }
```

- Import and Export send `TRACK` with the `jobId` and the command's `JobSpec`; the child follows its [poll policy](#poll-policy).
- The top-bar jobs indicator reads the children. Toast when a job ends (notifications are off). Job history stays on the server.

### Assistant

```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> Thinking: message + screen context
  Thinking --> Thinking: read tool result
  Thinking --> Proposing: write tool call
  Proposing --> Running: approve
  Proposing --> Thinking: reject or edit
  Running --> Thinking: command result
  Thinking --> Idle: answer
  Thinking --> Idle: cancel
```

- Each reply carries its session id; a reply for an older session is dropped. Approve is blocked while a turn is in flight.
- Error replies: 409 still thinking, 429 rate limit (retry-after), 503 unavailable; an expired confirmation (410) asks again ([discounts](../commands/defs/discounts.md#create-with-the-assistant)).

## Page machines

Start with their route, drawer or dialog; stop when it closes. Where each appears: [pages](../surfaces/pages.md#machines-on-screen).

| Machine | Calls | Timers |
|---|---|---|
| [Login](#login) | platform session calls ([gateway](../gateway/dashboard.md#auth-and-session)) | resend after 30 s (design) |
| [Record save](#record-save) | the editor's `save` command | — |
| [Refund](#refund) | `refund.create` (preview = calculate) | debounce 300 ms · poll 5 s × 24 |
| [Order edit session](#order-edit-session) | `orderEdit.begin`, `stage`, `discard` · queries `orderEdit.preview`, `orderEdit.session` · `order.update` | stage debounce 500 ms · stale retry 15 s, ≤ 6 min |
| [Discount wizard](#discount-wizard) | `discount` query, `codeUnique` query, `discount.create` / `update` | — |
| [Draft payment watch](#draft-payment-watch) | draft order detail query | 8 s · ≤ 30 min · 5 errors in a row |
| [Import](#import) | `*.importPreview`, `*.import` | — |
| [Export](#export) | `*.exportPreview`, `*.export` | — |
| [Embed](#embed) | token broker, bridge | handshake 10 s |
| [Bulk action](#bulk-action) | product filter query (`bulk-operations/filter-products`), `priceSchedule.create` | preview debounced |

### Login

```mermaid
stateDiagram-v2
  [*] --> Credentials
  Credentials --> SigningIn: email + password
  Credentials --> Google: Continue with Google
  SigningIn --> Otp: code sent
  SigningIn --> UnverifiedEmail: 403
  SigningIn --> Credentials: invalid
  UnverifiedEmail --> Otp: send-otp
  Otp --> Otp: resend (after 30 s)
  Otp --> Verifying: 6 digits
  Verifying --> Otp: wrong code
  Verifying --> PasswordChange: otp_verified token
  Verifying --> OldDashboard: current_dashboard old → redirect
  Verifying --> LoadingStore: ok
  PasswordChange --> LoadingStore
  Google --> LoadingStore: ok
  Google --> Credentials: 401
  LoadingStore --> [*]: Session boots
```

- signin `400` "otp already sent" counts as sent.

### Record save

```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> Validating: SAVE (dirty and valid)
  Validating --> Invalid: errors → fields
  Invalid --> Validating: SAVE
  Validating --> Saving: ok
  Saving --> Saving: SAVE again → queue one follow-up
  Saving --> Saved: success
  Saving --> Partial: a later step failed
  Saving --> Failed: error
  Saving --> Conflict: changed elsewhere
  Partial --> Saving: retry the rest
  Failed --> Saving: RETRY (same key)
  Saved --> Saving: queued follow-up
  Saved --> Idle
  Conflict --> [*]: reload
```

- Dirty and valid stay in the form; the machine only runs the save. The queued follow-up uses the latest values.
- Partial: [steps and compensation](../commands/execution.md#steps-and-compensation). Conflict offers reload only, no force save.

### Refund

```mermaid
stateDiagram-v2
  [*] --> Selecting
  Selecting --> Calculating: change (debounce 300 ms)
  Calculating --> Reviewing: preview ok
  Calculating --> Selecting: cannot refund
  Reviewing --> Selecting: edit items
  Reviewing --> Submitting: "Refund ₹X" (new key)
  Submitting --> Polling: accepted
  Submitting --> Failed: error (retry, same key)
  Polling --> Succeeded
  Polling --> Failed
  Polling --> StillProcessing: 24 polls
```

- StillProcessing says "Refund {id} is being processed… you can close this drawer and check back later" and invalidates the order. Closing leaves the refund running on the server.

### Order edit session

```mermaid
stateDiagram-v2
  [*] --> Beginning
  Beginning --> Editing: session open
  Beginning --> WaitingForStale: STALE_SESSION_COLLISION
  WaitingForStale --> Beginning: every 15 s
  WaitingForStale --> Failed: 6 min
  Beginning --> Takeover: ACTIVE_SESSION_EXISTS
  Takeover --> Beginning: Discard & continue
  Takeover --> [*]: cancel → order
  Editing --> Staging: change (debounce 500 ms)
  Staging --> Previewed: stage + preview
  Previewed --> Staging: change
  Previewed --> Committing: Save (confirm when refund ≠ 0)
  Committing --> Committed: ok · reaped during commit
  Committing --> Beginning: session gone → restage same ops
  Committing --> Checking: 5xx or network
  Checking --> Committed: session committed
  Checking --> Committing: session active
  Checking --> Failed: unknown → refresh the order
  Committing --> Failed: fulfillment changed → back to order
```

- Version stale on stage, preview or commit: re-read the session and retry once. Every code: [gateway](../gateway/os-order.md).
- Commit is refused until the preview matches the latest change. Leaving asks first ([leave guard](#other-orchestration)); page close discards with `keepalive`.

### Discount wizard

```mermaid
stateDiagram-v2
  [*] --> Step1: create
  [*] --> Loading: edit
  Loading --> Step2: loaded (kind and mode locked)
  Loading --> LoadFailed
  LoadFailed --> Loading: retry
  Step1 --> Step2: Continue
  Step2 --> CheckingCode: Continue
  CheckingCode --> Step2: code taken
  CheckingCode --> Step3: unique or check failed
  Step3 --> Step4: Continue
  Step4 --> Step5: Continue
  Step5 --> Finishing: Publish discount
  Finishing --> Step5: Cancel
  Finishing --> Saving: Publish now · Save as draft
  Saving --> Step5: error
  Saving --> [*]: toast → list
```

- Continue validates that step's fields; Back goes one step back; steps can't be skipped. Code rule: [domain](../domain/discounts.md#rules).
- LoadFailed never saves defaults over the discount.

### Draft payment watch

```mermaid
stateDiagram-v2
  [*] --> Watching: draft has a live payment link
  Watching --> Paused: tab hidden
  Paused --> Watching: tab visible (check at once)
  Watching --> Converted: order id present
  Watching --> GaveUp: 30 min
  Watching --> Failed: 5 errors in a row
  Converted --> [*]: banner · open the order
```

- A failed read counts as an error. With unsaved edits, Converted says "Payment received — order created. Your unsaved changes cannot be applied."

### Import

```mermaid
stateDiagram-v2
  [*] --> Choosing
  Choosing --> Previewing: file
  Previewing --> Invalid: row errors
  Previewing --> Ready: valid (jobId)
  Invalid --> Choosing: new file
  Ready --> Choosing: new file or cancel
  Ready --> Starting: Start import (the confirm)
  Starting --> Ready: error
  Starting --> [*]: TRACK jobId → Jobs
```

- One machine for every import, configured by the command's `JobSpec`. A previewed job that is never started stays on the server: bulk-ops cancels only running jobs.

### Export

```mermaid
stateDiagram-v2
  [*] --> Configuring
  Configuring --> Previewing: groups · date range · format
  Configuring --> Starting: no preview step
  Previewing --> Ready: jobId + estimate
  Ready --> Configuring: change
  Ready --> Starting: Start export
  Starting --> Configuring: error
  Starting --> [*]: TRACK jobId → Jobs · or download the file
```

- One machine for every export. Page-scope exports are built in the browser; customer "all" is a job; inventory "all" is a file download.

### Embed

```mermaid
stateDiagram-v2
  [*] --> Minting
  Minting --> Loading: token from the broker
  Loading --> Handshaking: iframe load
  Handshaking --> Ready: READY → INIT → ACK
  Ready --> Refreshing: token request or 401
  Refreshing --> Ready: new token
  Refreshing --> Expired: mint failed
  Minting --> Failed: error or timeout
  Handshaking --> Failed: no ACK in 10 s
  Failed --> Minting: RETRY
  Expired --> Minting: RETRY
```

- One per mounted embed. The token stays in the broker, never in context or a URL query; the visual editor's first-load `#token=` is read and cleared by the editor. Requests in Ready (toast, save bar, navigate, picker) follow the [bridge](extensions.md#bridge) rules.

### Bulk action

```mermaid
stateDiagram-v2
  [*] --> Filtering
  Filtering --> Previewing: conditions (debounced)
  Previewing --> Choosing: total + sample
  Choosing --> Filtering: edit conditions
  Choosing --> Confirming: action and params valid
  Confirming --> Submitting: run now or schedule (new key)
  Submitting --> Choosing: error · conflicting schedules
  Submitting --> [*]: done · schedules list or TRACK jobId → Jobs
```

- Preview shows the server's total, not the sample size (gk-pages counts the first 100 rows). A scheduled run re-evaluates the filter when it runs; times are in the store time zone (gk-pages sends browser-local hours). Conflicting schedules (`interferingTasks`) are shown, not dropped.

## Other orchestration

| Piece | Does |
|---|---|
| Leave guard | Every editor, order edit, the wizard and an embedded app's save bar: router blocker plus `beforeunload` while the form is dirty or the machine has tag `unsaved`. "Discard unsaved changes?" / "Your unsaved changes will be lost." / Discard · Keep editing |
| Save bar | One bar for the page: Save / Discard and `mod+s`, from form state and Record save tags |
| Poll policy | [below](#poll-policy) |
| Toast queue | Ordered, deduplicated by key, with Retry where the result is retryable |
| Assistant bridge | Sends screen context ([assistant](assistant.md#screen-context)); an approved proposal runs as `runCommand(…, { surface: 'assistant', confirmed: true })` |

## Poll policy

```ts
interface PollPolicy {
  intervalMs: number;
  maxAttempts?: number;
  maxDurationMs?: number;
  maxConsecutiveErrors: number;   // default 5
  pauseWhenHidden: boolean;       // default true; checks at once on return
}
```

The rules for asking the server "done yet?", not the job's data. Used by command `poll` and `JobSpec`. Running out ends in a state that tells the user, never silently.

| Poll | Interval | Limit |
|---|---|---|
| Refund status | 5 s | 24 attempts |
| Bulk-ops job progress | 5 s | none today |
| Customer export | 3 s | 20 attempts |
| Draft payment | 8 s | 30 min |
| Order edit stale session | 15 s | 6 min |

## File layout

Every machine is a folder; `machine.ts` only orchestrates.

```
machines/refund/
  machine.ts   # states and transitions only
  actors.ts    # async work (resource queries, runCommand), replaceable in tests
  actions.ts   # pure assign helpers
  types.ts     # context and events
  index.ts     # useRefund(): plain values and senders
machines/jobs/
  machine.ts   # parent: spawns one jobMachine per TRACK
  jobMachine.ts
```

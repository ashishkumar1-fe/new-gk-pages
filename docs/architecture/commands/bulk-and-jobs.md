# Bulk and jobs

[← Commands](README.md)

## Bulk

A bulk command acts on a selection. Three strategies, chosen by what the API offers:

```ts
interface BulkSpec<TInput> {
  strategy:
    | { kind: 'native' }                         // one API call with all IDs; API returns per-item results
    | { kind: 'fan-out'; concurrency: number }   // one call per item, client-side
    | { kind: 'job' };                           // API creates a background job
  maxItems?: number;                             // hard cap with a clear message
  toItems: (input: TInput) => Id[];
}
```

| Strategy | When | Result |
|---|---|---|
| Native | API takes a list (bulk cancel, bulk tags, bulk delete) | Per-item outcome from the response |
| Fan-out | No bulk endpoint; small selections only | Per-item outcome collected client-side; concurrency limited. Reserved: no v1 command uses it |
| Job | Large or slow operations (import, export, price updates) | Job ID, then progress |

### Partial failure

- A bulk command never reports plain success if some items failed. Result is `partial` with each failed ID and reason.
- The UI shows the summary, keeps failed items selected and offers **Retry failed**, which runs the same command with only those IDs.
- Harmless per-item conditions (already archived) are warnings, not failures.

### Selection rules

- Bulk input is the selected IDs on the current page. No filter-based "all matching" unless the API accepts a filter.
- Conditional bulk commands check the whole selection (Unarchive only if all selected are archived).
- After the command, the selection clears on success and keeps failed items on partial.

## Background jobs

For work that outlives one request.

```ts
interface JobSpec<TResult> {
  start: (input: unknown) => Promise<{ jobId: Id }>;
  poll: (jobId: Id) => Promise<JobStatus<TResult>>;
  intervalMs: number;                            // as today per job: bulk-ops 5000, customer export 3000
  maxAttempts?: number;
  cancel?: (jobId: Id) => Promise<void>;
}

type JobStatus<TResult> =
  | { state: 'queued' | 'running'; progress?: { done: number; total: number } }
  | { state: 'completed'; result: TResult }
  | { state: 'failed'; error: string; rows?: { row: number; error: string }[] }
  | { state: 'cancelled' };
```

- A job runs in the background; the user can leave the page. Progress shows in a jobs indicator in the top bar and in a notification when finished.
- Import jobs have a preview step (validate file, show row errors) before the import runs, as a two-command flow: `*.importPreview` then `*.import`.
- Export results are a download link when ready; small exports may return the file directly.
- Job history (who ran what, when, result) is a read-only resource.

## Polling a single operation

Some single commands finish asynchronously (a refund is accepted, then processed). The command returns once accepted; a status query polls until a terminal state, with interval and limit defined on the command. The UI shows initiated → completed / failed, and transient poll errors are ignored until the limit.

## Concurrency

- Only one bulk command or job per resource and selection at a time from the same user.
- Lists affected by a running job show a notice and refetch when it completes.

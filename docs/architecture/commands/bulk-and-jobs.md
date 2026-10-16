# Bulk and jobs

[← Commands](README.md)

## Bulk

A bulk command acts on a selection with one API call carrying all IDs (native). Long work is a page-level job, below.

```ts
interface BulkSpec<TInput> {
  maxItems?: number;                             // hard cap with a clear message
  toItems: (input: TInput) => Id[];
}
```

- Per-item outcome when the API returns one (bulk cancel, tags, archive, fulfill, draft delete).
- Count-only APIs (product bulk delete / update) succeed or fail as a whole.

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
- Export results: emailed for bulk-ops jobs; downloaded for inventory and customer exports.
- Job history (who ran what, when, result) is a read-only resource.

## Polling a single operation

Some single commands finish asynchronously (a refund is accepted, then processed):

- The command returns once accepted.
- The command declares the status query, interval and limit; the flow's machine (refund, job tracker) runs the polling.
- The UI shows initiated → completed / failed.
- Transient poll errors are ignored until the limit.

## Concurrency

- Only one bulk command or job per resource and selection at a time from the same user.
- Lists affected by a running job show a notice and refetch when it completes.

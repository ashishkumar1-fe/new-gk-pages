import { fromCallback, fromPromise } from 'xstate';
import type { JobSpec, JobStatus } from '@/commands/define';

/** Async work for a job child. Replaced in tests with `machine.provide({ actors })`. */
export const actors = {
  poll: fromPromise<JobStatus<unknown>, { spec: JobSpec<unknown>; jobId: string }>(({ input, signal }) =>
    input.spec.poll(input.jobId, { signal }),
  ),
  cancel: fromPromise<void, { spec: JobSpec<unknown>; jobId: string }>(async ({ input, signal }) => {
    await input.spec.cancel?.(input.jobId, { signal });
  }),
  /** The tab's visibility is not an event source; this subscription turns it into HIDDEN / VISIBLE. */
  visibility: fromCallback<{ type: 'HIDDEN' } | { type: 'VISIBLE' }>(({ sendBack }) => {
    if (typeof document === 'undefined') return () => {};
    const h = () => sendBack({ type: document.hidden ? 'HIDDEN' : 'VISIBLE' });
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }),
};

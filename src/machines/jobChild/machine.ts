import { setup, assign } from 'xstate';
import { actors } from './actors';
import { outOfAttempts, tooManyErrors } from './actions';
import type { JobChildContext, JobChildEvent, JobChildInput, PollOutcome } from './types';

/**
 * One per jobId. Waiting → Checking every intervalMs; Paused while the tab is hidden (checks at once on return);
 * GaveUp after the attempt or time limit or 5 errors in a row. Running out always ends in a state that tells the user.
 * Diagram and rules: docs/architecture/docs/machines.md#jobs
 */
export const jobChildMachine = setup({
  types: { context: {} as JobChildContext, events: {} as JobChildEvent, input: {} as JobChildInput },
  actors,
  delays: { interval: ({ context }) => context.spec.policy.intervalMs },
  guards: {
    pausesWhenHidden: ({ context }) => context.spec.policy.pauseWhenHidden,
    exhausted: ({ context }) => outOfAttempts(context, Date.now()),
    errorLimit: ({ context }) => tooManyErrors(context),
    completed: (_, o: PollOutcome) => o.state === 'completed',
    failed: (_, o: PollOutcome) => o.state === 'failed',
    cancelled: (_, o: PollOutcome) => o.state === 'cancelled',
  },
}).createMachine({
  id: 'jobChild',
  context: ({ input }) => ({
    jobId: input.jobId,
    label: input.label,
    spec: input.spec,
    startedAt: input.startedAt ?? Date.now(),
    attempts: 0,
    consecutiveErrors: 0,
  }),
  invoke: { src: 'visibility' },
  initial: 'Waiting',
  states: {
    Waiting: {
      tags: ['running'],
      after: { interval: 'Checking' },
      on: { HIDDEN: { guard: 'pausesWhenHidden', target: 'Paused' }, CANCEL: 'Cancelling' },
    },
    Paused: { tags: ['running'], on: { VISIBLE: 'Checking', CANCEL: 'Cancelling' } },
    Checking: {
      tags: ['running'],
      entry: assign({ attempts: ({ context }) => context.attempts + 1 }),
      invoke: {
        src: 'poll',
        input: ({ context }) => ({ spec: context.spec, jobId: context.jobId }),
        onDone: [
          { guard: { type: 'completed', params: ({ event }) => event.output }, target: 'Completed' },
          {
            guard: { type: 'failed', params: ({ event }) => event.output },
            target: 'Failed',
            actions: assign({ error: ({ event }) => (event.output as Extract<PollOutcome, { state: 'failed' }>).error }),
          },
          { guard: { type: 'cancelled', params: ({ event }) => event.output }, target: 'Cancelled' },
          { guard: 'exhausted', target: 'GaveUp' },
          {
            target: 'Waiting',
            actions: assign({
              consecutiveErrors: 0,
              progress: ({ event }) => (event.output as Extract<PollOutcome, { state: 'running' | 'queued' }>).progress,
            }),
          },
        ],
        onError: [
          {
            guard: 'errorLimit',
            target: 'GaveUp',
            actions: assign({ error: ({ event }) => String((event.error as Error)?.message ?? event.error) }),
          },
          { guard: 'exhausted', target: 'GaveUp' },
          { target: 'Waiting', actions: assign({ consecutiveErrors: ({ context }) => context.consecutiveErrors + 1 }) },
        ],
      },
      on: { CANCEL: 'Cancelling' },
    },
    Cancelling: {
      tags: ['running'],
      invoke: {
        src: 'cancel',
        input: ({ context }) => ({ spec: context.spec, jobId: context.jobId }),
        onDone: 'Cancelled',
        onError: { target: 'Waiting', actions: assign({ error: 'Could not cancel the job' }) },
      },
    },
    Completed: { type: 'final', entry: assign({ ending: 'Completed' as const }) },
    Failed: { type: 'final', entry: assign({ ending: 'Failed' as const }) },
    GaveUp: { type: 'final', entry: assign({ ending: 'GaveUp' as const }) },
    Cancelled: { type: 'final', entry: assign({ ending: 'Cancelled' as const }) },
  },
  output: ({ context }) => ({ jobId: context.jobId, label: context.label, state: context.ending ?? 'Failed', error: context.error }),
});

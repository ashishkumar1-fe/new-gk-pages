import { setup, assign, enqueueActions } from 'xstate';
import { commandById } from '@/commands/registry';
import { jobChildMachine } from '../jobChild/machine';
import { effects } from './actors';
import type { JobEnded, JobsContext, JobsEvent } from './types';

const DONE_PREFIX = 'xstate.done.actor.job-';

/**
 * App-wide parent; one child per running job. Import and Export send TRACK with the jobId and the command whose JobSpec
 * the child follows. A child that ends → toast, removed. Store switch or logout → STOP_ALL stops every child.
 * Diagram and rules: docs/architecture/docs/machines.md#jobs
 */
export const jobsMachine = setup({
  types: { context: {} as JobsContext, events: {} as JobsEvent },
  actors: { jobChild: jobChildMachine },
  actions: { notify: (_, e: JobEnded) => effects.notify(e) },
}).createMachine({
  id: 'jobs',
  context: { jobs: [] },
  initial: 'Tracking',
  states: {
    Tracking: {
      on: {
        TRACK: {
          guard: ({ context, event }) => !!commandById(event.commandId)?.job && !context.jobs.some((j) => j.jobId === event.jobId),
          actions: assign({
            jobs: ({ context, event, spawn }) => [
              ...context.jobs,
              {
                jobId: event.jobId,
                label: event.label,
                ref: spawn('jobChild', {
                  id: `job-${event.jobId}`,
                  input: { jobId: event.jobId, label: event.label, spec: commandById(event.commandId)!.job! },
                }),
              },
            ],
          }),
        },
        CANCEL: { actions: ({ context, event }) => context.jobs.find((j) => j.jobId === event.jobId)?.ref.send({ type: 'CANCEL' }) },
        STOP_ALL: { target: 'Stopped' },
        '*': {
          guard: ({ event }) => event.type.startsWith(DONE_PREFIX),
          actions: [
            { type: 'notify', params: ({ event }) => (event as unknown as { output: JobEnded }).output },
            assign({ jobs: ({ context, event }) => context.jobs.filter((j) => `${DONE_PREFIX}${j.jobId}` !== event.type) }),
          ],
        },
      },
    },
    Stopped: {
      // Stops following the jobs; the jobs themselves keep running on the server and stay in job history.
      entry: enqueueActions(({ context, enqueue }) => {
        context.jobs.forEach((j) => enqueue.stopChild(j.ref));
        enqueue.assign({ jobs: [] });
      }),
      on: { START: 'Tracking' },
    },
  },
});

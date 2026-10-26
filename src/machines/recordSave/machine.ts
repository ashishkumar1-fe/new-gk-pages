import { setup, assign } from 'xstate';
import { actors } from './actors';
import { outcomeOf } from './actions';
import type { RecordSaveContext, RecordSaveEvent, SaveInput } from './types';
export type { SaveInput };

/**
 * One save machine drives every editor. Dirty and valid stay in the form; this only runs the save.
 * A SAVE while saving queues one follow-up with the latest values. Partial comes from steps; Conflict offers reload only.
 * Diagram and rules: docs/architecture/docs/machines.md#record-save
 */
export const recordSaveMachine = setup({
  types: { context: {} as RecordSaveContext, events: {} as RecordSaveEvent, input: {} as SaveInput },
  actors,
}).createMachine({
  id: 'recordSave',
  context: ({ input }) => ({ save: input.save }),
  initial: 'idle',
  states: {
    idle: { on: { SAVE: { target: 'saving', actions: assign({ values: ({ event }) => event.values, result: undefined }) } } },
    saving: {
      tags: ['busy', 'unsaved'],
      on: { SAVE: { actions: assign({ queued: ({ event }) => event.values }) } }, // a second Save queues one follow-up
      invoke: {
        src: 'save',
        input: ({ context }) => ({ save: context.save, values: context.values! }),
        onDone: [
          {
            guard: ({ event }) => outcomeOf(event.output) === 'saved',
            target: 'saved',
            actions: assign({ result: ({ event }) => event.output }),
          },
          {
            guard: ({ event }) => outcomeOf(event.output) === 'invalid',
            target: 'invalid',
            actions: assign({ result: ({ event }) => event.output }),
          },
          { guard: ({ event }) => outcomeOf(event.output) === 'idle', target: 'idle' },
          {
            guard: ({ event }) => outcomeOf(event.output) === 'partial',
            target: 'partial',
            actions: assign({ result: ({ event }) => event.output }),
          },
          {
            guard: ({ event }) => outcomeOf(event.output) === 'conflict',
            target: 'conflict',
            actions: assign({ result: ({ event }) => event.output }),
          },
          { target: 'failed', actions: assign({ result: ({ event }) => event.output }) },
        ],
        onError: {
          target: 'failed',
          actions: assign({ result: ({ event }) => ({ status: 'error' as const, message: String(event.error), retryable: true }) }),
        },
      },
    },
    saved: {
      always: {
        guard: ({ context }) => !!context.queued,
        target: 'saving',
        actions: assign({ values: ({ context }) => context.queued, queued: undefined }),
      },
      on: { SAVE: { target: 'saving', actions: assign({ values: ({ event }) => event.values }) }, RESET: 'idle' },
    },
    invalid: { tags: ['unsaved'], on: { SAVE: { target: 'saving', actions: assign({ values: ({ event }) => event.values }) } } },
    partial: {
      tags: ['unsaved'],
      on: { RETRY: 'saving', SAVE: { target: 'saving', actions: assign({ values: ({ event }) => event.values }) } },
    }, // retry the rest
    failed: {
      tags: ['unsaved'],
      on: { RETRY: 'saving', SAVE: { target: 'saving', actions: assign({ values: ({ event }) => event.values }) } },
    },
    conflict: { tags: ['unsaved'], on: { RESET: 'idle' } }, // changed elsewhere: the editor offers reload, nothing else
  },
});

import { setup, assign } from 'xstate';
import { actors } from './actors';
import { previewIsValid } from './actions';
import type { ImportFlowContext, ImportFlowEvent, ImportFlowInput } from './types';

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * Dialog from a list page. One machine for every import, configured by the resource's import commands and JobSpec.
 * Start import is the confirm. A previewed job that is never started stays on the server (bulk-ops cancels only running jobs).
 * Diagram and rules: docs/architecture/docs/machines.md#import
 */
export const importFlowMachine = setup({
  types: { context: {} as ImportFlowContext, events: {} as ImportFlowEvent, input: {} as ImportFlowInput },
  actors,
}).createMachine({
  id: 'importFlow',
  context: ({ input }) => ({ ...input }),
  initial: 'Choosing',
  states: {
    Choosing: {
      on: {
        FILE: { target: 'Previewing', actions: assign({ file: ({ event }) => event.file, preview: undefined, error: undefined }) },
        CANCEL: 'Closed',
      },
    },
    Previewing: {
      invoke: {
        src: 'preview',
        input: ({ context }) => ({ resource: context.resource, file: context.file!, ctx: context.ctx }),
        onDone: [
          {
            guard: ({ event }) => previewIsValid(event.output),
            target: 'Ready',
            actions: assign({ preview: ({ event }) => event.output }),
          },
          { target: 'Invalid', actions: assign({ preview: ({ event }) => event.output }) },
        ],
        onError: { target: 'Choosing', actions: assign({ error: ({ event }) => message(event.error) }) },
      },
      on: { CANCEL: 'Closed' },
    },
    Invalid: {
      on: { FILE: { target: 'Previewing', actions: assign({ file: ({ event }) => event.file, preview: undefined }) }, CANCEL: 'Closed' },
    },
    Ready: {
      on: {
        FILE: { target: 'Previewing', actions: assign({ file: ({ event }) => event.file, preview: undefined }) },
        START: 'Starting',
        CANCEL: 'Closed',
      },
    },
    Starting: {
      invoke: {
        src: 'start',
        input: ({ context }) => ({ resource: context.resource, label: context.label, preview: context.preview!, ctx: context.ctx }),
        onDone: 'Started',
        onError: { target: 'Ready', actions: assign({ error: ({ event }) => message(event.error) }) },
      },
    },
    Started: { type: 'final' },
    Closed: { type: 'final' },
  },
});

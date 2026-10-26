import { setup, assign } from 'xstate';
import { actors } from './actors';
import { choicesError } from './actions';
import type { ExportFlowContext, ExportFlowEvent, ExportFlowInput } from './types';

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

/**
 * Dialog from a list page. One machine for every bulk-ops export: choose groups, date range and format → preview (job id and
 * estimate) → Start export (the confirm) → TRACK to Jobs. Diagram and rules: docs/architecture/docs/machines.md#export
 */
export const exportFlowMachine = setup({
  types: { context: {} as ExportFlowContext, events: {} as ExportFlowEvent, input: {} as ExportFlowInput },
  actors,
}).createMachine({
  id: 'exportFlow',
  context: ({ input }) => ({ ...input }),
  initial: 'Configuring',
  states: {
    Configuring: {
      on: {
        PREVIEW: [
          { guard: ({ event }) => !!choicesError(event.choices), actions: assign({ error: ({ event }) => choicesError(event.choices) }) },
          { target: 'Previewing', actions: assign({ choices: ({ event }) => event.choices, error: undefined }) },
        ],
        CANCEL: 'Closed',
      },
    },
    Previewing: {
      invoke: {
        src: 'preview',
        input: ({ context }) => ({ resource: context.resource, choices: context.choices!, ctx: context.ctx }),
        onDone: { target: 'Ready', actions: assign({ preview: ({ event }) => event.output }) },
        onError: { target: 'Configuring', actions: assign({ error: ({ event }) => message(event.error) }) },
      },
      on: { CANCEL: 'Closed' },
    },
    Ready: { on: { CHANGE: { target: 'Configuring', actions: assign({ preview: undefined }) }, START: 'Starting', CANCEL: 'Closed' } },
    Starting: {
      invoke: {
        src: 'start',
        input: ({ context }) => ({ resource: context.resource, label: context.label, preview: context.preview!, ctx: context.ctx }),
        onDone: 'Started',
        onError: { target: 'Configuring', actions: assign({ error: ({ event }) => message(event.error), preview: undefined }) },
      },
    },
    Started: { type: 'final' },
    Closed: { type: 'final' },
  },
});

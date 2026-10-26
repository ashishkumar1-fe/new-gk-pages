import { setup } from 'xstate';
import type { RefundContext, RefundEvent } from './types';

/**
 * Drawer on order detail. Calculate is the command preview (300 ms debounce); Reviewing is the confirm; poll 5 s × 24.
 * Diagram and rules: docs/architecture/docs/machines.md#refund
 * Every async state must get a way out (timeout or limit, error state, RETRY/CLOSE) as actors are filled in.
 */
export const refundMachine = setup({
  types: { context: {} as RefundContext, events: {} as RefundEvent },
}).createMachine({
  id: 'refund',
  context: {},
  initial: 'Selecting',
  states: {
    Selecting: { on: { CHANGE: 'Calculating' } },
    Calculating: { on: { PREVIEW_OK: 'Reviewing', CANNOT_REFUND: 'Selecting' } },
    Reviewing: { on: { EDIT: 'Selecting', SUBMIT: 'Submitting' } },
    Submitting: { on: { ACCEPTED: 'Polling', ERROR: 'Failed' } },
    Polling: { on: { SUCCESS: 'Succeeded', FAILED: 'Failed', LIMIT: 'StillProcessing' } },
    Succeeded: { on: {} },
    Failed: { on: { RETRY: 'Submitting' } },
    StillProcessing: { on: {} },
  },
});

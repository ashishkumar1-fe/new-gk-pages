import { setup } from 'xstate';
import type { DraftPaymentWatchContext, DraftPaymentWatchEvent } from './types';

/**
 * Banner on a draft with a live payment link. 8 s, ≤ 30 min, 5 errors in a row. Converted → open the order.
 * Diagram and rules: docs/architecture/docs/machines.md#draftpaymentwatch
 * Every async state must get a way out (timeout or limit, error state, RETRY/CLOSE) as actors are filled in.
 */
export const draftPaymentWatchMachine = setup({
  types: { context: {} as DraftPaymentWatchContext, events: {} as DraftPaymentWatchEvent },
}).createMachine({
  id: 'draftPaymentWatch',
  context: {},
  initial: 'Watching',
  states: {
    Watching: { on: { HIDDEN: 'Paused', ORDER_ID: 'Converted', TIMEOUT: 'GaveUp', ERRORS: 'Failed' } },
    Paused: { on: { VISIBLE: 'Watching' } },
    Converted: { on: {} },
    GaveUp: { on: {} },
    Failed: { on: {} },
  },
});

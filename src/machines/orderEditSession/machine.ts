import { setup } from 'xstate';
import type { OrderEditSessionContext, OrderEditSessionEvent } from './types';

/**
 * /orders/$id/edit. begin → stage (500 ms) → preview → commit; takeover, stale retry 15 s ≤ 6 min, commit 5xx → Checking. Codes: docs/architecture/gateway/os-order.md
 * Diagram and rules: docs/architecture/docs/machines.md#ordereditsession
 * Every async state must get a way out (timeout or limit, error state, RETRY/CLOSE) as actors are filled in.
 */
export const orderEditSessionMachine = setup({
  types: { context: {} as OrderEditSessionContext, events: {} as OrderEditSessionEvent },
}).createMachine({
  id: 'orderEditSession',
  context: {},
  initial: 'Beginning',
  states: {
    Beginning: { on: { OPEN: 'Editing', STALE: 'WaitingForStale', ACTIVE_EXISTS: 'Takeover' } },
    WaitingForStale: { on: { TICK: 'Beginning', TIMEOUT: 'Failed' } },
    Takeover: { on: { DISCARD_CONTINUE: 'Beginning' } },
    Editing: { on: { CHANGE: 'Staging' } },
    Staging: { on: { PREVIEWED: 'Previewed' } },
    Previewed: { on: { CHANGE: 'Staging', SAVE: 'Committing' } },
    Committing: { on: { OK: 'Committed', SESSION_GONE: 'Beginning', UNKNOWN: 'Checking', FULFILLMENT_CHANGED: 'Failed' } },
    Checking: { on: { COMMITTED: 'Committed', ACTIVE: 'Committing', UNKNOWN: 'Failed' } },
    Committed: { on: {} },
    Failed: { on: {} },
  },
});

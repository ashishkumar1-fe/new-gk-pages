import { setup } from 'xstate';
import type { SessionContext, SessionEvent } from './types';

/**
 * App-wide (1 instance). The one source of storeId. GET /user/details is both the session check and the user load. Routes render only in Ready.
 * Diagram and rules: docs/architecture/docs/machines.md#session
 * Every async state must get a way out (timeout or limit, error state, RETRY/CLOSE) as actors are filled in.
 */
export const sessionMachine = setup({
  types: { context: {} as SessionContext, events: {} as SessionEvent },
}).createMachine({
  id: 'session',
  context: {},
  initial: 'Booting',
  states: {
    Booting: { on: { UNAUTHORIZED: 'Login', LOADED: 'PickingMerchant' } },
    Login: { on: { SIGNED_IN: 'Booting' } },
    PickingMerchant: { on: { PICKED: 'CheckingEntitlement' } },
    CheckingEntitlement: { on: { ENTITLED: 'Ready', NOT_ENTITLED: 'NoAccess' } },
    Ready: { on: { SWITCH: 'SwitchingStore', UNAUTHORIZED: 'Login', LOGOUT: 'LoggingOut' } },
    SwitchingStore: { on: { DONE: 'Booting' } },
    NoAccess: { on: {} },
    LoggingOut: { on: { DONE: 'Login' } },
  },
});

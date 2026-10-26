import { setup } from 'xstate';
import type { LoginContext, LoginEvent } from './types';

/**
 * Page machine for /login. signin 400 "otp already sent" counts as sent; resend after 30 s.
 * Diagram and rules: docs/architecture/docs/machines.md#login
 * Every async state must get a way out (timeout or limit, error state, RETRY/CLOSE) as actors are filled in.
 */
export const loginMachine = setup({
  types: { context: {} as LoginContext, events: {} as LoginEvent },
}).createMachine({
  id: 'login',
  context: {},
  initial: 'Credentials',
  states: {
    Credentials: { on: { SUBMIT: 'SigningIn', GOOGLE: 'Google' } },
    SigningIn: { on: { CODE_SENT: 'Otp', UNVERIFIED: 'UnverifiedEmail', INVALID: 'Credentials' } },
    Google: { on: { OK: 'LoadingStore', UNAUTHORIZED: 'Credentials' } },
    Otp: { on: { RESEND: 'Otp', SIX_DIGITS: 'Verifying' } },
    UnverifiedEmail: { on: { SEND_OTP: 'Otp' } },
    Verifying: { on: { WRONG: 'Otp', PASSWORD_CHANGE: 'PasswordChange', OLD_DASHBOARD: 'OldDashboard', OK: 'LoadingStore' } },
    PasswordChange: { on: { DONE: 'LoadingStore' } },
    OldDashboard: { on: {} },
    LoadingStore: { on: {} },
  },
});

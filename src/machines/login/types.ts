export type LoginEvent =
  | { type: 'CODE_SENT' }
  | { type: 'DONE' }
  | { type: 'GOOGLE' }
  | { type: 'INVALID' }
  | { type: 'OK' }
  | { type: 'OLD_DASHBOARD' }
  | { type: 'PASSWORD_CHANGE' }
  | { type: 'RESEND' }
  | { type: 'SEND_OTP' }
  | { type: 'SIX_DIGITS' }
  | { type: 'SUBMIT' }
  | { type: 'UNAUTHORIZED' }
  | { type: 'UNVERIFIED' }
  | { type: 'WRONG' };
export interface LoginContext {
  error?: string;
} // ids and flow choices only; server data stays in the query cache

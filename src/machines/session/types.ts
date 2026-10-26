export type SessionEvent =
  | { type: 'DONE' }
  | { type: 'ENTITLED' }
  | { type: 'LOADED' }
  | { type: 'LOGOUT' }
  | { type: 'NOT_ENTITLED' }
  | { type: 'PICKED' }
  | { type: 'SIGNED_IN' }
  | { type: 'SWITCH' }
  | { type: 'UNAUTHORIZED' };
export interface SessionContext {
  error?: string;
} // ids and flow choices only; server data stays in the query cache

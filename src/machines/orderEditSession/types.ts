export type OrderEditSessionEvent =
  | { type: 'ACTIVE' }
  | { type: 'ACTIVE_EXISTS' }
  | { type: 'CHANGE' }
  | { type: 'COMMITTED' }
  | { type: 'DISCARD_CONTINUE' }
  | { type: 'FULFILLMENT_CHANGED' }
  | { type: 'OK' }
  | { type: 'OPEN' }
  | { type: 'PREVIEWED' }
  | { type: 'SAVE' }
  | { type: 'SESSION_GONE' }
  | { type: 'STALE' }
  | { type: 'TICK' }
  | { type: 'TIMEOUT' }
  | { type: 'UNKNOWN' };
export interface OrderEditSessionContext {
  error?: string;
} // ids and flow choices only; server data stays in the query cache

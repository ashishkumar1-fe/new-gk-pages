export type DraftPaymentWatchEvent =
  { type: 'ERRORS' } | { type: 'HIDDEN' } | { type: 'ORDER_ID' } | { type: 'TIMEOUT' } | { type: 'VISIBLE' };
export interface DraftPaymentWatchContext {
  error?: string;
} // ids and flow choices only; server data stays in the query cache

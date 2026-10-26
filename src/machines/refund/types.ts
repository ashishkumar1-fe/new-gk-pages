export type RefundEvent =
  | { type: 'ACCEPTED' }
  | { type: 'CANNOT_REFUND' }
  | { type: 'CHANGE' }
  | { type: 'EDIT' }
  | { type: 'ERROR' }
  | { type: 'FAILED' }
  | { type: 'LIMIT' }
  | { type: 'PREVIEW_OK' }
  | { type: 'RETRY' }
  | { type: 'SUBMIT' }
  | { type: 'SUCCESS' };
export interface RefundContext {
  error?: string;
} // ids and flow choices only; server data stays in the query cache

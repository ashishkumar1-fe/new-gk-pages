export type DiscountWizardEvent =
  | { type: 'CANCEL' }
  | { type: 'CHOOSE' }
  | { type: 'CONTINUE' }
  | { type: 'ERROR' }
  | { type: 'FAILED' }
  | { type: 'LOADED' }
  | { type: 'OK' }
  | { type: 'PUBLISH' }
  | { type: 'RETRY' }
  | { type: 'TAKEN' };
export interface DiscountWizardContext {
  error?: string;
} // ids and flow choices only; server data stays in the query cache

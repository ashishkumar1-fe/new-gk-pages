export type AssistantEvent =
  | { type: 'ANSWER' }
  | { type: 'APPROVE' }
  | { type: 'CANCEL' }
  | { type: 'MESSAGE' }
  | { type: 'READ_RESULT' }
  | { type: 'REJECT' }
  | { type: 'RESULT' }
  | { type: 'WRITE_TOOL' };
export interface AssistantContext {
  error?: string;
} // ids and flow choices only; server data stays in the query cache

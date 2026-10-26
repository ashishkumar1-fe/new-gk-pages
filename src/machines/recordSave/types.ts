import type { CommandResult } from '@/commands/define';

export interface SaveInput {
  save: (values: Record<string, unknown>) => Promise<CommandResult<unknown>>;
}
export type RecordSaveEvent = { type: 'SAVE'; values: Record<string, unknown> } | { type: 'RETRY' } | { type: 'RESET' };
/** The values being saved and at most one queued follow-up; dirty and valid stay in the form. */
export interface RecordSaveContext {
  values?: Record<string, unknown>;
  queued?: Record<string, unknown>;
  result?: CommandResult<unknown>;
  save: SaveInput['save'];
}

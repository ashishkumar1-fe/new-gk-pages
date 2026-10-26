import type { CommandContext } from '@/commands/define';
import type { ExportPreview } from '@/domain/job/schema';

export interface ExportChoices {
  format: 'csv' | 'xlsx';
  dateRange?: { from?: string; to?: string };
  groups?: Record<string, string[]>;
}
export interface ExportFlowInput {
  resource: string;
  label: string;
  ctx: CommandContext;
}
export type ExportFlowEvent = { type: 'PREVIEW'; choices: ExportChoices } | { type: 'CHANGE' } | { type: 'START' } | { type: 'CANCEL' };
/** Flow choices only: what to export and the server's estimate. */
export interface ExportFlowContext extends ExportFlowInput {
  choices?: ExportChoices;
  preview?: ExportPreview;
  error?: string;
}

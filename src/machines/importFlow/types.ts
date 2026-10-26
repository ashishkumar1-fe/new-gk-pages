import type { CommandContext } from '@/commands/define';
import type { ImportPreview } from '@/domain/job/schema';

export interface ImportFlowInput {
  resource: string;
  label: string;
  ctx: CommandContext;
}
export type ImportFlowEvent = { type: 'FILE'; file: File } | { type: 'START' } | { type: 'CANCEL' };
/** Flow choices only: the chosen file and the server's preview of it. */
export interface ImportFlowContext extends ImportFlowInput {
  file?: File;
  preview?: ImportPreview;
  error?: string;
}

import { fromPromise } from 'xstate';
import { runCommand } from '@/commands/runCommand';
import type { CommandContext } from '@/commands/define';
import type { ImportPreview } from '@/domain/job/schema';
import { trackJob } from '../jobs';

const failOf = (r: { status: string; message?: string; reason?: string; fieldErrors?: Record<string, string> }) =>
  r.message ?? r.reason ?? Object.values(r.fieldErrors ?? {})[0] ?? 'Something went wrong';

/** Async work: `<resource>.importPreview` then `<resource>.import` through runCommand. Replaced in tests. */
export const actors = {
  preview: fromPromise<ImportPreview, { resource: string; file: File; ctx: CommandContext }>(async ({ input }) => {
    const r = await runCommand<ImportPreview>(`${input.resource}.importPreview`, { file: input.file }, input.ctx);
    if (r.status !== 'success') throw new Error(failOf(r as never));
    return r.data;
  }),
  /** "Start import" is the confirm (machines.md#import), so the command runs with confirmed: true. */
  start: fromPromise<{ jobId: string }, { resource: string; label: string; preview: ImportPreview; ctx: CommandContext }>(
    async ({ input }) => {
      const id = `${input.resource}.import` as const;
      const r = await runCommand<{ jobId: string }>(
        id,
        { jobId: input.preview.jobId, rows: input.preview.totalRows },
        { ...input.ctx, confirmed: true },
      );
      if (r.status !== 'success') throw new Error(failOf(r as never));
      trackJob(r.data.jobId, id, input.label);
      return r.data;
    },
  ),
};

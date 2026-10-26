import { fromPromise } from 'xstate';
import { runCommand } from '@/commands/runCommand';
import type { CommandContext } from '@/commands/define';
import type { ExportPreview } from '@/domain/job/schema';
import { trackJob } from '../jobs';
import type { ExportChoices } from './types';

const failOf = (r: { message?: string; reason?: string; fieldErrors?: Record<string, string> }) =>
  r.message ?? r.reason ?? Object.values(r.fieldErrors ?? {})[0] ?? 'Something went wrong';

/** Async work: `<resource>.exportPreview` then `<resource>.export` through runCommand. Replaced in tests. */
export const actors = {
  preview: fromPromise<ExportPreview, { resource: string; choices: ExportChoices; ctx: CommandContext }>(async ({ input }) => {
    const r = await runCommand<ExportPreview>(
      `${input.resource}.exportPreview`,
      { ...input.choices, groups: input.choices.groups ?? {} },
      input.ctx,
    );
    if (r.status !== 'success') throw new Error(failOf(r as never));
    return r.data;
  }),
  /** "Start export" is the confirm, so the command runs with confirmed: true; the job is then followed by Jobs. */
  start: fromPromise<{ jobId: string }, { resource: string; label: string; preview: ExportPreview; ctx: CommandContext }>(
    async ({ input }) => {
      const id = `${input.resource}.export` as const;
      const r = await runCommand<{ jobId: string }>(id, { jobId: input.preview.jobId }, { ...input.ctx, confirmed: true });
      if (r.status !== 'success') throw new Error(failOf(r as never));
      trackJob(r.data.jobId, id, input.label);
      return r.data;
    },
  ),
};

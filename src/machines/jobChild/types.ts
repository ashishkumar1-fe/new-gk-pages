import type { JobSpec, JobStatus } from '@/commands/define';

export interface JobChildInput {
  jobId: string;
  label: string;
  spec: JobSpec<unknown>;
  startedAt?: number;
}
export type JobChildEvent = { type: 'HIDDEN' } | { type: 'VISIBLE' } | { type: 'CANCEL' };
/** Ids and flow choices only; the job's data stays on the server. */
export interface JobChildContext {
  jobId: string;
  label: string;
  spec: JobSpec<unknown>;
  startedAt: number;
  attempts: number;
  consecutiveErrors: number;
  progress?: { done: number; total: number };
  error?: string;
  ending?: 'Completed' | 'Failed' | 'GaveUp' | 'Cancelled';
}
export type PollOutcome = JobStatus<unknown>;

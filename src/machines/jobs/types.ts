import type { ActorRefFrom } from 'xstate';
import type { jobChildMachine } from '../jobChild/machine';
import type { CommandId } from '@/commands/define';

export type JobsEvent =
  | { type: 'TRACK'; jobId: string; commandId: CommandId; label: string }
  | { type: 'CANCEL'; jobId: string }
  | { type: 'STOP_ALL' }
  | { type: 'START' };
export interface TrackedJob {
  jobId: string;
  label: string;
  ref: ActorRefFrom<typeof jobChildMachine>;
}
/** Ids only; progress lives in each child, data on the server. */
export interface JobsContext {
  jobs: TrackedJob[];
}
export interface JobEnded {
  jobId: string;
  label: string;
  state: string;
  error?: string;
}

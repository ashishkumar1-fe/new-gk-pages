import { createActor } from 'xstate';
import { useSelector } from '@xstate/react';
import { jobsMachine } from './machine';
import type { CommandId } from '@/commands/define';
import type { TrackedJob } from './types';

/** App-wide: one instance at the root (systemId 'jobs'). */
export const jobsActor = createActor(jobsMachine, { systemId: 'jobs' });
jobsActor.start();

export const trackJob = (jobId: string, commandId: CommandId, label: string) => jobsActor.send({ type: 'TRACK', jobId, commandId, label });
/** Store switch or logout: stop following; START resumes for the new store. */
export const stopAllJobs = () => {
  jobsActor.send({ type: 'STOP_ALL' });
  jobsActor.send({ type: 'START' });
};

/** Components never import XState. They get plain values and senders. */
export function useJobs() {
  const jobs = useSelector(jobsActor, (s) => s.context.jobs);
  return { jobs, cancel: (jobId: string) => jobsActor.send({ type: 'CANCEL', jobId }) };
}

/** One job's live state for the indicator. */
export function useJobProgress(job: TrackedJob) {
  return useSelector(job.ref, (s) => ({ state: String(s.value), progress: s.context.progress, running: s.hasTag('running') }));
}
export type { TrackedJob };

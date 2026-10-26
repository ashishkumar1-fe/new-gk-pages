/** Job children are spawned by the Jobs machine; components read them through useJobs / useJobProgress (machines/jobs). */
export { jobChildMachine } from './machine';
export type { JobChildInput } from './types';

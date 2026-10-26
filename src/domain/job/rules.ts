import type { Job } from './schema';

// Pure rules, ported as today. Each cites the gk-pages source it came from (docs/architecture/resources/registry.md (job)).
// Unused-type guard for entities whose rules take narrower inputs:
export type { Job as _Job };

/** bulk-ops job progress isCompleted */
export const isTerminal = (j: Pick<Job, 'status'>) => ['completed', 'failed', 'cancelled'].includes(j.status.toLowerCase());

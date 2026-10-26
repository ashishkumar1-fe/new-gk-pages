import type { JobEnded } from './types';

/** The one message per ending, as a toast (notifications are off in v1). */
export const endMessage = (e: JobEnded): { text: string; tone: 'default' | 'warning' | 'critical' } => {
  switch (e.state) {
    case 'Completed':
      return { text: `${e.label} finished`, tone: 'default' };
    case 'Cancelled':
      return { text: `${e.label} cancelled`, tone: 'warning' };
    case 'GaveUp':
      return { text: `${e.label} is taking longer than expected. Check job history later.`, tone: 'warning' };
    default:
      return { text: `${e.label} failed${e.error ? `: ${e.error}` : ''}`, tone: 'critical' };
  }
};

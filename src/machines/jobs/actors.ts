import { getCommandHost } from '@/commands/host';
import { endMessage } from './actions';
import type { JobEnded } from './types';

/** Side effects of the Jobs machine, replaceable in tests. */
export const effects = {
  notify: (e: JobEnded) => {
    const m = endMessage(e);
    getCommandHost().toast(m.text, m.tone);
  },
};

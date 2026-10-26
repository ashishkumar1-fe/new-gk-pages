import type { CommandResult } from '@/commands/define';

/** Which state a command result lands in. A conflict offers reload only, never a force save. */
export const outcomeOf = (r: CommandResult<unknown>): 'saved' | 'invalid' | 'idle' | 'partial' | 'conflict' | 'failed' => {
  switch (r.status) {
    case 'success':
      return 'saved';
    case 'invalid':
      return 'invalid';
    case 'cancelled':
      return 'idle';
    case 'partial':
      return 'partial';
    case 'error':
      return r.conflict ? 'conflict' : 'failed';
    default:
      return 'failed';
  }
};

import { fromPromise } from 'xstate';
import type { CommandResult } from '@/commands/define';
import type { SaveInput } from './types';

/** The save itself: the editor's `save` command through runCommand, injected by the editor. Replaceable in tests. */
export const actors = {
  save: fromPromise<CommandResult<unknown>, { save: SaveInput['save']; values: Record<string, unknown> }>(({ input }) =>
    input.save(input.values),
  ),
};

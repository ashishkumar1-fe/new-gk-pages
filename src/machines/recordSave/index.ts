import { useActor } from '@xstate/react';
import { recordSaveMachine, type SaveInput } from './machine';

/** Components never import XState. They get plain values and senders. */
export function useRecordSave(save: SaveInput['save']) {
  const [snap, send] = useActor(recordSaveMachine, { input: { save } });
  return {
    state: snap.value as 'idle' | 'saving' | 'saved' | 'invalid' | 'partial' | 'failed' | 'conflict',
    busy: snap.hasTag('busy'),
    result: snap.context.result,
    save: (values: Record<string, unknown>) => send({ type: 'SAVE', values }),
    retry: () => send({ type: 'RETRY' }),
    reset: () => send({ type: 'RESET' }),
  };
}

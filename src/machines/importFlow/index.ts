import { useActor } from '@xstate/react';
import { importFlowMachine } from './machine';
import type { ImportFlowInput } from './types';

/** Components never import XState. They get plain values and senders. */
export function useImportFlow(input: ImportFlowInput) {
  const [snap, send] = useActor(importFlowMachine, { input });
  return {
    state: String(snap.value) as 'Choosing' | 'Previewing' | 'Invalid' | 'Ready' | 'Starting' | 'Started' | 'Closed',
    preview: snap.context.preview,
    error: snap.context.error,
    fileName: snap.context.file?.name,
    choose: (file: File) => send({ type: 'FILE', file }),
    start: () => send({ type: 'START' }),
    cancel: () => send({ type: 'CANCEL' }),
  };
}

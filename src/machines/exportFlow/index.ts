import { useActor } from '@xstate/react';
import { exportFlowMachine } from './machine';
import type { ExportChoices, ExportFlowInput } from './types';

/** Components never import XState. They get plain values and senders. */
export function useExportFlow(input: ExportFlowInput) {
  const [snap, send] = useActor(exportFlowMachine, { input });
  return {
    state: String(snap.value) as 'Configuring' | 'Previewing' | 'Ready' | 'Starting' | 'Started' | 'Closed',
    preview: snap.context.preview,
    error: snap.context.error,
    previewWith: (choices: ExportChoices) => send({ type: 'PREVIEW', choices }),
    change: () => send({ type: 'CHANGE' }),
    start: () => send({ type: 'START' }),
    cancel: () => send({ type: 'CANCEL' }),
  };
}
export type { ExportChoices };

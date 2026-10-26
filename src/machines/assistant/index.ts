import { useActor } from '@xstate/react';
import { assistantMachine } from './machine';
import type { AssistantEvent } from './types';

/** Components never import XState. They get plain values and senders. */
export function useAssistant() {
  const [snap, send] = useActor(assistantMachine);
  return { state: String(snap.value), send: (e: AssistantEvent) => send(e) };
}

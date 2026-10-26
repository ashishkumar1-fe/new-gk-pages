import { useActor } from '@xstate/react';
import { sessionMachine } from './machine';
import type { SessionEvent } from './types';

/** Components never import XState. They get plain values and senders. */
export function useSession() {
  const [snap, send] = useActor(sessionMachine);
  return { state: String(snap.value), send: (e: SessionEvent) => send(e) };
}

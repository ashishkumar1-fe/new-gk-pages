import { useActor } from '@xstate/react';
import { draftPaymentWatchMachine } from './machine';
import type { DraftPaymentWatchEvent } from './types';

/** Components never import XState. They get plain values and senders. */
export function useDraftPaymentWatch() {
  const [snap, send] = useActor(draftPaymentWatchMachine);
  return { state: String(snap.value), send: (e: DraftPaymentWatchEvent) => send(e) };
}

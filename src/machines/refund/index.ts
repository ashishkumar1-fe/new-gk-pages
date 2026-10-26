import { useActor } from '@xstate/react';
import { refundMachine } from './machine';
import type { RefundEvent } from './types';

/** Components never import XState. They get plain values and senders. */
export function useRefund() {
  const [snap, send] = useActor(refundMachine);
  return { state: String(snap.value), send: (e: RefundEvent) => send(e) };
}

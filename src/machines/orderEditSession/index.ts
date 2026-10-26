import { useActor } from '@xstate/react';
import { orderEditSessionMachine } from './machine';
import type { OrderEditSessionEvent } from './types';

/** Components never import XState. They get plain values and senders. */
export function useOrderEditSession() {
  const [snap, send] = useActor(orderEditSessionMachine);
  return { state: String(snap.value), send: (e: OrderEditSessionEvent) => send(e) };
}

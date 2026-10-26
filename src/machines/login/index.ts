import { useActor } from '@xstate/react';
import { loginMachine } from './machine';
import type { LoginEvent } from './types';

/** Components never import XState. They get plain values and senders. */
export function useLogin() {
  const [snap, send] = useActor(loginMachine);
  return { state: String(snap.value), send: (e: LoginEvent) => send(e) };
}

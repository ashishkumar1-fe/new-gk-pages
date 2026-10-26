import { useActor } from '@xstate/react';
import { discountWizardMachine } from './machine';
import type { DiscountWizardEvent } from './types';

/** Components never import XState. They get plain values and senders. */
export function useDiscountWizard() {
  const [snap, send] = useActor(discountWizardMachine);
  return { state: String(snap.value), send: (e: DiscountWizardEvent) => send(e) };
}

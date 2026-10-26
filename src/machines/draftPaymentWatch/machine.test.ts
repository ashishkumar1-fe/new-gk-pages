import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { draftPaymentWatchMachine } from './machine';

describe('draftPaymentWatch machine', () => {
  it('starts in Watching and takes HIDDEN to Paused', () => {
    const actor = createActor(draftPaymentWatchMachine).start();
    expect(actor.getSnapshot().matches('Watching')).toBe(true);
    actor.send({ type: 'HIDDEN' });
    expect(actor.getSnapshot().matches('Paused')).toBe(true);
  });
});

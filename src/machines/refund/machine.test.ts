import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { refundMachine } from './machine';

describe('refund machine', () => {
  it('starts in Selecting and takes CHANGE to Calculating', () => {
    const actor = createActor(refundMachine).start();
    expect(actor.getSnapshot().matches('Selecting')).toBe(true);
    actor.send({ type: 'CHANGE' });
    expect(actor.getSnapshot().matches('Calculating')).toBe(true);
  });
});

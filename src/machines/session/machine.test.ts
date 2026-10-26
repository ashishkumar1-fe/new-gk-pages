import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { sessionMachine } from './machine';

describe('session machine', () => {
  it('starts in Booting and takes UNAUTHORIZED to Login', () => {
    const actor = createActor(sessionMachine).start();
    expect(actor.getSnapshot().matches('Booting')).toBe(true);
    actor.send({ type: 'UNAUTHORIZED' });
    expect(actor.getSnapshot().matches('Login')).toBe(true);
  });
});

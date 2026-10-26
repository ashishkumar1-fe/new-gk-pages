import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { loginMachine } from './machine';

describe('login machine', () => {
  it('starts in Credentials and takes SUBMIT to SigningIn', () => {
    const actor = createActor(loginMachine).start();
    expect(actor.getSnapshot().matches('Credentials')).toBe(true);
    actor.send({ type: 'SUBMIT' });
    expect(actor.getSnapshot().matches('SigningIn')).toBe(true);
  });
});

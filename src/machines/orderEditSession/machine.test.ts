import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { orderEditSessionMachine } from './machine';

describe('orderEditSession machine', () => {
  it('starts in Beginning and takes OPEN to Editing', () => {
    const actor = createActor(orderEditSessionMachine).start();
    expect(actor.getSnapshot().matches('Beginning')).toBe(true);
    actor.send({ type: 'OPEN' });
    expect(actor.getSnapshot().matches('Editing')).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { assistantMachine } from './machine';

describe('assistant machine', () => {
  it('starts in Idle and takes MESSAGE to Thinking', () => {
    const actor = createActor(assistantMachine).start();
    expect(actor.getSnapshot().matches('Idle')).toBe(true);
    actor.send({ type: 'MESSAGE' });
    expect(actor.getSnapshot().matches('Thinking')).toBe(true);
  });
});

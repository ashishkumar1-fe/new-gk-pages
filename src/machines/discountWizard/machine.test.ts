import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { discountWizardMachine } from './machine';

describe('discountWizard machine', () => {
  it('starts in Step1 and takes CONTINUE to Step2', () => {
    const actor = createActor(discountWizardMachine).start();
    expect(actor.getSnapshot().matches('Step1')).toBe(true);
    actor.send({ type: 'CONTINUE' });
    expect(actor.getSnapshot().matches('Step2')).toBe(true);
  });
});

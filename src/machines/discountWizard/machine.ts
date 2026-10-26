import { setup } from 'xstate';
import type { DiscountWizardContext, DiscountWizardEvent } from './types';

/**
 * /discounts/new and /discounts/$id. Continue validates that step; steps cannot be skipped; the finish dialog is the confirm.
 * Diagram and rules: docs/architecture/docs/machines.md#discountwizard
 * Every async state must get a way out (timeout or limit, error state, RETRY/CLOSE) as actors are filled in.
 */
export const discountWizardMachine = setup({
  types: { context: {} as DiscountWizardContext, events: {} as DiscountWizardEvent },
}).createMachine({
  id: 'discountWizard',
  context: {},
  initial: 'Step1',
  states: {
    Step1: { on: { CONTINUE: 'Step2' } },
    Loading: { on: { LOADED: 'Step2', FAILED: 'LoadFailed' } },
    LoadFailed: { on: { RETRY: 'Loading' } },
    Step2: { on: { CONTINUE: 'CheckingCode' } },
    CheckingCode: { on: { TAKEN: 'Step2', OK: 'Step3' } },
    Step3: { on: { CONTINUE: 'Step4' } },
    Step4: { on: { CONTINUE: 'Step5' } },
    Step5: { on: { PUBLISH: 'Finishing' } },
    Finishing: { on: { CANCEL: 'Step5', CHOOSE: 'Saving' } },
    Saving: { on: { ERROR: 'Step5' } },
  },
});

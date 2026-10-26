import { setup } from 'xstate';
import type { AssistantContext, AssistantEvent } from './types';

/**
 * App-wide. Each reply carries its session id; a reply for an older session is dropped. Approve is blocked while a turn is in flight.
 * Diagram and rules: docs/architecture/docs/machines.md#assistant
 * Every async state must get a way out (timeout or limit, error state, RETRY/CLOSE) as actors are filled in.
 */
export const assistantMachine = setup({
  types: { context: {} as AssistantContext, events: {} as AssistantEvent },
}).createMachine({
  id: 'assistant',
  context: {},
  initial: 'Idle',
  states: {
    Idle: { on: { MESSAGE: 'Thinking' } },
    Thinking: { on: { READ_RESULT: 'Thinking', WRITE_TOOL: 'Proposing', ANSWER: 'Idle', CANCEL: 'Idle' } },
    Proposing: { on: { APPROVE: 'Running', REJECT: 'Thinking' } },
    Running: { on: { RESULT: 'Thinking' } },
  },
});

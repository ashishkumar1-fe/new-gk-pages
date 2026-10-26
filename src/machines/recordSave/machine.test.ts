import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { recordSaveMachine } from './machine';

describe('record save machine', () => {
  it('goes idle → saving → saved on success', async () => {
    const actor = createActor(recordSaveMachine, { input: { save: async () => ({ status: 'success', data: {} }) } }).start();
    actor.send({ type: 'SAVE', values: { title: 'x' } });
    expect(actor.getSnapshot().matches('saving')).toBe(true);
    await new Promise((r) => setTimeout(r, 0));
    expect(actor.getSnapshot().matches('saved')).toBe(true);
  });
  it('queues one follow-up while saving instead of running twice', async () => {
    let calls = 0;
    const actor = createActor(recordSaveMachine, {
      input: {
        save: async () => {
          calls++;
          await new Promise((r) => setTimeout(r, 5));
          return { status: 'success', data: {} };
        },
      },
    }).start();
    actor.send({ type: 'SAVE', values: { n: 1 } });
    actor.send({ type: 'SAVE', values: { n: 2 } });
    actor.send({ type: 'SAVE', values: { n: 3 } });
    await new Promise((r) => setTimeout(r, 30));
    expect(calls).toBe(2);
    expect(actor.getSnapshot().matches('saved')).toBe(true);
  });
  it('lands in failed on an error result and retries with RETRY', async () => {
    let n = 0;
    const actor = createActor(recordSaveMachine, {
      input: { save: async () => (++n === 1 ? { status: 'error', message: 'boom', retryable: true } : { status: 'success', data: {} }) },
    }).start();
    actor.send({ type: 'SAVE', values: {} });
    await new Promise((r) => setTimeout(r, 0));
    expect(actor.getSnapshot().matches('failed')).toBe(true);
    actor.send({ type: 'RETRY' });
    await new Promise((r) => setTimeout(r, 0));
    expect(actor.getSnapshot().matches('saved')).toBe(true);
  });
});

describe('record save: partial and conflict', () => {
  it('lands in partial when a later step failed, and retries', async () => {
    let n = 0;
    const a = createActor(recordSaveMachine, {
      input: {
        save: async () =>
          ++n === 1 ? { status: 'partial', data: {}, failed: [{ id: 'addr_2', reason: 'bad pin' }] } : { status: 'success', data: {} },
      },
    }).start();
    a.send({ type: 'SAVE', values: {} });
    await new Promise((r) => setTimeout(r, 0));
    expect(a.getSnapshot().matches('partial')).toBe(true);
    a.send({ type: 'RETRY' });
    await new Promise((r) => setTimeout(r, 0));
    expect(a.getSnapshot().matches('saved')).toBe(true);
  });
  it('lands in conflict on "changed elsewhere" and offers no retry', async () => {
    const a = createActor(recordSaveMachine, {
      input: { save: async () => ({ status: 'error', message: 'changed', retryable: false, conflict: true }) },
    }).start();
    a.send({ type: 'SAVE', values: {} });
    await new Promise((r) => setTimeout(r, 0));
    expect(a.getSnapshot().matches('conflict')).toBe(true);
    a.send({ type: 'RETRY' });
    expect(a.getSnapshot().matches('conflict')).toBe(true);
  });
});

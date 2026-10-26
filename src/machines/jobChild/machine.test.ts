import { describe, it, expect, vi, afterEach } from 'vitest';
import { createActor, fromPromise } from 'xstate';
import { jobChildMachine } from './machine';
import type { JobSpec, JobStatus } from '@/commands/define';

const spec = (over: Partial<JobSpec<unknown>['policy']> = {}): JobSpec<unknown> => ({
  jobId: () => 'j',
  poll: async () => ({ state: 'running' }),
  cancel: async () => {},
  policy: { intervalMs: 5000, maxConsecutiveErrors: 5, pauseWhenHidden: true, ...over },
});
const start = (s: JobSpec<unknown>, poll: () => Promise<JobStatus<unknown>>) =>
  createActor(jobChildMachine.provide({ actors: { poll: fromPromise(poll) } }), {
    input: { jobId: 'j1', label: 'Product export', spec: s, startedAt: Date.now() },
  }).start();

afterEach(() => {
  vi.useRealTimers();
});

describe('job child machine', () => {
  it('waits intervalMs, checks, and keeps progress while running', async () => {
    vi.useFakeTimers();
    const a = start(spec(), async () => ({ state: 'running', progress: { done: 2, total: 6 } }));
    expect(a.getSnapshot().matches('Waiting')).toBe(true);
    await vi.advanceTimersByTimeAsync(5000);
    expect(a.getSnapshot().matches('Waiting')).toBe(true);
    expect(a.getSnapshot().context.progress).toEqual({ done: 2, total: 6 });
    expect(a.getSnapshot().context.attempts).toBe(1);
  });
  it('completes and reports its ending as output', async () => {
    vi.useFakeTimers();
    const a = start(spec(), async () => ({ state: 'completed', result: {} }));
    await vi.advanceTimersByTimeAsync(5000);
    expect(a.getSnapshot().status).toBe('done');
    expect(a.getSnapshot().output).toMatchObject({ jobId: 'j1', state: 'Completed' });
  });
  it('gives up after maxAttempts', async () => {
    vi.useFakeTimers();
    const a = start(spec({ maxAttempts: 2 }), async () => ({ state: 'running' }));
    await vi.advanceTimersByTimeAsync(10_000);
    expect(a.getSnapshot().matches('GaveUp')).toBe(true);
  });
  it('gives up after 5 errors in a row; an ok poll resets the count', async () => {
    vi.useFakeTimers();
    let n = 0;
    const a = start(spec({ intervalMs: 10 }), async () => {
      n++;
      if (n === 3) return { state: 'running' };
      throw new Error('boom');
    });
    await vi.advanceTimersByTimeAsync(30);
    expect(a.getSnapshot().context.consecutiveErrors).toBe(0);
    await vi.advanceTimersByTimeAsync(200);
    expect(a.getSnapshot().matches('GaveUp')).toBe(true);
    expect(n).toBe(8);
  });
  it('pauses while the tab is hidden and checks at once when visible', async () => {
    vi.useFakeTimers();
    const poll = vi.fn(async (): Promise<JobStatus<unknown>> => ({ state: 'running' }));
    const a = start(spec(), poll);
    a.send({ type: 'HIDDEN' });
    await vi.advanceTimersByTimeAsync(20_000);
    expect(poll).not.toHaveBeenCalled();
    a.send({ type: 'VISIBLE' });
    await vi.advanceTimersByTimeAsync(0);
    expect(poll).toHaveBeenCalledTimes(1);
  });
  it('cancels through the spec', async () => {
    const cancel = vi.fn(async () => {});
    const a = createActor(jobChildMachine, { input: { jobId: 'j1', label: 'Import', spec: { ...spec(), cancel } } }).start();
    a.send({ type: 'CANCEL' });
    await vi.waitFor(() => expect(a.getSnapshot().matches('Cancelled')).toBe(true));
    expect(cancel).toHaveBeenCalledWith('j1', expect.anything());
  });
});

import { describe, it, expect, vi } from 'vitest';
import { createActor } from 'xstate';
import { jobsMachine } from './machine';
import { effects } from './actors';
import { api } from '@/api';

describe('jobs machine', () => {
  it('spawns one child per TRACK for a command with a JobSpec, and ignores the rest', () => {
    const a = createActor(jobsMachine).start();
    a.send({ type: 'TRACK', jobId: 'j1', commandId: 'product.export', label: 'Product export' });
    a.send({ type: 'TRACK', jobId: 'j1', commandId: 'product.export', label: 'Product export' });
    a.send({ type: 'TRACK', jobId: 'j2', commandId: 'product.delete', label: 'not a job' });
    expect(a.getSnapshot().context.jobs.map((j) => j.jobId)).toEqual(['j1']);
  });
  it('notifies and drops a child when it ends', async () => {
    const notify = vi.spyOn(effects, 'notify').mockImplementation(() => {});
    vi.spyOn(api.bulkOps, 'cancelJob').mockResolvedValue({ jobId: 'j1', status: 'cancelled' });
    const a = createActor(jobsMachine).start();
    a.send({ type: 'TRACK', jobId: 'j1', commandId: 'product.export', label: 'Product export' });
    a.getSnapshot().context.jobs[0]!.ref.send({ type: 'CANCEL' });
    await vi.waitFor(() => expect(a.getSnapshot().context.jobs).toHaveLength(0), { timeout: 3000 });
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ jobId: 'j1', state: 'Cancelled' }));
  });
  it('stops following every job on STOP_ALL and resumes on START', () => {
    const a = createActor(jobsMachine).start();
    a.send({ type: 'TRACK', jobId: 'j1', commandId: 'product.export', label: 'Product export' });
    a.send({ type: 'STOP_ALL' });
    expect(a.getSnapshot().matches('Stopped')).toBe(true);
    expect(a.getSnapshot().context.jobs).toHaveLength(0);
    a.send({ type: 'START' });
    expect(a.getSnapshot().matches('Tracking')).toBe(true);
  });
});

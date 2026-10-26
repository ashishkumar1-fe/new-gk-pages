import { describe, it, expect } from 'vitest';
import { createActor, fromPromise } from 'xstate';
import { exportFlowMachine } from './machine';
import type { CommandContext } from '@/commands/define';
import type { ExportPreview } from '@/domain/job/schema';

const ctx = { storeId: 's', staff: { id: '1', name: 'A' }, can: () => true, route: '/products', surface: 'button' } as CommandContext;
const tick = () => new Promise((r) => setTimeout(r));
const make = (p: () => Promise<ExportPreview>, s: () => Promise<{ jobId: string }> = async () => ({ jobId: 'j1' })) =>
  createActor(exportFlowMachine.provide({ actors: { preview: fromPromise(p), start: fromPromise(s) } }), {
    input: { resource: 'product', label: 'Product export', ctx },
  }).start();

describe('export flow machine', () => {
  it('configures, previews, then starts', async () => {
    const a = make(async () => ({ jobId: 'j1', fileFormat: 'csv', estimatedTime: '1 min' }));
    a.send({ type: 'PREVIEW', choices: { format: 'csv' } });
    await tick();
    expect(a.getSnapshot().matches('Ready')).toBe(true);
    expect(a.getSnapshot().context.preview?.estimatedTime).toBe('1 min');
    a.send({ type: 'START' });
    await tick();
    expect(a.getSnapshot().matches('Started')).toBe(true);
  });
  it('rejects a backwards date range without calling the server', () => {
    const a = make(async () => {
      throw new Error('should not run');
    });
    a.send({ type: 'PREVIEW', choices: { format: 'csv', dateRange: { from: '2026-10-10', to: '2026-10-01' } } });
    expect(a.getSnapshot().matches('Configuring')).toBe(true);
    expect(a.getSnapshot().context.error).toBe('The start date must be before the end date.');
  });
  it('goes back to Configuring with the message when a step fails', async () => {
    const a = make(
      async () => ({ jobId: 'j1', fileFormat: 'csv' }),
      async () => {
        throw new Error('Job not found');
      },
    );
    a.send({ type: 'PREVIEW', choices: { format: 'csv' } });
    await tick();
    a.send({ type: 'START' });
    await tick();
    expect(a.getSnapshot().matches('Configuring')).toBe(true);
    expect(a.getSnapshot().context.error).toBe('Job not found');
  });
});

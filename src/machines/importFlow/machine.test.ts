import { describe, it, expect } from 'vitest';
import { createActor, fromPromise } from 'xstate';
import { importFlowMachine } from './machine';
import type { ImportPreview } from '@/domain/job/schema';
import type { CommandContext } from '@/commands/define';

const ctx = { storeId: 's', staff: { id: '1', name: 'A' }, can: () => true, route: '/products', surface: 'button' } as CommandContext;
const preview = (over: Partial<ImportPreview> = {}): ImportPreview => ({
  jobId: 'j1',
  isValid: true,
  totalRows: 3,
  fileName: 'p.csv',
  missingRequiredFields: [],
  extraFields: [],
  errors: [],
  warnings: [],
  ...over,
});
const file = new File(['title\nShirt'], 'p.csv', { type: 'text/csv' });
const make = (p: () => Promise<ImportPreview>, s: () => Promise<{ jobId: string }> = async () => ({ jobId: 'j1' })) =>
  createActor(importFlowMachine.provide({ actors: { preview: fromPromise(p), start: fromPromise(s) } }), {
    input: { resource: 'product', label: 'Product import', ctx },
  }).start();

describe('import flow machine', () => {
  it('previews a file and becomes Ready when valid, then Started', async () => {
    const a = make(async () => preview());
    a.send({ type: 'FILE', file });
    await new Promise((r) => setTimeout(r));
    expect(a.getSnapshot().matches('Ready')).toBe(true);
    a.send({ type: 'START' });
    await new Promise((r) => setTimeout(r));
    expect(a.getSnapshot().matches('Started')).toBe(true);
  });
  it('goes to Invalid on row errors and accepts a new file', async () => {
    const a = make(async () => preview({ isValid: false, errors: ['Row 2: price is required'] }));
    a.send({ type: 'FILE', file });
    await new Promise((r) => setTimeout(r));
    expect(a.getSnapshot().matches('Invalid')).toBe(true);
    a.send({ type: 'FILE', file });
    expect(a.getSnapshot().matches('Previewing')).toBe(true);
  });
  it('returns to Choosing with the message when the preview fails, and to Ready when start fails', async () => {
    const a = make(async () => {
      throw new Error('Bad file');
    });
    a.send({ type: 'FILE', file });
    await new Promise((r) => setTimeout(r));
    expect(a.getSnapshot().matches('Choosing')).toBe(true);
    expect(a.getSnapshot().context.error).toBe('Bad file');
    const b = make(
      async () => preview(),
      async () => {
        throw new Error('Job not found');
      },
    );
    b.send({ type: 'FILE', file });
    await new Promise((r) => setTimeout(r));
    b.send({ type: 'START' });
    await new Promise((r) => setTimeout(r));
    expect(b.getSnapshot().matches('Ready')).toBe(true);
    expect(b.getSnapshot().context.error).toBe('Job not found');
  });
});

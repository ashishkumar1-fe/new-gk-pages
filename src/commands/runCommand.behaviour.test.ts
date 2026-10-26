import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { runCommand, describeCommand, retryDelayMs, BULK_CONFIRM_ABOVE } from './runCommand';
import { configureCommandHost } from './host';
import { registerCommand } from './registry';
import { defineCommand, type CommandContext } from './define';
import { ApiError } from '@/platform/http/client';
import { queryClient } from '@/platform/query/queryClient';
import * as telemetry from '@/platform/telemetry';

const ctx: CommandContext = { storeId: 'demo-store', staff: { id: 's1', name: 'Ashish' }, can: () => true, route: '/x', surface: 'button' };
const base = {
  resource: 'test',
  description: 'test',
  scope: 'record' as const,
  permission: 'write_tests' as const,
  confirm: 'never' as const,
  invalidates: () => [],
  expose: { palette: false, assistant: false as const, extensions: false as const },
};
/** Registers a throwaway command for one test. */
const register = <I, R>(def: Parameters<typeof defineCommand<I, R>>[0]) => {
  registerCommand(def as never);
  return def.id;
};

beforeEach(() => {
  vi.restoreAllMocks();
  retryDelayMs.base = 1;
  configureCommandHost({ confirm: async () => true, toast: () => {}, navigate: () => {} });
});

describe('runCommand behaviour (commands/execution.md)', () => {
  it('retries an idempotent command on 5xx and succeeds', async () => {
    const run = vi.fn().mockRejectedValueOnce(new ApiError(502, 'bad gateway')).mockResolvedValueOnce({ ok: true });
    const id = register({
      ...base,
      id: 't.retry',
      label: 'Retry',
      input: z.object({}),
      effect: { readOnly: false, destructive: false, idempotent: true, external: false },
      steps: [{ id: 's', onFailure: 'abort', run }],
    });
    const r = await runCommand(id, {}, ctx);
    expect(r.status).toBe('success');
    expect(run).toHaveBeenCalledTimes(2);
  });
  it('never retries a non-idempotent command, and never retries a 4xx', async () => {
    const run = vi.fn().mockRejectedValue(new ApiError(502, 'bad gateway'));
    const id = register({
      ...base,
      id: 't.noretry',
      label: 'No retry',
      input: z.object({}),
      effect: { readOnly: false, destructive: false, idempotent: false, external: false },
      steps: [{ id: 's', onFailure: 'abort', run }],
    });
    expect((await runCommand(id, {}, ctx)).status).toBe('error');
    expect(run).toHaveBeenCalledTimes(1);
    const run4 = vi.fn().mockRejectedValue(new ApiError(400, 'bad'));
    const id4 = register({
      ...base,
      id: 't.4xx',
      label: '4xx',
      input: z.object({}),
      effect: { readOnly: false, destructive: false, idempotent: true, external: false },
      steps: [{ id: 's', onFailure: 'abort', run: run4 }],
    });
    await runCommand(id4, {}, ctx);
    expect(run4).toHaveBeenCalledTimes(1);
  });
  it('turns a step output with failed items into partial', async () => {
    const id = register({
      ...base,
      id: 't.partial',
      label: 'Archive',
      scope: 'selection',
      input: z.object({ ids: z.array(z.string()) }),
      effect: { readOnly: false, destructive: false, idempotent: true, external: false },
      steps: [{ id: 's', onFailure: 'abort', run: async () => ({ failed: [{ id: 'o2', reason: 'Already fulfilled' }] }) }],
    });
    const r = await runCommand(id, { ids: ['o1', 'o2'] }, ctx);
    expect(r).toMatchObject({ status: 'partial', failed: [{ id: 'o2', reason: 'Already fulfilled' }] });
  });
  it('applies an optimistic update and rolls it back exactly on failure', async () => {
    queryClient.setQueryData(['t', 'detail'], { note: 'old' });
    let during: unknown;
    const id = register({
      ...base,
      id: 't.optimistic',
      label: 'Note',
      mode: 'optimistic',
      input: z.object({ note: z.string() }),
      effect: { readOnly: false, destructive: false, idempotent: false, external: false },
      optimistic: (i) => [{ key: ['t', 'detail'], update: (o) => ({ ...(o as object), note: i.note }) }],
      steps: [
        {
          id: 's',
          onFailure: 'abort',
          run: async () => {
            during = queryClient.getQueryData(['t', 'detail']);
            throw new ApiError(500, 'nope');
          },
        },
      ],
    });
    await runCommand(id, { note: 'new' }, ctx);
    expect(during).toEqual({ note: 'new' });
    expect(queryClient.getQueryData(['t', 'detail'])).toEqual({ note: 'old' });
  });
  it('sets the detail cache from the response with `updates`', async () => {
    const id = register({
      ...base,
      id: 't.updates',
      label: 'Save',
      input: z.object({}),
      effect: { readOnly: false, destructive: false, idempotent: true, external: false },
      updates: (_i, r: { id: string }) => [{ key: ['t', r.id], update: () => r }],
      steps: [{ id: 's', onFailure: 'abort', run: async () => ({ id: 'x1' }) }],
    });
    await runCommand(id, {}, ctx);
    expect(queryClient.getQueryData(['t', 'x1'])).toEqual({ id: 'x1' });
  });
  it('denies a bulk command above maxItems before any call', async () => {
    const run = vi.fn();
    const id = register({
      ...base,
      id: 't.cap',
      label: 'Fulfill',
      scope: 'selection',
      input: z.object({ ids: z.array(z.string()) }),
      bulk: { maxItems: 2, toItems: (i) => i.ids },
      effect: { readOnly: false, destructive: false, idempotent: false, external: false },
      steps: [{ id: 's', onFailure: 'abort', run }],
    });
    const r = await runCommand(id, { ids: ['a', 'b', 'c'] }, ctx);
    expect(r).toEqual({ status: 'denied', reason: 'Select at most 2 items.' });
    expect(run).not.toHaveBeenCalled();
  });
  it(`confirms a bulk write above ${BULK_CONFIRM_ABOVE} items with the count, and not at or below it`, async () => {
    const confirm = vi.fn(async () => true);
    configureCommandHost({ confirm });
    const id = register({
      ...base,
      id: 't.bulk25',
      label: 'Tag',
      scope: 'selection',
      input: z.object({ ids: z.array(z.string()) }),
      effect: { readOnly: false, destructive: false, idempotent: true, external: false },
      steps: [{ id: 's', onFailure: 'abort', run: async () => ({}) }],
    });
    await runCommand(id, { ids: Array.from({ length: BULK_CONFIRM_ABOVE }, (_, i) => `x${i}`) }, ctx);
    expect(confirm).not.toHaveBeenCalled();
    await runCommand(id, { ids: Array.from({ length: BULK_CONFIRM_ABOVE + 1 }, (_, i) => `x${i}`) }, ctx);
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ title: `Tag for ${BULK_CONFIRM_ABOVE + 1} items?` }));
  });
  it('treats a command whose capability is off as unknown, and hides it from menus', async () => {
    const id = register({
      ...base,
      id: 't.cap-off',
      label: 'Off',
      capability: 'no-such-flag',
      input: z.object({}),
      effect: { readOnly: true, destructive: false, idempotent: true, external: false },
      steps: [],
    });
    expect((await runCommand(id, {}, ctx)).status).toBe('error');
    expect(describeCommand(id, ctx)).toBeUndefined();
  });
  it('hides commands the user lacks permission for from menus', () => {
    expect(describeCommand('product.delete', { ...ctx, record: { id: 'p', title: 't', status: 'active' } })).toBeDefined();
    expect(
      describeCommand('product.delete', { ...ctx, record: { id: 'p', title: 't', status: 'active' }, can: () => false }),
    ).toBeUndefined();
  });
  it('writes the passbook start and end breadcrumbs and an audit event with an actor object', async () => {
    const crumb = vi.spyOn(telemetry, 'addBreadcrumb');
    const track = vi.spyOn(telemetry, 'track');
    const id = register({
      ...base,
      id: 't.audit',
      label: 'Audit',
      input: z.object({ id: z.string() }),
      effect: { readOnly: true, destructive: false, idempotent: true, external: false },
      steps: [{ id: 's', onFailure: 'abort', run: async () => 1 }],
    });
    await runCommand(id, { id: 'r1' }, { ...ctx, surface: 'assistant', conversationId: 'c1' });
    expect(crumb.mock.calls.map((c) => c[0].message)).toEqual([`command.start ${id}`, `command.end ${id}`]);
    expect(track).toHaveBeenCalledWith(
      'command_run',
      expect.objectContaining({ command: id, targets: ['r1'], actor: { type: 'assistant' }, conversationId: 'c1', status: 'success' }),
    );
  });
});

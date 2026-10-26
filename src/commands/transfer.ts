import { z } from 'zod';
import { defineCommand } from './define';
import { keysFor } from '@/resources/define';

// Target spec: docs/architecture/commands/defs/*.md (inventory). Inputs, forms and multi-step orchestration are filled in as each resource is ported (build order).

/** POST /transfers */
export const create = defineCommand<Record<string, unknown>, unknown>({
  id: 'transfer.create',
  resource: 'transfer',
  label: 'Create',
  description: 'Create (transfer).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'page',
  permission: 'write_transfers',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'create',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.inventory.createTransfer as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('transfer').lists()],
  expose: { palette: true, assistant: { topic: 'inventory' }, extensions: false },
});
/** PATCH /transfers/:id */
export const update = defineCommand<Record<string, unknown>, unknown>({
  id: 'transfer.update',
  resource: 'transfer',
  label: 'Update',
  description: 'Update (transfer).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_transfers',
  effect: { readOnly: false, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'update',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.inventory.updateTransfer as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('transfer').lists()],
  expose: { palette: true, assistant: { topic: 'inventory' }, extensions: false },
});
/** status Pending */
export const markPending = defineCommand<Record<string, unknown>, unknown>({
  id: 'transfer.markPending',
  resource: 'transfer',
  label: 'Mark pending',
  description: 'Mark pending (transfer).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_transfers',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'markPending',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.inventory.updateTransfer as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('transfer').lists()],
  expose: { palette: true, assistant: { topic: 'inventory' }, extensions: false },
});
/** navigate /transfers/$id/receive */
export const openReceive = defineCommand<Record<string, unknown>, unknown>({
  id: 'transfer.openReceive',
  resource: 'transfer',
  label: 'Open receive',
  description: 'Open receive (transfer).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_transfers',
  effect: { readOnly: true, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [{ id: 'openReceive', onFailure: 'abort', run: async () => undefined }],
  invalidates: () => [keysFor('transfer').lists()],
  expose: { palette: true, assistant: { topic: 'inventory' }, extensions: false },
});
/** receive lines: cumulative totals */
export const receive = defineCommand<Record<string, unknown>, unknown>({
  id: 'transfer.receive',
  resource: 'transfer',
  label: 'Receive',
  description: 'Receive (transfer).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_transfers',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'always',
  mode: 'pessimistic',
  steps: [
    {
      id: 'receive',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.inventory.updateTransfer as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('transfer').lists()],
  expose: { palette: true, assistant: { topic: 'inventory' }, extensions: false },
});
/** DELETE /stock-transfers/:id */
export const del = defineCommand<Record<string, unknown>, unknown>({
  id: 'transfer.delete',
  resource: 'transfer',
  label: 'Delete',
  description: 'Delete (transfer).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_transfers',
  effect: { readOnly: false, destructive: true, idempotent: true, external: false },
  confirm: (_i, ctx) => ({
    title: `delete ${(ctx.record as { title?: string; name?: string } | undefined)?.title ?? (ctx.record as { name?: string } | undefined)?.name ?? ''}?`,
    confirmLabel: 'Delete',
    tone: 'critical',
  }),
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'delete',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.inventory.deleteTransfer as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('transfer').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});
/** navigate to create with selected rows */
export const createFromSelection = defineCommand<Record<string, unknown>, unknown>({
  id: 'transfer.createFromSelection',
  resource: 'transfer',
  label: 'Create from selection',
  description: 'Create from selection (transfer).',
  input: z.object({ ids: z.array(z.string()).min(1) }),
  fromContext: (ctx) => ({ ids: ctx.selection?.ids }),
  scope: 'selection',
  permission: 'write_transfers',
  effect: { readOnly: true, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [{ id: 'createFromSelection', onFailure: 'abort', run: async () => undefined }],
  invalidates: () => [keysFor('transfer').lists()],
  expose: { palette: true, assistant: { topic: 'inventory' }, extensions: false },
});

import { z } from 'zod';
import { defineCommand } from './define';
import { keysFor } from '@/resources/define';

// Target spec: docs/architecture/commands/defs/*.md (inventory). Inputs, forms and multi-step orchestration are filled in as each resource is ported (build order).

/** POST /purchase-orders */
export const create = defineCommand<Record<string, unknown>, unknown>({
  id: 'purchaseOrder.create',
  resource: 'purchaseOrder',
  label: 'Create',
  description: 'Create (purchaseOrder).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'page',
  permission: 'write_purchaseOrders',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'create',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.inventory.createPurchaseOrder as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('purchaseOrder').lists()],
  expose: { palette: true, assistant: { topic: 'inventory' }, extensions: false },
});
/** PATCH /purchase-orders/:id (full body) */
export const update = defineCommand<Record<string, unknown>, unknown>({
  id: 'purchaseOrder.update',
  resource: 'purchaseOrder',
  label: 'Update',
  description: 'Update (purchaseOrder).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_purchaseOrders',
  effect: { readOnly: false, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'update',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.inventory.updatePurchaseOrder as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('purchaseOrder').lists()],
  expose: { palette: true, assistant: { topic: 'inventory' }, extensions: false },
});
/** same PATCH, status Ordered */
export const markOrdered = defineCommand<Record<string, unknown>, unknown>({
  id: 'purchaseOrder.markOrdered',
  resource: 'purchaseOrder',
  label: 'Mark ordered',
  description: 'Mark ordered (purchaseOrder).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_purchaseOrders',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'always',
  mode: 'pessimistic',
  steps: [
    {
      id: 'markOrdered',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.inventory.updatePurchaseOrder as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('purchaseOrder').lists()],
  expose: { palette: true, assistant: { topic: 'inventory' }, extensions: false },
});
/** status Closed; known cost ×100 defect needs sign-off */
export const close = defineCommand<Record<string, unknown>, unknown>({
  id: 'purchaseOrder.close',
  resource: 'purchaseOrder',
  label: 'Close',
  description: 'Close (purchaseOrder).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_purchaseOrders',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'close',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.inventory.updatePurchaseOrder as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('purchaseOrder').lists()],
  expose: { palette: true, assistant: { topic: 'inventory' }, extensions: false },
});
/** status Draft */
export const reopen = defineCommand<Record<string, unknown>, unknown>({
  id: 'purchaseOrder.reopen',
  resource: 'purchaseOrder',
  label: 'Reopen',
  description: 'Reopen (purchaseOrder).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_purchaseOrders',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'reopen',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.inventory.updatePurchaseOrder as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('purchaseOrder').lists()],
  expose: { palette: true, assistant: { topic: 'inventory' }, extensions: false },
});
/** navigate /purchase-orders/$id/receive */
export const openReceive = defineCommand<Record<string, unknown>, unknown>({
  id: 'purchaseOrder.openReceive',
  resource: 'purchaseOrder',
  label: 'Open receive',
  description: 'Open receive (purchaseOrder).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_purchaseOrders',
  effect: { readOnly: true, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [{ id: 'openReceive', onFailure: 'abort', run: async () => undefined }],
  invalidates: () => [keysFor('purchaseOrder').lists()],
  expose: { palette: true, assistant: { topic: 'inventory' }, extensions: false },
});
/** receive lines: this session deltas */
export const receive = defineCommand<Record<string, unknown>, unknown>({
  id: 'purchaseOrder.receive',
  resource: 'purchaseOrder',
  label: 'Receive',
  description: 'Receive (purchaseOrder).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_purchaseOrders',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'always',
  mode: 'pessimistic',
  steps: [
    {
      id: 'receive',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.inventory.updatePurchaseOrder as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('purchaseOrder').lists()],
  expose: { palette: true, assistant: { topic: 'inventory' }, extensions: false },
});
/** DELETE /purchase-orders/:id */
export const del = defineCommand<Record<string, unknown>, unknown>({
  id: 'purchaseOrder.delete',
  resource: 'purchaseOrder',
  label: 'Delete',
  description: 'Delete (purchaseOrder).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_purchaseOrders',
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
        (d.api.inventory.deletePurchaseOrder as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('purchaseOrder').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});
/** navigate to create with selected inventory rows */
export const createFromSelection = defineCommand<Record<string, unknown>, unknown>({
  id: 'purchaseOrder.createFromSelection',
  resource: 'purchaseOrder',
  label: 'Create from selection',
  description: 'Create from selection (purchaseOrder).',
  input: z.object({ ids: z.array(z.string()).min(1) }),
  fromContext: (ctx) => ({ ids: ctx.selection?.ids }),
  scope: 'selection',
  permission: 'write_purchaseOrders',
  effect: { readOnly: true, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [{ id: 'createFromSelection', onFailure: 'abort', run: async () => undefined }],
  invalidates: () => [keysFor('purchaseOrder').lists()],
  expose: { palette: true, assistant: { topic: 'inventory' }, extensions: false },
});

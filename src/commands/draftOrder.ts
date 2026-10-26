import { z } from 'zod';
import { defineCommand } from './define';
import { keysFor } from '@/resources/define';

// Target spec: docs/architecture/commands/defs/*.md (os-order). Inputs, forms and multi-step orchestration are filled in as each resource is ported (build order).

/** calculate; POST /draft-orders */
export const create = defineCommand<Record<string, unknown>, unknown>({
  id: 'draftOrder.create',
  resource: 'draftOrder',
  label: 'Create',
  description: 'Create (draftOrder).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'page',
  permission: 'write_orders',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'create',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.createDraft as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('draftOrder').lists()],
  expose: { palette: true, assistant: { topic: 'orders' }, extensions: false },
});
/** calculate; PUT /draft-orders */
export const update = defineCommand<Record<string, unknown>, unknown>({
  id: 'draftOrder.update',
  resource: 'draftOrder',
  label: 'Update',
  description: 'Update (draftOrder).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_orders',
  effect: { readOnly: false, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'update',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.updateDraft as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('draftOrder').lists()],
  expose: { palette: true, assistant: { topic: 'orders' }, extensions: false },
});
/** POST /draft-orders/:id/complete {financial_intent, idempotency_key} */
export const complete = defineCommand<Record<string, unknown>, unknown>({
  id: 'draftOrder.complete',
  resource: 'draftOrder',
  label: 'Complete',
  description: 'Complete (draftOrder).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_orders',
  effect: { readOnly: false, destructive: false, idempotent: false, external: true },
  confirm: 'always',
  mode: 'pessimistic',
  steps: [
    {
      id: 'complete',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.completeDraft as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('draftOrder').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});
/** POST /draft-orders/:id/send-invoice */
export const sendInvoice = defineCommand<Record<string, unknown>, unknown>({
  id: 'draftOrder.sendInvoice',
  resource: 'draftOrder',
  label: 'Send invoice',
  description: 'Send invoice (draftOrder).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_orders',
  effect: { readOnly: false, destructive: false, idempotent: false, external: true },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'sendInvoice',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.sendInvoice as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('draftOrder').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});
/** POST /draft-orders/:id/duplicate */
export const duplicate = defineCommand<Record<string, unknown>, unknown>({
  id: 'draftOrder.duplicate',
  resource: 'draftOrder',
  label: 'Duplicate',
  description: 'Duplicate (draftOrder).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_orders',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'duplicate',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.duplicateDraft as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('draftOrder').lists()],
  expose: { palette: true, assistant: { topic: 'orders' }, extensions: false },
});
/** DELETE /draft-orders/:id */
export const del = defineCommand<Record<string, unknown>, unknown>({
  id: 'draftOrder.delete',
  resource: 'draftOrder',
  label: 'Delete',
  description: 'Delete (draftOrder).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_orders',
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
        (d.api.osOrder.deleteDraft as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('draftOrder').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});
/** POST /draft-orders/bulk/delete chunks of 50 */
export const bulkDelete = defineCommand<Record<string, unknown>, unknown>({
  id: 'draftOrder.bulkDelete',
  resource: 'draftOrder',
  label: 'Bulk delete',
  description: 'Bulk delete (draftOrder).',
  input: z.object({ ids: z.array(z.string()).min(1) }),
  fromContext: (ctx) => ({ ids: ctx.selection?.ids }),
  scope: 'selection',
  permission: 'write_orders',
  effect: { readOnly: false, destructive: true, idempotent: true, external: false },
  confirm: (_i, ctx) => ({
    title: `bulkDelete ${(ctx.record as { title?: string; name?: string } | undefined)?.title ?? (ctx.record as { name?: string } | undefined)?.name ?? ''}?`,
    confirmLabel: 'BulkDelete',
    tone: 'critical',
  }),
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'bulkDelete',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.bulkDeleteDrafts as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('draftOrder').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});
/** POST /draft-orders/bulk/tags/add|remove */
export const bulkTags = defineCommand<Record<string, unknown>, unknown>({
  id: 'draftOrder.bulkTags',
  resource: 'draftOrder',
  label: 'Bulk tags',
  description: 'Bulk tags (draftOrder).',
  input: z.object({ ids: z.array(z.string()).min(1) }),
  fromContext: (ctx) => ({ ids: ctx.selection?.ids }),
  scope: 'selection',
  permission: 'write_orders',
  effect: { readOnly: false, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'bulkTags',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.bulkDraftTags as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('draftOrder').lists()],
  expose: { palette: true, assistant: { topic: 'orders' }, extensions: false },
});
/** CSV built in the browser */
export const exportCsv = defineCommand<Record<string, unknown>, unknown>({
  id: 'draftOrder.export',
  resource: 'draftOrder',
  label: 'Export',
  description: 'Export (draftOrder).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'page',
  permission: 'write_orders',
  effect: { readOnly: true, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [{ id: 'export', onFailure: 'abort', run: async () => undefined }],
  invalidates: () => [keysFor('draftOrder').lists()],
  expose: { palette: true, assistant: { topic: 'orders' }, extensions: false },
});
/** navigate to new draft with customerId */
export const createForCustomer = defineCommand<Record<string, unknown>, unknown>({
  id: 'draftOrder.createForCustomer',
  resource: 'draftOrder',
  label: 'Create for customer',
  description: 'Create for customer (draftOrder).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_orders',
  effect: { readOnly: true, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [{ id: 'createForCustomer', onFailure: 'abort', run: async () => undefined }],
  invalidates: () => [keysFor('draftOrder').lists()],
  expose: { palette: true, assistant: { topic: 'orders' }, extensions: false },
});

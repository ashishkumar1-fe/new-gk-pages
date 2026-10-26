import { z } from 'zod';
import { defineCommand } from './define';
import { keysFor } from '@/resources/define';

// Target spec: docs/architecture/commands/defs/*.md (os-order). Inputs, forms and multi-step orchestration are filled in as each resource is ported (build order).

/** PATCH /orders/:id/note; optimistic */
export const updateNote = defineCommand<Record<string, unknown>, unknown>({
  id: 'order.updateNote',
  resource: 'order',
  label: 'Update note',
  description: 'Update note (order).',
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
      id: 'updateNote',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.updateNote as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('order').lists()],
  expose: { palette: true, assistant: { topic: 'orders' }, extensions: false },
});
/** POST /orders/:id/comments */
export const comment = defineCommand<Record<string, unknown>, unknown>({
  id: 'order.comment',
  resource: 'order',
  label: 'Comment',
  description: 'Comment (order).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_orders',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'comment',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.addComment as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('order').lists()],
  expose: { palette: true, assistant: { topic: 'orders' }, extensions: false },
});
/** create missing tags, then POST /orders/:id/tags */
export const addTags = defineCommand<Record<string, unknown>, unknown>({
  id: 'order.addTags',
  resource: 'order',
  label: 'Add tags',
  description: 'Add tags (order).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_orders',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'addTags',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.addOrderTags as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('order').lists()],
  expose: { palette: true, assistant: { topic: 'orders' }, extensions: false },
});
/** DELETE /orders/:id/tags/:tagId */
export const removeTag = defineCommand<Record<string, unknown>, unknown>({
  id: 'order.removeTag',
  resource: 'order',
  label: 'Remove tag',
  description: 'Remove tag (order).',
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
      id: 'removeTag',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.removeOrderTag as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('order').lists()],
  expose: { palette: true, assistant: { topic: 'orders' }, extensions: false },
});
/** POST /orders/bulk/tags/add|remove; partial results */
export const bulkTags = defineCommand<Record<string, unknown>, unknown>({
  id: 'order.bulkTags',
  resource: 'order',
  label: 'Bulk tags',
  description: 'Bulk tags (order).',
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
        (d.api.osOrder.bulkOrderTags as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('order').lists()],
  expose: { palette: true, assistant: { topic: 'orders' }, extensions: false },
});
/** PUT kwikpass customer then PATCH /orders/:id */
export const updateContact = defineCommand<Record<string, unknown>, unknown>({
  id: 'order.updateContact',
  resource: 'order',
  label: 'Update contact',
  description: 'Update contact (order).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_orders',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'updateContact',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.updateOrder as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('order').lists()],
  expose: { palette: true, assistant: { topic: 'orders' }, extensions: false },
});
/** commit the edit session; metadata PATCH */
export const update = defineCommand<Record<string, unknown>, unknown>({
  id: 'order.update',
  resource: 'order',
  label: 'Update',
  description: 'Update (order).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_orders',
  effect: { readOnly: false, destructive: false, idempotent: false, external: true },
  confirm: 'always',
  mode: 'pessimistic',
  steps: [
    {
      id: 'update',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.commitEdit as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('order').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});
/** PATCH /orders/:id/cancel */
export const cancel = defineCommand<Record<string, unknown>, unknown>({
  id: 'order.cancel',
  resource: 'order',
  label: 'Cancel',
  description: 'Cancel (order).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_orders',
  effect: { readOnly: false, destructive: true, idempotent: false, external: true },
  confirm: (_i, ctx) => ({
    title: `cancel ${(ctx.record as { title?: string; name?: string } | undefined)?.title ?? (ctx.record as { name?: string } | undefined)?.name ?? ''}?`,
    confirmLabel: 'Cancel',
    tone: 'critical',
  }),
  mode: 'pessimistic',
  steps: [
    {
      id: 'cancel',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.cancelOrder as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('order').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});
/** POST /orders/bulk-cancel; partial */
export const bulkCancel = defineCommand<Record<string, unknown>, unknown>({
  id: 'order.bulkCancel',
  resource: 'order',
  label: 'Bulk cancel',
  description: 'Bulk cancel (order).',
  input: z.object({ ids: z.array(z.string()).min(1) }),
  fromContext: (ctx) => ({ ids: ctx.selection?.ids }),
  scope: 'selection',
  permission: 'write_orders',
  effect: { readOnly: false, destructive: true, idempotent: false, external: true },
  confirm: (_i, ctx) => ({
    title: `bulkCancel ${(ctx.record as { title?: string; name?: string } | undefined)?.title ?? (ctx.record as { name?: string } | undefined)?.name ?? ''}?`,
    confirmLabel: 'BulkCancel',
    tone: 'critical',
  }),
  mode: 'pessimistic',
  steps: [
    {
      id: 'bulkCancel',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.bulkCancel as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('order').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});
/** POST /orders/bulk-archive {orderIds, idempotencyKey} */
export const archive = defineCommand<Record<string, unknown>, unknown>({
  id: 'order.archive',
  resource: 'order',
  label: 'Archive',
  description: 'Archive (order).',
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
      id: 'archive',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.bulkArchive as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('order').lists()],
  expose: { palette: true, assistant: { topic: 'orders' }, extensions: false },
});
/** POST /orders/bulk-unarchive */
export const unarchive = defineCommand<Record<string, unknown>, unknown>({
  id: 'order.unarchive',
  resource: 'order',
  label: 'Unarchive',
  description: 'Unarchive (order).',
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
      id: 'unarchive',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.bulkUnarchive as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('order').lists()],
  expose: { palette: true, assistant: { topic: 'orders' }, extensions: false },
});
/** POST /draft-orders with copied fields */
export const duplicate = defineCommand<Record<string, unknown>, unknown>({
  id: 'order.duplicate',
  resource: 'order',
  label: 'Duplicate',
  description: 'Duplicate (order).',
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
        (d.api.osOrder.createDraft as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('order').lists()],
  expose: { palette: true, assistant: { topic: 'orders' }, extensions: false },
});
/** open statusUrl */
export const openStatusPage = defineCommand<Record<string, unknown>, unknown>({
  id: 'order.openStatusPage',
  resource: 'order',
  label: 'Open status page',
  description: 'Open status page (order).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_orders',
  effect: { readOnly: true, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [{ id: 'openStatusPage', onFailure: 'abort', run: async () => undefined }],
  invalidates: () => [keysFor('order').lists()],
  expose: { palette: true, assistant: { topic: 'orders' }, extensions: false },
});
/** POST /orders/:id/fulfillments (form) */
export const fulfill = defineCommand<Record<string, unknown>, unknown>({
  id: 'order.fulfill',
  resource: 'order',
  label: 'Fulfill',
  description: 'Fulfill (order).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_orders',
  effect: { readOnly: false, destructive: false, idempotent: false, external: true },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'fulfill',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.createFulfillment as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('order').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});
/** POST …/update_tracking */
export const updateTracking = defineCommand<Record<string, unknown>, unknown>({
  id: 'order.updateTracking',
  resource: 'order',
  label: 'Update tracking',
  description: 'Update tracking (order).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_orders',
  effect: { readOnly: false, destructive: false, idempotent: false, external: true },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'updateTracking',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.updateTracking as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('order').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});
/** POST /orders/:id/hold (form) */
export const hold = defineCommand<Record<string, unknown>, unknown>({
  id: 'order.hold',
  resource: 'order',
  label: 'Hold',
  description: 'Hold (order).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_orders',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'hold',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.holdOrder as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('order').lists()],
  expose: { palette: true, assistant: { topic: 'orders' }, extensions: false },
});
/** POST /orders/:id/release_hold */
export const releaseHold = defineCommand<Record<string, unknown>, unknown>({
  id: 'order.releaseHold',
  resource: 'order',
  label: 'Release hold',
  description: 'Release hold (order).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_orders',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'releaseHold',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.releaseHold as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('order').lists()],
  expose: { palette: true, assistant: { topic: 'orders' }, extensions: false },
});
/** POST /orders/bulk-fulfill ≤100 */
export const bulkFulfill = defineCommand<Record<string, unknown>, unknown>({
  id: 'order.bulkFulfill',
  resource: 'order',
  label: 'Bulk fulfill',
  description: 'Bulk fulfill (order).',
  input: z.object({ ids: z.array(z.string()).min(1) }),
  fromContext: (ctx) => ({ ids: ctx.selection?.ids }),
  scope: 'selection',
  permission: 'write_orders',
  effect: { readOnly: false, destructive: false, idempotent: false, external: true },
  confirm: 'always',
  mode: 'pessimistic',
  steps: [
    {
      id: 'bulkFulfill',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.bulkFulfill as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('order').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});
/** bulk-ops */
export const importPreview = defineCommand<Record<string, unknown>, unknown>({
  id: 'order.importPreview',
  resource: 'order',
  label: 'Import preview',
  description: 'Import preview (order).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'page',
  permission: 'write_orders',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'importPreview',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.bulkOps.previewImport as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('order').lists()],
  expose: { palette: true, assistant: { topic: 'orders' }, extensions: false },
});
/** bulk-ops job */
export const imp = defineCommand<Record<string, unknown>, unknown>({
  id: 'order.import',
  resource: 'order',
  label: 'Import',
  description: 'Import (order).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'page',
  permission: 'write_orders',
  effect: { readOnly: false, destructive: false, idempotent: false, external: true },
  confirm: 'always',
  mode: 'pessimistic',
  steps: [
    {
      id: 'import',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.bulkOps.processImport as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('order').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});
/** bulk-ops */
export const exportPreview = defineCommand<Record<string, unknown>, unknown>({
  id: 'order.exportPreview',
  resource: 'order',
  label: 'Export preview',
  description: 'Export preview (order).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'page',
  permission: 'write_orders',
  effect: { readOnly: true, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'exportPreview',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.bulkOps.previewExport as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('order').lists()],
  expose: { palette: true, assistant: { topic: 'orders' }, extensions: false },
});
/** bulk-ops job; file emailed */
export const exportCsv = defineCommand<Record<string, unknown>, unknown>({
  id: 'order.export',
  resource: 'order',
  label: 'Export',
  description: 'Export (order).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'page',
  permission: 'write_orders',
  effect: { readOnly: true, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'export',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.bulkOps.processExport as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('order').lists()],
  expose: { palette: true, assistant: { topic: 'orders' }, extensions: false },
});

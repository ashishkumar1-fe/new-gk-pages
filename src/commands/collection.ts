import { z } from 'zod';
import { defineCommand } from './define';
import { keysFor } from '@/resources/define';

// Target spec: docs/architecture/commands/defs/*.md (item). Inputs, forms and multi-step orchestration are filled in as each resource is ported (build order).

/** POST /collections */
export const create = defineCommand<Record<string, unknown>, unknown>({
  id: 'collection.create',
  resource: 'collection',
  label: 'Create',
  description: 'Create (collection).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'page',
  permission: 'write_collections',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'create',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.item.createCollection as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('collection').lists()],
  expose: { palette: true, assistant: { topic: 'catalog' }, extensions: false },
});
/** PUT /collections/:id with addProducts, removedProducts */
export const update = defineCommand<Record<string, unknown>, unknown>({
  id: 'collection.update',
  resource: 'collection',
  label: 'Update',
  description: 'Update (collection).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_collections',
  effect: { readOnly: false, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'update',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.item.updateCollection as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('collection').lists()],
  expose: { palette: true, assistant: { topic: 'catalog' }, extensions: false },
});
/** DELETE /collections/:id */
export const del = defineCommand<Record<string, unknown>, unknown>({
  id: 'collection.delete',
  resource: 'collection',
  label: 'Delete',
  description: 'Delete (collection).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_collections',
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
        (d.api.item.deleteCollection as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('collection').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});
/** POST /collections/bulk-delete */
export const bulkDelete = defineCommand<Record<string, unknown>, unknown>({
  id: 'collection.bulkDelete',
  resource: 'collection',
  label: 'Bulk delete',
  description: 'Bulk delete (collection).',
  input: z.object({ ids: z.array(z.string()).min(1) }),
  fromContext: (ctx) => ({ ids: ctx.selection?.ids }),
  scope: 'selection',
  permission: 'write_collections',
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
        (d.api.item.bulkDeleteCollections as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('collection').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});
/** PATCH /collections/bulk */
export const setPublished = defineCommand<Record<string, unknown>, unknown>({
  id: 'collection.setPublished',
  resource: 'collection',
  label: 'Set published',
  description: 'Set published (collection).',
  input: z.object({ ids: z.array(z.string()).min(1) }),
  fromContext: (ctx) => ({ ids: ctx.selection?.ids }),
  scope: 'selection',
  permission: 'write_collections',
  effect: { readOnly: false, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'setPublished',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.item.bulkUpdateCollections as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('collection').lists()],
  expose: { palette: true, assistant: { topic: 'catalog' }, extensions: false },
});
/** PATCH /collections/bulk */
export const bulkEdit = defineCommand<Record<string, unknown>, unknown>({
  id: 'collection.bulkEdit',
  resource: 'collection',
  label: 'Bulk edit',
  description: 'Bulk edit (collection).',
  input: z.object({ ids: z.array(z.string()).min(1) }),
  fromContext: (ctx) => ({ ids: ctx.selection?.ids }),
  scope: 'selection',
  permission: 'write_collections',
  effect: { readOnly: false, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'bulkEdit',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.item.bulkUpdateCollections as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('collection').lists()],
  expose: { palette: true, assistant: { topic: 'catalog' }, extensions: false },
});
/** build storefront URL, copy */
export const copyLink = defineCommand<Record<string, unknown>, unknown>({
  id: 'collection.copyLink',
  resource: 'collection',
  label: 'Copy link',
  description: 'Copy link (collection).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_collections',
  effect: { readOnly: true, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [{ id: 'copyLink', onFailure: 'abort', run: async () => undefined }],
  invalidates: () => [keysFor('collection').lists()],
  expose: { palette: true, assistant: { topic: 'catalog' }, extensions: false },
});

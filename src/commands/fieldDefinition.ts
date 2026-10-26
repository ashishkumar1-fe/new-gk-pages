import { z } from 'zod';
import { defineCommand } from './define';
import { keysFor } from '@/resources/define';

// Target spec: docs/architecture/commands/defs/*.md (inventory). Inputs, forms and multi-step orchestration are filled in as each resource is ported (build order).

/** POST /v1/admin/metafield-definitions */
export const create = defineCommand<Record<string, unknown>, unknown>({
  id: 'fieldDefinition.create',
  resource: 'fieldDefinition',
  label: 'Create',
  description: 'Create (fieldDefinition).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'global',
  permission: 'write_products',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'create',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.inventory.createFieldDefinition as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('fieldDefinition').lists()],
  expose: { palette: true, assistant: { topic: 'catalog' }, extensions: false },
});
/** PUT …/:id */
export const update = defineCommand<Record<string, unknown>, unknown>({
  id: 'fieldDefinition.update',
  resource: 'fieldDefinition',
  label: 'Update',
  description: 'Update (fieldDefinition).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_products',
  effect: { readOnly: false, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'update',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.inventory.updateFieldDefinition as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('fieldDefinition').lists()],
  expose: { palette: true, assistant: false, extensions: false }, // the assistant sees fieldDefinition.create only (defs/catalog.md)
});
/** DELETE …/:id; removes all values */
export const del = defineCommand<Record<string, unknown>, unknown>({
  id: 'fieldDefinition.delete',
  resource: 'fieldDefinition',
  label: 'Delete',
  description: 'Delete (fieldDefinition).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_products',
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
        (d.api.inventory.deleteFieldDefinition as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('fieldDefinition').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});

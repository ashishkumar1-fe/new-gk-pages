import { z } from 'zod';
import { defineCommand } from './define';
import { keysFor } from '@/resources/define';

// Target spec: docs/architecture/commands/defs/*.md (os-customer). Inputs, forms and multi-step orchestration are filled in as each resource is ported (build order).

/** POST /customer-segments?merchantId= */
export const create = defineCommand<Record<string, unknown>, unknown>({
  id: 'segment.create',
  resource: 'segment',
  label: 'Create',
  description: 'Create (segment).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'page',
  permission: 'write_segments',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'create',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osCustomer.createSegment as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('segment').lists()],
  expose: { palette: true, assistant: { topic: 'customers' }, extensions: false },
});
/** PUT /customer-segments/:id */
export const update = defineCommand<Record<string, unknown>, unknown>({
  id: 'segment.update',
  resource: 'segment',
  label: 'Update',
  description: 'Update (segment).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_segments',
  effect: { readOnly: false, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'update',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osCustomer.updateSegment as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('segment').lists()],
  expose: { palette: true, assistant: { topic: 'customers' }, extensions: false },
});
/** DELETE /customer-segments/:id */
export const del = defineCommand<Record<string, unknown>, unknown>({
  id: 'segment.delete',
  resource: 'segment',
  label: 'Delete',
  description: 'Delete (segment).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_segments',
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
        (d.api.osCustomer.deleteSegment as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('segment').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});

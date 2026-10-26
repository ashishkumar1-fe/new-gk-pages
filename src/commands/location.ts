import { z } from 'zod';
import { defineCommand } from './define';
import { keysFor } from '@/resources/define';

// Target spec: docs/architecture/commands/defs/*.md (inventory). Inputs, forms and multi-step orchestration are filled in as each resource is ported (build order).

/** POST /v3/admin/locations */
export const create = defineCommand<Record<string, unknown>, unknown>({
  id: 'location.create',
  resource: 'location',
  label: 'Create',
  description: 'Create (location).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'page',
  permission: 'write_locations',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'create',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.inventory.createLocation as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('location').lists()],
  expose: { palette: true, assistant: { topic: 'inventory' }, extensions: false },
});
/** PATCH /v3/admin/locations/:id */
export const update = defineCommand<Record<string, unknown>, unknown>({
  id: 'location.update',
  resource: 'location',
  label: 'Update',
  description: 'Update (location).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_locations',
  effect: { readOnly: false, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'update',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.inventory.updateLocation as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('location').lists()],
  expose: { palette: true, assistant: { topic: 'inventory' }, extensions: false },
});
/** POST …/activate */
export const activate = defineCommand<Record<string, unknown>, unknown>({
  id: 'location.activate',
  resource: 'location',
  label: 'Activate',
  description: 'Activate (location).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_locations',
  effect: { readOnly: false, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'activate',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.inventory.activateLocation as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('location').lists()],
  expose: { palette: true, assistant: { topic: 'inventory' }, extensions: false },
});
/** LOCATION_HAS_STOCK_MOVE_FIRST → drain_to form */
export const deactivate = defineCommand<Record<string, unknown>, unknown>({
  id: 'location.deactivate',
  resource: 'location',
  label: 'Deactivate',
  description: 'Deactivate (location).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_locations',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'deactivate',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.inventory.deactivateLocation as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('location').lists()],
  expose: { palette: true, assistant: { topic: 'inventory' }, extensions: false },
});
/** POST …/delete {confirm:true}; inactive only */
export const del = defineCommand<Record<string, unknown>, unknown>({
  id: 'location.delete',
  resource: 'location',
  label: 'Delete',
  description: 'Delete (location).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_locations',
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
        (d.api.inventory.deleteLocation as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('location').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});

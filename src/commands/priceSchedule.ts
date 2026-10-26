import { z } from 'zod';
import { defineCommand } from './define';
import { keysFor } from '@/resources/define';

// Target spec: docs/architecture/commands/defs/*.md (item). Inputs, forms and multi-step orchestration are filled in as each resource is ported (build order).

/** POST /bulk-edit/{storeId}/price-update; shows interferingTasks on conflict */
export const create = defineCommand<Record<string, unknown>, unknown>({
  id: 'priceSchedule.create',
  resource: 'priceSchedule',
  label: 'Flash sale',
  description: 'Schedule a price change (flash sale).',
  capability: 'price-schedules',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'page',
  permission: 'write_products',
  effect: { readOnly: false, destructive: false, idempotent: false, external: true },
  confirm: 'always',
  mode: 'pessimistic',
  steps: [
    {
      id: 'create',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.item.createPriceSchedule as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('priceSchedule').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});
/** DELETE …/schedules/:id */
export const cancel = defineCommand<Record<string, unknown>, unknown>({
  id: 'priceSchedule.cancel',
  resource: 'priceSchedule',
  label: 'Cancel',
  description: 'Cancel (priceSchedule).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_products',
  effect: { readOnly: false, destructive: true, idempotent: true, external: false },
  confirm: (_i, ctx) => ({
    title: `cancel ${(ctx.record as { title?: string; name?: string } | undefined)?.title ?? (ctx.record as { name?: string } | undefined)?.name ?? ''}?`,
    confirmLabel: 'Cancel',
    tone: 'critical',
  }),
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'cancel',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.item.cancelPriceSchedule as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('priceSchedule').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});

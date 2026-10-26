import { z } from 'zod';
import { defineCommand } from './define';
import { keysFor } from '@/resources/define';

// Target spec: docs/architecture/commands/defs/*.md (discount). Inputs, forms and multi-step orchestration are filled in as each resource is ported (build order).

/** POST /create; wizard finish is the confirm */
export const create = defineCommand<Record<string, unknown>, unknown>({
  id: 'discount.create',
  resource: 'discount',
  label: 'Create',
  description: 'Create (discount).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'page',
  permission: 'write_discounts',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'create',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.discount.createDiscount as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('discount').lists()],
  expose: { palette: true, assistant: { topic: 'discounts' }, extensions: false },
});
/** PUT /update/:id */
export const update = defineCommand<Record<string, unknown>, unknown>({
  id: 'discount.update',
  resource: 'discount',
  label: 'Update',
  description: 'Update (discount).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_discounts',
  effect: { readOnly: false, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'update',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.discount.updateDiscount as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('discount').lists()],
  expose: { palette: true, assistant: { topic: 'discounts' }, extensions: false },
});
/** PUT /bulk/update status published */
export const publish = defineCommand<Record<string, unknown>, unknown>({
  id: 'discount.publish',
  resource: 'discount',
  label: 'Publish',
  description: 'Publish (discount).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_discounts',
  effect: { readOnly: false, destructive: false, idempotent: true, external: true },
  confirm: 'always',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'publish',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.discount.bulkUpdateDiscounts as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('discount').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});
/** PUT /bulk/update status draft */
export const moveToDraft = defineCommand<Record<string, unknown>, unknown>({
  id: 'discount.moveToDraft',
  resource: 'discount',
  label: 'Move to draft',
  description: 'Move to draft (discount).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_discounts',
  effect: { readOnly: false, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'moveToDraft',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.discount.bulkUpdateDiscounts as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('discount').lists()],
  expose: { palette: true, assistant: { topic: 'discounts' }, extensions: false },
});
/** PUT /bulk/update status inactive */
export const markInactive = defineCommand<Record<string, unknown>, unknown>({
  id: 'discount.markInactive',
  resource: 'discount',
  label: 'Mark inactive',
  description: 'Mark inactive (discount).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_discounts',
  effect: { readOnly: false, destructive: false, idempotent: true, external: true },
  confirm: 'always',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'markInactive',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.discount.bulkUpdateDiscounts as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('discount').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});
/** os-discount AI session; opens the legacy form filled */
export const createWithAssistant = defineCommand<Record<string, unknown>, unknown>({
  id: 'discount.createWithAssistant',
  resource: 'discount',
  label: 'Create with assistant',
  description: 'Create with assistant (discount).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'page',
  permission: 'write_discounts',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'createWithAssistant',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.discount.createAiSession as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('discount').lists()],
  expose: { palette: true, assistant: { topic: 'discounts' }, extensions: false },
});
/** POST /sessions/:id/confirm {action_token}; 410 → ask again */
export const aiConfirm = defineCommand<Record<string, unknown>, unknown>({
  id: 'discount.aiConfirm',
  resource: 'discount',
  label: 'Ai confirm',
  description: 'Ai confirm (discount).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'page',
  permission: 'write_discounts',
  effect: { readOnly: false, destructive: false, idempotent: false, external: true },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'aiConfirm',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.discount.confirmAiAction as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('discount').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});

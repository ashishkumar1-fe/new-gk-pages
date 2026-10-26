import { z } from 'zod';
import { defineCommand } from './define';
import { keysFor } from '@/resources/define';

// Target spec: docs/architecture/commands/defs/*.md (discount). Inputs, forms and multi-step orchestration are filled in as each resource is ported (build order).

/** POST /create-discount-set */
export const create = defineCommand<Record<string, unknown>, unknown>({
  id: 'discountSet.create',
  resource: 'discountSet',
  label: 'Create',
  description: 'Create (discountSet).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'page',
  permission: 'write_discounts',
  effect: { readOnly: false, destructive: false, idempotent: false, external: true },
  confirm: 'always',
  mode: 'pessimistic',
  steps: [
    {
      id: 'create',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.discount.createDiscountSet as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('discountSet').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});
/** PUT /update/:id */
export const update = defineCommand<Record<string, unknown>, unknown>({
  id: 'discountSet.update',
  resource: 'discountSet',
  label: 'Update',
  description: 'Update (discountSet).',
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
        (d.api.discount.updateDiscountSet as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('discountSet').lists()],
  expose: { palette: true, assistant: { topic: 'discounts' }, extensions: false },
});
/** presigned-url → zip → CSV */
export const downloadCodes = defineCommand<Record<string, unknown>, unknown>({
  id: 'discountSet.downloadCodes',
  resource: 'discountSet',
  label: 'Download codes',
  description: 'Download codes (discountSet).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_discounts',
  effect: { readOnly: true, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'downloadCodes',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.discount.presignCodesFile as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('discountSet').lists()],
  expose: { palette: true, assistant: { topic: 'discounts' }, extensions: false },
});

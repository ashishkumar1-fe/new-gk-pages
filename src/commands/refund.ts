import { z } from 'zod';
import { defineCommand } from './define';
import { keysFor } from '@/resources/define';

// Target spec: docs/architecture/commands/defs/*.md (os-order). Inputs, forms and multi-step orchestration are filled in as each resource is ported (build order).

/** POST /refunds x-idempotency-key; preview = calculate; poll GET /refunds/:id 5s×24 */
export const create = defineCommand<Record<string, unknown>, unknown>({
  id: 'refund.create',
  resource: 'refund',
  label: 'Create',
  description: 'Create (refund).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_refunds',
  effect: { readOnly: false, destructive: false, idempotent: true, external: true },
  confirm: 'never',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'create',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.createRefund as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('refund').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});

import { z } from 'zod';
import { defineCommand } from './define';
import { keysFor } from '@/resources/define';

// Target spec: docs/architecture/commands/defs/*.md (bulk-ops). Inputs, forms and multi-step orchestration are filled in as each resource is ported (build order).

/** POST /job/:jobId/cancel */
export const cancel = defineCommand<Record<string, unknown>, unknown>({
  id: 'bulkOps.cancel',
  resource: 'bulkOps',
  label: 'Cancel',
  description: 'Cancel (bulkOps).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_orders',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'always',
  mode: 'pessimistic',
  steps: [
    {
      id: 'cancel',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.bulkOps.cancelJob as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('bulkOps').lists()],
  expose: { palette: true, assistant: { topic: 'orders' }, extensions: false },
});

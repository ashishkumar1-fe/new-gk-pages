import { z } from 'zod';
import { defineCommand } from './define';
import { keysFor } from '@/resources/define';

// Target spec: docs/architecture/commands/defs/*.md (os-order). Inputs, forms and multi-step orchestration are filled in as each resource is ported (build order).

/** POST /orders/:id/edit/begin (internal: machine only) */
export const begin = defineCommand<Record<string, unknown>, unknown>({
  id: 'orderEdit.begin',
  resource: 'orderEdit',
  label: 'Begin',
  description: 'Begin (orderEdit).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_orders',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'begin',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.beginEdit as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('orderEdit').lists()],
  expose: { palette: false, assistant: false, extensions: false }, // internal: run only by the order edit machine
});
/** POST …/stage one op per call */
export const stage = defineCommand<Record<string, unknown>, unknown>({
  id: 'orderEdit.stage',
  resource: 'orderEdit',
  label: 'Stage',
  description: 'Stage (orderEdit).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_orders',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'stage',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.stageEdit as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('orderEdit').lists()],
  expose: { palette: false, assistant: false, extensions: false }, // internal: run only by the order edit machine
});
/** POST …/discard; keepalive on unload */
export const discard = defineCommand<Record<string, unknown>, unknown>({
  id: 'orderEdit.discard',
  resource: 'orderEdit',
  label: 'Discard',
  description: 'Discard (orderEdit).',
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
      id: 'discard',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osOrder.discardEdit as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('orderEdit').lists()],
  expose: { palette: false, assistant: false, extensions: false }, // internal: run only by the order edit machine
});

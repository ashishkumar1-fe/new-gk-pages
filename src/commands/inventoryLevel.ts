import { z } from 'zod';
import { defineCommand } from './define';
import { keysFor } from '@/resources/define';

// Target spec: docs/architecture/commands/defs/*.md (inventory). Inputs, forms and multi-step orchestration are filled in as each resource is ported (build order).

/** POST /v3/admin/inventory/levels/connect */
export const connect = defineCommand<Record<string, unknown>, unknown>({
  id: 'inventoryLevel.connect',
  resource: 'inventoryLevel',
  label: 'Connect',
  description: 'Connect (inventoryLevel).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_inventory',
  effect: { readOnly: false, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'connect',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.inventory.connectLevel as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('inventoryLevel').lists()],
  expose: { palette: true, assistant: { topic: 'inventory' }, extensions: false },
});
/** ≥1 location must stay connected */
export const disconnect = defineCommand<Record<string, unknown>, unknown>({
  id: 'inventoryLevel.disconnect',
  resource: 'inventoryLevel',
  label: 'Disconnect',
  description: 'Disconnect (inventoryLevel).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_inventory',
  effect: { readOnly: false, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'disconnect',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.inventory.disconnectLevel as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('inventoryLevel').lists()],
  expose: { palette: true, assistant: { topic: 'inventory' }, extensions: false },
});

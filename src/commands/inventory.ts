import { z } from 'zod';
import { defineCommand } from './define';
import { keysFor } from '@/resources/define';

// Target spec: docs/architecture/commands/defs/*.md (inventory). Inputs, forms and multi-step orchestration are filled in as each resource is ported (build order).

/** set on hand · set quantities · adjust quantities (idempotency-key) */
export const adjust = defineCommand<Record<string, unknown>, unknown>({
  id: 'inventory.adjust',
  resource: 'inventory',
  label: 'Adjust',
  description: 'Adjust (inventory).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_inventorys',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'adjust',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.inventory.adjustQuantities as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('inventory').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});
/** absolute targets with compare_quantity */
export const bulkEdit = defineCommand<Record<string, unknown>, unknown>({
  id: 'inventory.bulkEdit',
  resource: 'inventory',
  label: 'Bulk edit',
  description: 'Bulk edit (inventory).',
  input: z.object({ ids: z.array(z.string()).min(1) }),
  fromContext: (ctx) => ({ ids: ctx.selection?.ids }),
  scope: 'selection',
  permission: 'write_inventorys',
  effect: { readOnly: false, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'bulkEdit',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.inventory.setQuantities as (...a: unknown[]) => Promise<unknown>)(i, { signal: d.signal, idempotencyKey: d.idempotencyKey }),
    },
  ],
  invalidates: () => [keysFor('inventory').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});
/** POST /inventory/import multipart */
export const imp = defineCommand<Record<string, unknown>, unknown>({
  id: 'inventory.import',
  resource: 'inventory',
  label: 'Import',
  description: 'Import (inventory).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'page',
  permission: 'write_inventorys',
  effect: { readOnly: false, destructive: false, idempotent: false, external: true },
  confirm: 'always',
  mode: 'pessimistic',
  steps: [
    {
      id: 'import',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.inventory.importInventory as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('inventory').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});
/** GET /inventory/export-csv */
export const exportCsv = defineCommand<Record<string, unknown>, unknown>({
  id: 'inventory.export',
  resource: 'inventory',
  label: 'Export',
  description: 'Export (inventory).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'page',
  permission: 'write_inventorys',
  effect: { readOnly: true, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'export',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.inventory.exportInventory as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('inventory').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});

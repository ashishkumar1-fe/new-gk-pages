import { z } from 'zod';
import { defineCommand } from './define';
import { keysFor } from '@/resources/define';

// Target spec: docs/architecture/commands/defs/*.md (os-customer). Inputs, forms and multi-step orchestration are filled in as each resource is ported (build order).

/** POST /customers; then POST /addresses default first (continue-with-warning) */
export const create = defineCommand<Record<string, unknown>, unknown>({
  id: 'customer.create',
  resource: 'customer',
  label: 'Create',
  description: 'Create (customer).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'page',
  permission: 'write_customers',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'create',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osCustomer.createCustomer as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('customer').lists()],
  expose: { palette: true, assistant: { topic: 'customers' }, extensions: false },
});
/** PUT /customers/:id; then PUT/POST addresses */
export const update = defineCommand<Record<string, unknown>, unknown>({
  id: 'customer.update',
  resource: 'customer',
  label: 'Update',
  description: 'Update (customer).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_customers',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'update',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osCustomer.updateCustomer as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('customer').lists()],
  expose: { palette: true, assistant: { topic: 'customers' }, extensions: false },
});
/** DELETE /addresses/:id */
export const deleteAddress = defineCommand<Record<string, unknown>, unknown>({
  id: 'customer.deleteAddress',
  resource: 'customer',
  label: 'Delete address',
  description: 'Delete address (customer).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_customers',
  effect: { readOnly: false, destructive: true, idempotent: true, external: false },
  confirm: (_i, ctx) => ({
    title: `deleteAddress ${(ctx.record as { title?: string; name?: string } | undefined)?.title ?? (ctx.record as { name?: string } | undefined)?.name ?? ''}?`,
    confirmLabel: 'DeleteAddress',
    tone: 'critical',
  }),
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'deleteAddress',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osCustomer.deleteAddress as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('customer').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});
/** PATCH /customers/:id/status */
export const setBlocked = defineCommand<Record<string, unknown>, unknown>({
  id: 'customer.setBlocked',
  resource: 'customer',
  label: 'Set blocked',
  description: 'Set blocked (customer).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_customers',
  effect: { readOnly: false, destructive: false, idempotent: true, external: false },
  confirm: 'always',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'setBlocked',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osCustomer.setCustomerBlocked as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('customer').lists()],
  expose: { palette: true, assistant: { topic: 'customers' }, extensions: false },
});
/** DELETE /customers/:id */
export const del = defineCommand<Record<string, unknown>, unknown>({
  id: 'customer.delete',
  resource: 'customer',
  label: 'Delete',
  description: 'Delete (customer).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_customers',
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
        (d.api.osCustomer.deleteCustomer as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('customer').lists()],
  expose: { palette: true, assistant: false, extensions: false },
});
/** POST kwikpass …/comment */
export const comment = defineCommand<Record<string, unknown>, unknown>({
  id: 'customer.comment',
  resource: 'customer',
  label: 'Comment',
  description: 'Comment (customer).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'record',
  permission: 'write_customers',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'comment',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osCustomer.addCustomerComment as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('customer').lists()],
  expose: { palette: true, assistant: { topic: 'customers' }, extensions: false },
});
/** page: CSV in browser; all: job polled 3s×20 */
export const exportCsv = defineCommand<Record<string, unknown>, unknown>({
  id: 'customer.export',
  resource: 'customer',
  label: 'Export',
  description: 'Export (customer).',
  input: z.object({ id: z.string() }).passthrough(),
  fromContext: (ctx) => ({ id: (ctx.record as { id?: string } | undefined)?.id }),
  scope: 'page',
  permission: 'write_customers',
  effect: { readOnly: true, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'export',
      onFailure: 'abort',
      run: (i, _p, d) =>
        (d.api.osCustomer.startCustomerExport as (...a: unknown[]) => Promise<unknown>)(i, {
          signal: d.signal,
          idempotencyKey: d.idempotencyKey,
        }),
    },
  ],
  invalidates: () => [keysFor('customer').lists()],
  expose: { palette: true, assistant: { topic: 'customers' }, extensions: false },
});

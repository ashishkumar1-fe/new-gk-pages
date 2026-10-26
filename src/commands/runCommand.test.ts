import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runCommand } from './runCommand';
import { configureCommandHost } from './host';
import { api } from '@/api';
import type { CommandContext } from './define';

const ctx: CommandContext = {
  storeId: 'demo-store',
  staff: { id: 's1', name: 'Ashish' },
  can: () => true,
  route: '/products',
  surface: 'button',
  record: { id: 'p_1', title: 'Shirt', status: 'active' },
};

describe('runCommand', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('asks for confirmation on a destructive command and stops when dismissed', async () => {
    const confirm = vi.fn(async () => false);
    configureCommandHost({ confirm });
    const del = vi.spyOn(api.item, 'deleteProduct');
    const r = await runCommand('product.delete', undefined, ctx);
    expect(r.status).toBe('cancelled');
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ tone: 'critical', confirmLabel: 'Delete' }));
    expect(del).not.toHaveBeenCalled();
  });

  it('runs the step, toasts and navigates on success', async () => {
    const toast = vi.fn();
    const navigate = vi.fn();
    configureCommandHost({ confirm: async () => true, toast, navigate });
    vi.spyOn(api.item, 'deleteProduct').mockResolvedValue(undefined);
    const r = await runCommand('product.delete', undefined, ctx);
    expect(r.status).toBe('success');
    expect(toast).toHaveBeenCalledWith('Product deleted', 'default');
    expect(navigate).toHaveBeenCalledWith('/products');
  });

  it('returns invalid when the input fails the schema', async () => {
    configureCommandHost({ openForm: async (_t, _f, i) => ({ ...i, status: 'bogus' }) });
    const r = await runCommand('product.setStatus', undefined, { ...ctx, selection: { resource: 'product', ids: ['p_1'], rows: [] } });
    expect(r.status).toBe('invalid');
  });

  it('denies when the permission check fails', async () => {
    const r = await runCommand('product.delete', undefined, { ...ctx, can: () => false });
    expect(r.status).toBe('denied');
  });
});

import { describe, it, expect } from 'vitest';
import { readTools, writeTools } from './tools';

describe('assistant tools (TRD 7.10, 7.13)', () => {
  it('maps effect flags to the four MCP annotations', () => {
    const t = writeTools().find((x) => x.name === 'product.setStatus')!;
    expect(t.annotations).toEqual({ readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false });
    expect(t.inputSchema).toMatchObject({ type: 'object' });
  });
  it('keeps delete, import, money-moving and internal commands away from the assistant', () => {
    const names = writeTools().map((t) => t.name);
    for (const id of [
      'product.delete',
      'product.bulkDelete',
      'product.import',
      'order.cancel',
      'refund.create',
      'orderEdit.begin',
      'fieldDefinition.update',
    ])
      expect(names).not.toContain(id);
    expect(names).toContain('fieldDefinition.create');
  });
  it('drops commands whose capability is off', () => {
    expect(writeTools().map((t) => t.name)).not.toContain('priceSchedule.create');
  });
  it('filters by topic, and builds list/get/search read tools', () => {
    expect(writeTools('catalog').every((t) => t.topic === 'catalog')).toBe(true);
    expect(readTools().map((t) => t.name)).toEqual(expect.arrayContaining(['product.list', 'product.get', 'product.search']));
  });
});

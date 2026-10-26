import { describe, it, expect } from 'vitest';
import list from './fixtures/product.list.json';
import { RawProductList } from './product.wire';
import { toProduct, toListItem, toWire, toInput } from './product.transformer';
import type { RawProduct } from './product.wire';

describe('item wire schema and transformer', () => {
  it('parses the recorded list response', () => {
    expect(RawProductList.safeParse(list).success).toBe(true);
  });
  it('turns wire paise strings into Money and snake_case into domain names', () => {
    const p = toProduct(list.products[0] as RawProduct);
    expect(p.variants[0]?.price).toEqual({ minor: 44900, currency: 'INR' });
    expect(p.tags).toEqual(['summer', 'cotton']);
    expect(p.tax).toEqual({ taxable: true, hsnCode: '6105' });
    expect(p.variants[0]?.inventoryTracked).toBe(true);
  });
  it('builds a list row with a stock summary', () => {
    const row = toListItem(list.products[0] as RawProduct);
    expect(row.variantsCount).toBe(3);
    expect(row.inventoryQuantity).toBe(50);
  });
  it('round-trips an editor draft to a wire body in integer paise', () => {
    const p = toProduct(list.products[1] as RawProduct);
    const w = toWire(toInput(p));
    expect(w.price).toBe(799900);
    expect(w.handle).toBe('running-shoes-air');
    expect(w.tags).toBe('running');
  });
});

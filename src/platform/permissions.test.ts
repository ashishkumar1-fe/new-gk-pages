import { describe, it, expect } from 'vitest';
import { makeCan, hasPages } from './permissions';

describe('permissions (TRD 3.5)', () => {
  it('passes unmapped and mapped scopes while enforcement is off', () => {
    const can = makeCan([]);
    expect(can('write_products')).toBe(true);
    expect(can('write_refunds')).toBe(true);
  });
  it('keeps the two report checks gk-pages enforces today', () => {
    expect(makeCan([])('read_reports')).toBe(false);
    expect(makeCan(['view_reports'])('read_reports')).toBe(true);
    expect(makeCan(['view_reports'])('read_unmasked_reports')).toBe(false);
    expect(makeCan(['view_unmasked_report'])('read_unmasked_reports')).toBe(true);
  });
  it('entitlement is selected_products.pages only', () => {
    expect(hasPages({ pages: true })).toBe(true);
    expect(hasPages({ checkout: true })).toBe(false);
    expect(hasPages(undefined)).toBe(false);
  });
});

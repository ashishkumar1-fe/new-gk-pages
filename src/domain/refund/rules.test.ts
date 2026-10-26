import { describe, it, expect } from 'vitest';
import { isSettled, summarizeRefunds } from './rules';
import { money } from '@/domain/shared/money';

const r = (status: 'pending' | 'processing' | 'success' | 'failed', total: number) => ({
  status,
  amounts: { subtotal: money(0), tax: money(0), discount: money(0), shipping: money(0), total: money(total) },
});

describe('refund rules', () => {
  it('isSettled: success or failed', () => {
    expect(isSettled({ status: 'success' })).toBe(true);
    expect(isSettled({ status: 'failed' })).toBe(true);
    expect(isSettled({ status: 'processing' })).toBe(false);
  });
});

describe('summarizeRefunds (modules/refunds/utils.ts:24)', () => {
  it('success → refunded; pending / processing → in progress; failed → neither', () => {
    expect(summarizeRefunds([r('success', 1000), r('success', 500), r('pending', 200), r('processing', 300), r('failed', 9999)])).toEqual({
      refunded: money(1500),
      inProgress: money(500),
    });
  });
  it('none → zeros', () => {
    expect(summarizeRefunds([])).toEqual({ refunded: money(0), inProgress: money(0) });
  });
});

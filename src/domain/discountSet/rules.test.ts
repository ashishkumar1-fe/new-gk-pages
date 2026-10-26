import { describe, it, expect } from 'vitest';
import * as rules from './rules';

describe('discountSet rules', () => {
  it('a valid set passes', () => {
    expect(rules.discountSetValidation({ totalCodes: 100, prefix: 'SALE-', codeLength: 6 })).toBe(true);
    expect(rules.discountSetErrors({ totalCodes: 100, codeLength: 10 })).toEqual({});
  });
  it('codes 1–1,000,000', () => {
    expect(rules.discountSetErrors({ totalCodes: 0 }).totalCodes).toBe('Quantity must be between 1 and 10,00,000');
    expect(rules.discountSetErrors({ totalCodes: 1_000_001 }).totalCodes).toBe('Quantity must be between 1 and 10,00,000');
    expect(rules.discountSetValidation({ totalCodes: 1_000_000, codeLength: 10 })).toBe(true);
  });
  it('prefix and suffix ≤ 20, uppercase letters, digits and hyphens', () => {
    expect(rules.discountSetErrors({ prefix: 'sale' }).prefix).toBe('Code can only contain uppercase letters, numbers, and hyphens');
    expect(rules.discountSetErrors({ suffix: 'A'.repeat(21) }).suffix).toBe('Code cannot exceed 20 characters');
    expect(rules.discountSetErrors({ prefix: '' }).prefix).toBeUndefined();
  });
  it('length 1–100 and prefix + length + suffix ≥ 10', () => {
    expect(rules.discountSetErrors({ codeLength: 101 }).codeLength).toBe('Length must be between 1 and 100');
    expect(rules.discountSetErrors({ codeLength: 4, prefix: 'AB', suffix: 'C' }).codeLength).toBe(
      'Total code length (prefix + length + suffix) must be at least 10. Currently 7.',
    );
    expect(rules.discountSetValidation({ totalCodes: 5, codeLength: 9 })).toBe(false);
  });
});

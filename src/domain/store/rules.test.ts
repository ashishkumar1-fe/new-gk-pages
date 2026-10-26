import { describe, it, expect } from 'vitest';
import * as rules from './rules';

describe('store rules', () => {
  it('exports hasPages as a pure function', () => {
    expect(typeof rules.hasPages).toBe('function');
  });
});

import { buildStorefrontUrl } from './rules';
describe('buildStorefrontUrl (gk-pages utils/storefrontUrl.ts)', () => {
  it('joins domain, route and encoded handle, trimming slashes', () => {
    expect(buildStorefrontUrl('https://shop.example/', '/products/', 'blue shirt')).toBe('https://shop.example/products/blue%20shirt');
  });
  it('is undefined when anything is missing', () => {
    expect(buildStorefrontUrl('', 'products', 'x')).toBeUndefined();
    expect(buildStorefrontUrl('https://a.b', '', 'x')).toBeUndefined();
    expect(buildStorefrontUrl('https://a.b', 'products', undefined)).toBeUndefined();
  });
});

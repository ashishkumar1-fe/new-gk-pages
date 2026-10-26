import { describe, it, expect } from 'vitest';
import { generateVariantTitles, margin, profit, deriveHandle, isDefaultVariant } from './rules';
import { money } from '@/domain/shared/money';

describe('product rules (pinned to gk-pages behaviour)', () => {
  it('generates every combination by position', () => {
    expect(
      generateVariantTitles([
        { id: '2', name: 'Color', position: 2, values: ['Blue', 'Red'] },
        { id: '1', name: 'Size', position: 1, values: ['S', 'M'] },
      ]),
    ).toEqual(['S / Blue', 'S / Red', 'M / Blue', 'M / Red']);
  });
  it('falls back to Default Title with no options', () => {
    expect(generateVariantTitles([])).toEqual(['Default Title']);
  });
  it('computes profit and margin in paise, 2 dp', () => {
    expect(profit(money(44900), money(30000))).toEqual(money(14900));
    expect(margin(money(44900), money(30000))).toBe(33.18);
    expect(margin(money(0), money(30000))).toBe(0);
  });
  it('derives a handle from the title unless an SEO handle is given', () => {
    expect(deriveHandle('Blue Cotton Shirt')).toBe('blue-cotton-shirt');
    expect(deriveHandle('Blue Cotton Shirt', ' shirt-blue ')).toBe('shirt-blue');
  });
  it('detects the default variant', () => {
    expect(isDefaultVariant({ variants: [{ title: 'Default Title' } as never] })).toBe(true);
  });
});

import {
  matchExistingVariants,
  newVariantDefaults,
  normalizeWeightUnit,
  optionPresets,
  productDefaults,
  productValidation,
  tagsJoin,
  tagsSplit,
  generateVariants,
} from './rules';

describe('catalog rules ported from gk-pages', () => {
  const v = (id: string, title: string, opts: string[], price = 0) => ({
    id,
    title,
    selectedOptions: opts.map((value) => ({ value })),
    price: money(price),
  });

  it('generateVariants is the same rule as generateVariantTitles', () => {
    expect(generateVariants([{ id: '1', name: 'Size', position: 1, values: ['S'] }])).toEqual(['S']);
  });
  it('keeps the existing variant on an exact title match and assigns each id once', () => {
    const existing = [v('v1', 'S / Blue', ['S', 'Blue']), v('v2', 'M / Blue', ['M', 'Blue'])];
    const m = matchExistingVariants(['S / Blue', 'M / Blue', 'L / Blue'], existing);
    expect(m.map((x) => x?.id)).toEqual(['v1', 'v2', undefined]);
  });
  it('keeps ids when an option is added (old title is a prefix of the new one)', () => {
    const existing = [v('v1', 'S', ['S']), v('v2', 'M', ['M'])];
    const m = matchExistingVariants(['S / Cotton', 'S / Silk', 'M / Cotton'], existing);
    expect(m.map((x) => x?.id)).toEqual(['v1', undefined, 'v2']);
  });
  it('keeps ids when an option is removed', () => {
    const existing = [v('v1', 'S / Blue', ['S', 'Blue']), v('v2', 'M / Blue', ['M', 'Blue'])];
    expect(matchExistingVariants(['S', 'M'], existing).map((x) => x?.id)).toEqual(['v1', 'v2']);
  });
  it('new variants start at zero on create and reuse the first non-zero price on edit', () => {
    expect(newVariantDefaults()).toMatchObject({
      price: money(0),
      weight: { value: 0, unit: 'kg' },
      taxable: true,
      inventoryTracked: true,
      inventoryPolicy: 'deny',
    });
    expect(newVariantDefaults([{ price: money(0) }, { price: money(44900), costPerItem: money(30000) }]).price).toEqual(money(44900));
    expect(newVariantDefaults([{ price: money(44900), costPerItem: money(30000) }]).costPerItem).toEqual(money(30000));
  });
  it('normalises weight unit aliases and falls back to kg', () => {
    expect(normalizeWeightUnit('KILOGRAMS')).toBe('kg');
    expect(normalizeWeightUnit(' grams ')).toBe('g');
    expect(normalizeWeightUnit('Pounds')).toBe('lb');
    expect(normalizeWeightUnit('ozs')).toBe('oz');
    expect(normalizeWeightUnit('stone')).toBe('kg');
    expect(normalizeWeightUnit(undefined, 'g')).toBe('g');
  });
  it('has today’s defaults and option presets', () => {
    expect(productDefaults).toEqual({ status: 'active', taxable: false, countryOfOrigin: 'US', weightUnit: 'kg' });
    expect(optionPresets.map((o) => o.name)).toEqual(['Size', 'Color', 'Material', 'Style', 'Weight']);
  });
  it('joins and splits tags on ", "', () => {
    expect(tagsJoin(['summer', 'cotton'])).toBe('summer, cotton');
    expect(tagsSplit('summer, cotton,')).toEqual(['summer', 'cotton']);
    expect(tagsSplit(null)).toEqual([]);
  });
  it('validates title, option values, variant price, image source and tag length', () => {
    expect(productValidation({ title: 'Shirt' })).toEqual({});
    const e = productValidation({
      title: ' ',
      tags: ['x'.repeat(51)],
      options: [{ name: 'Size', values: [] }],
      variants: [{ price: '' }],
      images: [{}],
    });
    expect(e).toEqual({
      title: 'Title is required',
      'tags.0': 'Tags are limited to 50 characters',
      'options.0.values': 'Select atleast 1 value for each variant option',
      'variants.0.price': 'Price is required',
      'images.0.url': 'Image URL is required',
    });
  });
});

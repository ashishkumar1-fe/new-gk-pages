import { describe, it, expect } from 'vitest';
import { fieldsSchema, isListSupported, isReferenceType, mergeValues, validateFieldValue } from './rules';

describe('customFields rules (pinned to gk-pages behaviour)', () => {
  it('classifies types', () => {
    expect(isReferenceType('product_reference')).toBe(true);
    expect(isListSupported('money')).toBe(false);
    expect(isListSupported('single_line_text_field')).toBe(true);
  });
  it('validates text length, pattern and choices', () => {
    const def = { type: 'single_line_text_field', validation: { minLength: 2, maxLength: 4, pattern: '^[a-z]+$', enum: ['ab', 'abc'] } };
    expect(validateFieldValue(def, 'a')).toBe('Minimum length is 2 characters');
    expect(validateFieldValue(def, 'abcde')).toBe('Maximum length is 4 characters');
    expect(validateFieldValue(def, 'AB')).toBe('Value does not match the required pattern');
    expect(validateFieldValue(def, 'abcd')).toBe('Value must be one of the allowed values');
    expect(validateFieldValue(def, 'abc')).toBe('');
    expect(validateFieldValue(def, '')).toBe('');
    expect(validateFieldValue({ ...def, validation: { required: true } }, '')).toBe('This field is required');
  });
  it('compares unit values in a base unit', () => {
    const def = { type: 'weight', validation: { minimum: { value: 1, unit: 'KILOGRAMS' }, maximum: { value: 2, unit: 'KILOGRAMS' } } };
    expect(validateFieldValue(def, { value: 500, unit: 'GRAMS' })).toBe('Minimum value is 1 KILOGRAMS');
    expect(validateFieldValue(def, { value: 1500, unit: 'GRAMS' })).toBe('');
    expect(validateFieldValue(def, [{ value: 3, unit: 'KILOGRAMS' }])).toBe('Maximum value is 2 KILOGRAMS');
  });
  it('checks date ranges and URL domains', () => {
    expect(validateFieldValue({ type: 'date', validation: { formatMinimum: '2026-01-01' } }, '2025-12-31')).toBe(
      'Date cannot be before 2026-01-01',
    );
    expect(validateFieldValue({ type: 'date', validation: {} }, 'nope')).toBe('Invalid date format');
    expect(validateFieldValue({ type: 'url', validation: { allowed_domains: ['gokwik.co'] } }, 'https://evil.com/x')).toBe(
      'Domain is not allowed',
    );
    expect(validateFieldValue({ type: 'url', validation: {} }, 'not a url')).toBe('Please enter a valid URL');
  });
  it('builds a runtime schema keyed by namespace.key; required comes from the definition', () => {
    const s = fieldsSchema([{ namespace: 'custom', key: 'fabric', type: 'single_line_text_field', required: true, validation: {} }]);
    const r = s.safeParse({});
    expect(r.success).toBe(false);
    expect(!r.success && r.error.issues[0]?.path).toEqual(['custom.fabric']);
    expect(s.safeParse({ 'custom.fabric': 'cotton' }).success).toBe(true);
  });
  it('merges values by id, then namespace:key, then key, keeping orphans last', () => {
    const defs = [
      { id: 'd1', namespace: 'custom', key: 'a' },
      { id: 'd2', namespace: 'custom', key: 'b' },
      { namespace: 'x', key: 'c' },
    ];
    const vals = [
      { definitionId: 'd1', namespace: 'other', key: 'zzz', type: 't', value: 1 },
      { namespace: 'custom', key: 'b', type: 't', value: 2 },
      { namespace: 'y', key: 'c', type: 't', value: 3 },
      { namespace: 'n', key: 'orphan', type: 't', value: 4 },
    ];
    expect(mergeValues(defs, vals).map((m) => [m.definition?.key, m.value?.value])).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 3],
      [undefined, 4],
    ]);
  });
});

import { describe, it, expect } from 'vitest';
import { collectionValidation, ruleOperators } from './rules';

describe('collection rules (pinned to gk-pages behaviour)', () => {
  it('requires at least one condition on a smart collection, with today’s message per mode', () => {
    expect(collectionValidation({ kind: 'smart', rules: { match: 'all', rules: [] } }, 'create')).toBe(
      'Please add the condition to the smart collection.',
    );
    expect(collectionValidation({ kind: 'smart', rules: undefined }, 'edit')).toBe('A smart collection must have at least one condition.');
    expect(
      collectionValidation({ kind: 'smart', rules: { match: 'any', rules: [{ field: 'tag', operator: 'equals', value: 'x' }] } }, 'edit'),
    ).toBeUndefined();
  });
  it('requires at least one product on manual create only', () => {
    expect(collectionValidation({ kind: 'manual', rules: undefined }, 'create')).toBe('Please add at least one product to the collection.');
    expect(collectionValidation({ kind: 'manual', rules: undefined }, 'create', ['p_1'])).toBeUndefined();
    expect(collectionValidation({ kind: 'manual', rules: undefined }, 'edit')).toBeUndefined();
  });
  it('offers today’s operators per field', () => {
    expect(ruleOperators.tag.operators).toEqual(['equals']);
    expect(ruleOperators.category.operators).toEqual(['equals', 'not_equals']);
    expect(ruleOperators.compare_at_price.operators).toContain('is_empty');
    expect(ruleOperators.price.operators).not.toContain('is_empty');
    expect(ruleOperators.weight.input).toBe('number');
  });
});

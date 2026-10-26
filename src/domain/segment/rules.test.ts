import { describe, it, expect } from 'vitest';
import {
  SEGMENT_OPERATORS,
  segmentFields,
  segmentFieldType,
  segmentOperatorsFor,
  segmentDefaultOperator,
  segmentChangeField,
  segmentChangeOperator,
  segmentValueSplit,
  segmentLogic,
  segmentValidation,
} from './rules';

const ops = (t: keyof typeof SEGMENT_OPERATORS) => SEGMENT_OPERATORS[t].map((o) => o.value);

describe('operators by field type (SegmentForm.tsx:48)', () => {
  it('matches docs/architecture/domain/customers.md', () => {
    expect(ops('numeric')).toEqual([
      'equals',
      'not_equals',
      'greater_than',
      'less_than',
      'greater_than_or_equals',
      'less_than_or_equals',
      'is_set',
      'is_not_set',
    ]);
    expect(ops('text')).toEqual(['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'is_set', 'is_not_set']);
    expect(ops('boolean')).toEqual(['is', 'is_not']);
    expect(ops('date')).toEqual(['before', 'after', 'between']);
    expect(ops('array')).toEqual(['contains', 'contains_any', 'contains_all', 'is_empty', 'is_not_empty']);
  });
  it('label for not_contains is "Does not contain"', () => {
    expect(SEGMENT_OPERATORS.text[3]?.label).toBe('Does not contain');
  });
});

describe('segmentFields (SegmentForm.tsx:319)', () => {
  it('fields, order and types', () => {
    expect(segmentFields.map((f) => [f.value, f.type])).toEqual([
      ['totalSpent', 'numeric'],
      ['tags', 'array'],
      ['firstName', 'text'],
      ['lastName', 'text'],
      ['isDeleted', 'boolean'],
      ['isActive', 'boolean'],
      ['createdAt', 'date'],
      ['updatedAt', 'date'],
    ]);
    for (const f of segmentFields) expect(segmentFieldType(f.value)).toBe(f.type);
  });
  it('unknown field is text', () => {
    expect(segmentFieldType('email')).toBe('text');
    expect(segmentOperatorsFor('email')).toBe(SEGMENT_OPERATORS.text);
  });
});

describe('segmentDefaultOperator (SegmentForm.tsx:303)', () => {
  it.each([
    ['totalSpent', 'greater_than'],
    ['tags', 'contains'],
    ['isDeleted', 'is'],
    ['isActive', 'is'],
    ['createdAt', 'after'],
    ['updatedAt', 'after'],
    ['firstName', 'equals'],
    ['isVip', 'equals'],
    ['lastOrderAt', 'equals'],
  ])('%s → %s', (f, op) => {
    expect(segmentDefaultOperator(f)).toBe(op);
  });
  it('picking a boolean field resets value to false; others keep value', () => {
    expect(segmentChangeField({ field: 'tags', operator: 'contains', value: 'vip' }, 'isActive')).toEqual({
      field: 'isActive',
      operator: 'is',
      value: false,
    });
    expect(segmentChangeField({ field: 'tags', operator: 'contains', value: 'vip' }, 'firstName')).toEqual({
      field: 'firstName',
      operator: 'equals',
      value: 'vip',
    });
  });
  it('picking an operator (SegmentForm.tsx:339)', () => {
    const c = { field: 'tags', operator: 'contains', value: 'vip' };
    expect(segmentChangeOperator(c, 'is_empty').value).toBe(true);
    expect(segmentChangeOperator(c, 'is_not_set').value).toBe(true);
    expect(segmentChangeOperator(c, 'is_not').value).toBe(false);
    expect(segmentChangeOperator(c, 'contains_all')).toEqual({ ...c, operator: 'contains_all' });
  });
});

describe('segmentValueSplit (SegmentForm.tsx:146)', () => {
  it('comma string → trimmed list, empty parts kept', () => {
    expect(segmentValueSplit(' vip, gold ,')).toEqual(['vip', 'gold', '']);
  });
  it('arrays, plain strings, numbers, booleans unchanged', () => {
    const arr = ['a'];
    expect(segmentValueSplit(arr)).toBe(arr);
    expect(segmentValueSplit('vip')).toBe('vip');
    expect(segmentValueSplit(100)).toBe(100);
    expect(segmentValueSplit(false)).toBe(false);
  });
});

describe('segmentLogic (SegmentForm.tsx:94)', () => {
  it('new segment defaults to AND', () => {
    expect(segmentLogic()).toBe('AND');
    expect(segmentLogic({})).toBe('AND');
  });
  // v1 FIX: gk-pages SegmentForm.tsx:94 initialises conditionLogic to 'AND' and never reads the saved value,
  // so editing an OR segment saved it back as AND. Ratio preserves the saved logic.
  it('edit preserves saved OR (fixes SegmentForm.tsx:94 reset-to-AND bug)', () => {
    expect(segmentLogic({ logic: 'OR' })).toBe('OR');
  });
  it('edit preserves saved AND; unknown/null → AND', () => {
    expect(segmentLogic({ logic: 'AND' })).toBe('AND');
    expect(segmentLogic({ logic: null })).toBe('AND');
    expect(segmentLogic({ logic: 'xor' })).toBe('AND');
  });
});

describe('segmentValidation (SegmentForm.tsx:105)', () => {
  it('valid', () => {
    expect(segmentValidation({ name: 'VIP', description: 'Big spenders' })).toEqual({});
  });
  it('blank or whitespace: verbatim messages', () => {
    expect(segmentValidation({ name: '  ', description: '' })).toEqual({
      name: 'Name is required',
      description: 'Description is required',
    });
    expect(segmentValidation({})).toEqual({ name: 'Name is required', description: 'Description is required' });
  });
});

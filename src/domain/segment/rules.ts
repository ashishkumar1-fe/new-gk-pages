import type { Segment } from './schema';

// Pure rules, ported as today. Each cites the gk-pages source it came from (docs/architecture/domain/customers.md#segment).
// Source file for every rule below: gk-pages src/components/customers/SegmentForm.tsx.
// Unused-type guard for entities whose rules take narrower inputs:
export type { Segment as _Segment };

export type SegmentFieldType = 'numeric' | 'text' | 'boolean' | 'date' | 'array';
export type SegmentLogic = Segment['logic'];

// ── Operators by field type ───────────────────────────────
/** Operator values and labels per field type, in today's order. (SegmentForm.tsx:48-85) */
export const SEGMENT_OPERATORS: Record<SegmentFieldType, { value: string; label: string }[]> = {
  numeric: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not equals' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
    { value: 'greater_than_or_equals', label: 'Greater than or equals' },
    { value: 'less_than_or_equals', label: 'Less than or equals' },
    { value: 'is_set', label: 'Is set' },
    { value: 'is_not_set', label: 'Is not set' },
  ],
  text: [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
    { value: 'is_set', label: 'Is set' },
    { value: 'is_not_set', label: 'Is not set' },
  ],
  boolean: [
    { value: 'is', label: 'Is' },
    { value: 'is_not', label: 'Is not' },
  ],
  date: [
    { value: 'before', label: 'Before' },
    { value: 'after', label: 'After' },
    { value: 'between', label: 'Between' },
  ],
  array: [
    { value: 'contains', label: 'Contains' },
    { value: 'contains_any', label: 'Contains any' },
    { value: 'contains_all', label: 'Contains all' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],
};

// ── Fields ────────────────────────────────────────────────
/** Fields a condition can use, in today's order, with labels and types. (SegmentForm.tsx:319-328; types from :362-370) */
export const segmentFields: { value: string; label: string; type: SegmentFieldType }[] = [
  { value: 'totalSpent', label: 'Total Spent', type: 'numeric' },
  { value: 'tags', label: 'Tags', type: 'array' },
  { value: 'firstName', label: 'First Name', type: 'text' },
  { value: 'lastName', label: 'Last Name', type: 'text' },
  { value: 'isDeleted', label: 'Is Deleted', type: 'boolean' },
  { value: 'isActive', label: 'Is Active', type: 'boolean' },
  { value: 'createdAt', label: 'Created At', type: 'date' },
  { value: 'updatedAt', label: 'Updated At', type: 'date' },
];

/** Field → type; anything not listed is text. (SegmentForm.tsx:362-370) */
export const segmentFieldType = (field: string): SegmentFieldType =>
  field === 'totalSpent'
    ? 'numeric'
    : field === 'tags'
      ? 'array'
      : field === 'isDeleted' || field === 'isActive'
        ? 'boolean'
        : field === 'createdAt' || field === 'updatedAt'
          ? 'date'
          : 'text';

/** Operators offered for a field. (SegmentForm.tsx:361-370) */
export const segmentOperatorsFor = (field: string) => SEGMENT_OPERATORS[segmentFieldType(field)];

/** Operator set when a field is picked: totalSpent → greater_than; tags → contains; isDeleted/isActive → is; createdAt/updatedAt → after; else equals. (SegmentForm.tsx:303-315) */
export const segmentDefaultOperator = (field: string): string =>
  field === 'totalSpent'
    ? 'greater_than'
    : field === 'tags'
      ? 'contains'
      : field === 'isDeleted' || field === 'isActive'
        ? 'is'
        : field === 'createdAt' || field === 'updatedAt'
          ? 'after'
          : 'equals';

type Condition = Segment['conditions'][number];

/** Picking a field: sets the default operator; boolean fields also reset value to false; other values are kept. (SegmentForm.tsx:300-316) */
export const segmentChangeField = (c: Condition, field: string): Condition => {
  const operator = segmentDefaultOperator(field);
  return segmentFieldType(field) === 'boolean' ? { field, operator, value: false } : { ...c, field, operator };
};

/** Picking an operator: is_set / is_not_set / is_empty / is_not_empty set value true; is / is_not set value false. (SegmentForm.tsx:339-357) */
export const segmentChangeOperator = (c: Condition, operator: string): Condition => {
  if (['is_set', 'is_not_set', 'is_empty', 'is_not_empty'].includes(operator)) return { ...c, operator, value: true };
  if (operator === 'is' || operator === 'is_not') return { ...c, operator, value: false };
  return { ...c, operator };
};

// ── Values ────────────────────────────────────────────────
/** On save: arrays pass through; a string containing a comma becomes a trimmed list (empty parts kept); anything else unchanged. (SegmentForm.tsx:146-151) */
export const segmentValueSplit = (value: unknown): unknown =>
  Array.isArray(value) ? value : typeof value === 'string' && value.includes(',') ? value.split(',').map((v) => v.trim()) : value;

// ── Logic ─────────────────────────────────────────────────
/**
 * Condition logic the editor starts with: AND for a new segment.
 * v1 FIX: an edited segment keeps its saved logic. Today's editor ignores the saved value and always starts at 'AND'
 * (bug: SegmentForm.tsx:94 `useState<string>('AND')`, never set from initialSegment in the effect at :96-102),
 * so saving an OR segment silently flips it to AND (:164).
 */
export const segmentLogic = (saved?: { logic?: SegmentLogic | string | null }): SegmentLogic => (saved?.logic === 'OR' ? 'OR' : 'AND');

// ── Validation ────────────────────────────────────────────
/** Name and description required after trimming; verbatim messages. Empty object when valid. (SegmentForm.tsx:106-124) */
export const segmentValidation = (s: { name?: string; description?: string }): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!(s.name ?? '').trim()) errors.name = 'Name is required';
  if (!(s.description ?? '').trim()) errors.description = 'Description is required';
  return errors;
};

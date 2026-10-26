import { z } from 'zod';
import type { CustomFields, FieldValue } from './schema';

// Pure rules, ported as today. Each cites the gk-pages source it came from (docs/architecture/domain/custom-fields.md).

/** library/utilities/constants/metaData.ts:350 */
export const isReferenceType = (t: string) => t.endsWith('_reference');

/** metaData.ts:330 */
export const isListSupported = (t: string) => !['id', 'money', 'json', 'rich_text_field', 'boolean', 'multi_line_text_field'].includes(t);

/** settings/MetaFieldsSettings/CreateMetaField.tsx:63; per owner type */
export const maxPinned = () => 20;

// ── Unit conversion (utils/unitConversions.ts) ───────────
const TO_BASE: Record<string, Record<string, number>> = {
  weight: { GRAMS: 1, KILOGRAMS: 1000, OUNCES: 28.3495, POUNDS: 453.592 },
  dimension: {
    MILLIMETERS: 1,
    CENTIMETERS: 10,
    METERS: 1000,
    KILOMETERS: 1_000_000,
    INCHES: 25.4,
    FEET: 304.8,
    YARDS: 914.4,
    MILES: 1_609_344_000,
  },
  volume: {
    MILLILITERS: 1,
    CENTILITERS: 10,
    LITERS: 1000,
    CUBIC_METERS: 1_000_000,
    FLUID_OUNCES: 29.5735,
    PINTS: 473.176,
    QUARTS: 946.353,
    GALLONS: 3785.41,
    IMPERIAL_FLUID_OUNCES: 28.4131,
    IMPERIAL_PINTS: 568.261,
    IMPERIAL_QUARTS: 1136.52,
    IMPERIAL_GALLONS: 4546.09,
  },
};
const toBase = (value: number, unit: string, type: string) => value * (TO_BASE[type]?.[unit] ?? 1);
type Bound = number | { value: number; unit: string };
const boundOf = (b: Bound, fallbackUnit: string) => (typeof b === 'object' ? b : { value: b, unit: fallbackUnit });

type Validation = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: unknown[];
  minimum?: Bound;
  maximum?: Bound;
  unit?: string;
  formatMinimum?: string;
  formatMaximum?: string;
  allowed_domains?: string[];
};
const empty = (v: unknown) => v === null || v === undefined || v === '';
const day = (s: string) => s.slice(0, 10);
const URL_PATTERN = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
const hostOf = (s: string) => s.replace(/^https?:\/\//, '').split('/')[0];

/**
 * One value against its definition. '' when valid, else today's message.
 * (components/common/ResourceMetafieldCard.tsx:290-506)
 */
export const validateFieldValue = (def: Pick<CustomFields, 'type' | 'validation'>, value: unknown): string => {
  const v = (def.validation ?? {}) as Validation;
  const one = (val: unknown): string => {
    if (v.required && empty(val)) return 'This field is required';
    if (empty(val)) return '';
    switch (def.type) {
      case 'single_line_text_field':
      case 'multi_line_text_field':
      case 'id': {
        if (typeof val !== 'string') return '';
        if (v.minLength !== undefined && val.length < v.minLength) return `Minimum length is ${v.minLength} characters`;
        if (v.maxLength !== undefined && val.length > v.maxLength) return `Maximum length is ${v.maxLength} characters`;
        if (v.pattern && !new RegExp(v.pattern).test(val)) return 'Value does not match the required pattern';
        if (Array.isArray(v.enum) && v.enum.length > 0 && !v.enum.includes(val)) return 'Value must be one of the allowed values';
        return '';
      }
      case 'number_integer':
      case 'number_decimal':
      case 'money':
      case 'rating': {
        const n = Number(val);
        if (typeof v.minimum === 'number' && n < v.minimum) return `Minimum value is ${v.minimum}`;
        if (typeof v.maximum === 'number' && n > v.maximum) return `Maximum value is ${v.maximum}`;
        return '';
      }
      case 'weight':
      case 'dimension':
      case 'volume': {
        const first = Array.isArray(val) ? val[0] : val;
        const q =
          typeof first === 'number'
            ? { value: first, unit: v.unit ?? Object.keys(TO_BASE[def.type] ?? {})[0] ?? '' }
            : (first as { value?: number; unit?: string } | undefined);
        if (!q || q.value === undefined || !q.unit) return '';
        const base = toBase(q.value, q.unit, def.type);
        if (v.minimum !== undefined) {
          const b = boundOf(v.minimum, v.unit ?? q.unit);
          if (base < toBase(b.value, b.unit, def.type)) return `Minimum value is ${b.value} ${b.unit}`;
        }
        if (v.maximum !== undefined) {
          const b = boundOf(v.maximum, v.unit ?? q.unit);
          if (base > toBase(b.value, b.unit, def.type)) return `Maximum value is ${b.value} ${b.unit}`;
        }
        return '';
      }
      case 'date':
      case 'date_time': {
        if (typeof val !== 'string' || Number.isNaN(Date.parse(val))) return 'Invalid date format';
        if (v.formatMinimum && day(val) < day(v.formatMinimum)) return `Date cannot be before ${day(v.formatMinimum)}`;
        if (v.formatMaximum && day(val) > day(v.formatMaximum)) return `Date cannot be after ${day(v.formatMaximum)}`;
        return '';
      }
      case 'url':
      case 'link': {
        if (typeof val !== 'string' || !URL_PATTERN.test(val)) return 'Please enter a valid URL';
        if (v.allowed_domains?.length && !v.allowed_domains.some((d) => hostOf(val) === hostOf(d))) return 'Domain is not allowed';
        return '';
      }
      default:
        return '';
    }
  };
  if (Array.isArray(value) && !['weight', 'dimension', 'volume'].includes(def.type)) {
    if (v.required && value.length === 0) return 'This field is required';
    for (const item of value) {
      const e = one(item);
      if (e) return e;
    }
    return '';
  }
  return one(value);
};

/** `namespace.key`: how a value is addressed in the form and in field errors. */
export const fieldPath = (f: { namespace: string; key: string }) => `${f.namespace}.${f.key}`;

/**
 * The runtime part of an editor schema: one validator per definition, keyed by `namespace.key`.
 * Used as `InputSchema.extend({ customFields: fieldsSchema(definitions) })`. (ResourceMetafieldCard.tsx:290)
 */
export const fieldsSchema = (definitions: Pick<CustomFields, 'namespace' | 'key' | 'type' | 'validation' | 'required'>[]) =>
  z.record(z.unknown()).superRefine((values, ctx) => {
    for (const d of definitions) {
      const def = d.required ? { ...d, validation: { ...(d.validation ?? {}), required: true } } : d;
      const msg = validateFieldValue(def, values[fieldPath(d)]);
      if (msg) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [fieldPath(d)], message: msg });
    }
  });

/**
 * Pair each definition with its saved value: by definition id, then namespace:key, then key. Values with no definition
 * are kept after the definitions. (utils/metafields.ts:179-248)
 */
export const mergeValues = <D extends { id?: string; namespace: string; key: string }>(
  definitions: D[],
  values: FieldValue[],
): { definition?: D; value?: FieldValue }[] => {
  if (!definitions.length) return values.map((value) => ({ value }));
  const byId = new Map<string, FieldValue>(),
    byNsKey = new Map<string, FieldValue>(),
    byKey = new Map<string, FieldValue>();
  for (const v of values) {
    if (v.definitionId && !byId.has(v.definitionId)) byId.set(v.definitionId, v);
    if (v.namespace && v.key && !byNsKey.has(`${v.namespace}:${v.key}`)) byNsKey.set(`${v.namespace}:${v.key}`, v);
    if (v.key && !byKey.has(v.key)) byKey.set(v.key, v);
  }
  const matched = new Set<FieldValue>();
  const merged = definitions.map((definition) => {
    const value =
      (definition.id && byId.get(definition.id)) ||
      byNsKey.get(`${definition.namespace}:${definition.key}`) ||
      byKey.get(definition.key) ||
      undefined;
    if (value) matched.add(value);
    return { definition, value };
  });
  return [...merged, ...values.filter((v) => !matched.has(v)).map((value) => ({ value }))];
};

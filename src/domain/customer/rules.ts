import { z } from 'zod';
import type { Customer } from './schema';

// Pure rules, ported as today. Each cites the gk-pages source it came from (docs/architecture/domain/customers.md).
// Unused-type guard for entities whose rules take narrower inputs:
export type { Customer as _Customer };

// ── Validation ────────────────────────────────────────────
const PHONE_RE = /^[6-9]\d{9}$/;
const NAME_RE = /^[a-zA-Z\s]+$/;
const INDIAN_COUNTRY_CODE = '+91';
export const NOTES_MAX = 5000;

/** 10-digit Indian mobile starting 6–9. (gk-pages schemas/customerSchema.ts:28) */
export const isValidIndianPhone = (phone: string) => PHONE_RE.test(phone.trim());

const requiredTrimmed = (msg: string) => z.string().trim().min(1, msg);
/** Mirror of the form schema's rules. (gk-pages schemas/customerSchema.ts:6-34) */
const customerFormSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').regex(NAME_RE, 'First name should only contain letters'), // :7
  lastName: z.string().trim().min(1, 'Last name is required').regex(NAME_RE, 'Last name should only contain letters'), // :12
  email: requiredTrimmed('Email is required').email('Please enter a valid email'), // :18
  company: z.string().trim().optional(), // :19
  countryCode: requiredTrimmed('Country code is required').refine(
    (v) => v === INDIAN_COUNTRY_CODE,
    'Only Indian ISD code (+91) is supported',
  ), // :20
  phone: z.string().trim().min(1, 'Phone number is required').regex(PHONE_RE, 'Please enter a valid 10-digit Indian mobile number'), // :24
  taxSetting: requiredTrimmed('Tax setting is required'), // :31
  notes: z.string().trim().max(NOTES_MAX, 'Notes cannot exceed 5000 characters').optional(), // :32
  tags: z.array(z.string().trim()).optional(), // :33
});

export interface CustomerFormInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  countryCode?: string;
  phone?: string;
  taxSetting?: string;
  notes?: string;
  tags?: string[];
}

/**
 * Field errors for the create/edit customer form; empty object when valid. First failing message per field, verbatim.
 * Names: required, letters and spaces only. Email: required, valid. Country code: required, +91 only.
 * Phone: required, `^[6-9]\d{9}$`. Tax setting: required. Notes ≤ 5000. All strings trimmed first.
 * (gk-pages schemas/customerSchema.ts:6)
 */
export const customerValidation = (input: CustomerFormInput): Record<string, string> => {
  const withBlanks = {
    ...input,
    firstName: input.firstName ?? '',
    lastName: input.lastName ?? '',
    email: input.email ?? '',
    countryCode: input.countryCode ?? '',
    phone: input.phone ?? '',
    taxSetting: input.taxSetting ?? '',
  };
  const res = customerFormSchema.safeParse(withBlanks);
  if (res.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of res.error.issues) {
    const key = issue.path.join('.');
    if (!(key in errors)) errors[key] = issue.message;
  }
  return errors;
};

// ── Defaults (two known conflicts, kept as today) ─────────
/**
 * Create-form defaults. CONFLICT kept as today: taxSetting DONT_COLLECT_TAX here vs COLLECT_TAX in the reader;
 * language 'English [Default]' here vs 'en' in the reader.
 * (gk-pages components/customers/CreateCustomerForm.tsx:100; schemas/customerSchema.ts:17, :29-30)
 */
export const customerFormDefaults = {
  taxSetting: 'DONT_COLLECT_TAX' as const,
  language: 'English [Default]',
  countryCode: INDIAN_COUNTRY_CODE,
  hasEmailSubscription: false,
  hasSmsSubscription: false,
};

/**
 * Reader (wire → domain) defaults when the field is missing. CONFLICT kept as today: see `customerFormDefaults`.
 * (gk-pages modules/customers/transformer.ts:49, :52)
 */
export const customerReadDefaults = { taxSetting: 'COLLECT_TAX' as const, language: 'en' };

// ── List search ───────────────────────────────────────────
export interface FilterCondition {
  field: string;
  operator: string;
  value: unknown;
}
export interface CustomerListFilters {
  search?: string;
  tags?: string[];
  emailSubscribed?: boolean;
}

/** Fields a typed term is matched against with `contains`. (gk-pages pages/customers/CustomerHome.tsx:118-162) */
export const CUSTOMER_SEARCH_FIELDS = ['email', 'firstName', 'lastName', 'name', 'phone', 'company', 'tags', 'address'] as const;

/**
 * Conditions and logic for the customer list filter endpoint.
 * A trimmed term becomes `contains` on email, first name, last name, name (backend CONCAT), phone, company, tags, address.
 * Tags filter → `tags contains_any`; email-subscribed filter → `hasEmailSubscription equals`.
 * Logic: OR when only the term is present; AND when any other filter is active (or no term); AND when no conditions.
 * Note: since INFN-3348 gk-pages sends a typed term to os-search instead (CustomerHome.tsx:93); this is the filter-endpoint shape.
 * (gk-pages pages/customers/CustomerHome.tsx:94, :114-192)
 */
export const customerSearch = (f: CustomerListFilters): { conditions?: FilterCondition[]; conditionLogic: 'AND' | 'OR' } => {
  const term = f.search?.trim() ?? '';
  const conditions: FilterCondition[] = term ? CUSTOMER_SEARCH_FIELDS.map((field) => ({ field, operator: 'contains', value: term })) : [];
  const hasTags = !!f.tags && f.tags.length > 0;
  if (hasTags) conditions.push({ field: 'tags', operator: 'contains_any', value: f.tags });
  if (f.emailSubscribed !== undefined) conditions.push({ field: 'hasEmailSubscription', operator: 'equals', value: f.emailSubscribed });
  const hasOther = hasTags || f.emailSubscribed !== undefined;
  const logic: 'AND' | 'OR' = term && !hasOther ? 'OR' : 'AND';
  return conditions.length > 0 ? { conditions, conditionLogic: logic } : { conditionLogic: 'AND' };
};

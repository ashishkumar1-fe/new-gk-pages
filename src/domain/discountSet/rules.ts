import type { DiscountSet } from './schema';

// Pure rules, ported as today. Each cites the gk-pages source it came from (docs/architecture/domain/discounts.md#discount (bulk codes)).
// gk-pages paths are relative to gk-pages/src/. Messages are verbatim.
// Unused-type guard for entities whose rules take narrower inputs:
export type { DiscountSet as _DiscountSet };

export interface DiscountSetCodesInput {
  totalCodes?: number | null;
  prefix?: string | null;
  suffix?: string | null;
  codeLength?: number | null;
}

const CODE_PATTERN = /^[A-Z0-9-]+$/;
const affix = (s: string | null | undefined): string | undefined => {
  if (!s) return undefined; // antd skips non-required empty values
  if (s.length > 20) return 'Code cannot exceed 20 characters';
  if (!CODE_PATTERN.test(s)) return 'Code can only contain uppercase letters, numbers, and hyphens';
  return undefined;
};

/**
 * Bulk-code (discount set) generator fields, first failing rule per field.
 * - number of codes 1–1,000,000 — components/discounts/OrderDisountForm.tsx:266-272
 * - prefix and suffix ≤ 20, `^[A-Z0-9-]+$`, optional — OrderDisountForm.tsx:286-293, :304-311
 * - code length 1–100; prefix + length + suffix ≥ 10 (skipped while length is empty) — OrderDisountForm.tsx:333-351
 */
export const discountSetErrors = (s: DiscountSetCodesInput): Record<string, string> => {
  const e: Record<string, string> = {};
  if (s.totalCodes != null && !(s.totalCodes >= 1 && s.totalCodes <= 1_000_000)) e.totalCodes = 'Quantity must be between 1 and 10,00,000';
  const p = affix(s.prefix);
  if (p) e.prefix = p;
  const x = affix(s.suffix);
  if (x) e.suffix = x;
  if (s.codeLength != null) {
    const total = s.codeLength + (s.prefix ?? '').length + (s.suffix ?? '').length;
    if (!(s.codeLength >= 1 && s.codeLength <= 100)) e.codeLength = 'Length must be between 1 and 100';
    else if (total < 10) e.codeLength = `Total code length (prefix + length + suffix) must be at least 10. Currently ${total}.`;
  }
  return e;
};

/** components/discounts/OrderDisountForm.tsx:265 — true when the generator fields are complete and pass discountSetErrors. */
export const discountSetValidation = (s: { totalCodes: number; prefix?: string; suffix?: string; codeLength: number }) =>
  Object.keys(discountSetErrors(s)).length === 0;

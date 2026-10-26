import { toResult as generic } from '@/api/_shared/errors';
/** os-customer-specific error codes map here (docs/architecture/gateway/os-customer.md); everything else falls through to the generic mapper. */
export const toResult = generic;

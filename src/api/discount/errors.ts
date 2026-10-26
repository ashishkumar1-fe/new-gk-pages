import { toResult as generic } from '@/api/_shared/errors';
/** discount-specific error codes map here (docs/architecture/gateway/discount.md); everything else falls through to the generic mapper. */
export const toResult = generic;

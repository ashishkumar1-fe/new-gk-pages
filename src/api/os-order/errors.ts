import { toResult as generic } from '@/api/_shared/errors';
/** os-order-specific error codes map here (docs/architecture/gateway/os-order.md); everything else falls through to the generic mapper. */
export const toResult = generic;

import { toResult as generic } from '@/api/_shared/errors';
/** inventory-specific error codes map here (docs/architecture/gateway/inventory.md); everything else falls through to the generic mapper. */
export const toResult = generic;

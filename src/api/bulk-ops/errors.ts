import { toResult as generic } from '@/api/_shared/errors';
/** bulk-ops-specific error codes map here (docs/architecture/gateway/bulk-ops.md); everything else falls through to the generic mapper. */
export const toResult = generic;

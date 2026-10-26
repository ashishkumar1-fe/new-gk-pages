import { toResult as generic } from '@/api/_shared/errors';
/** dashboard-specific error codes map here (docs/architecture/gateway/dashboard.md); everything else falls through to the generic mapper. */
export const toResult = generic;

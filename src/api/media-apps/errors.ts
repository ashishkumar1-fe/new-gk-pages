import { toResult as generic } from '@/api/_shared/errors';
/** media-apps-specific error codes map here (docs/architecture/gateway/media-apps.md); everything else falls through to the generic mapper. */
export const toResult = generic;

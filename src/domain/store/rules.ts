import type { Store } from './schema';

// Pure rules, ported as today. Each cites the gk-pages source it came from (docs/architecture/domain/store.md).
// Unused-type guard for entities whose rules take narrower inputs:
export type { Store as _Store };

/** dashboard-ui sideNav/index.tsx:1476 */
export const hasPages = (s: Pick<Store, 'products'>) => s.products.pages === true;

/**
 * `{storefront_url}/{route}/{encoded handle}`; undefined when the domain, route or handle is missing, so the caller asks the
 * merchant to set Storefront settings first. One source for product and collection links. (gk-pages utils/storefrontUrl.ts:9)
 */
export const buildStorefrontUrl = (
  storefrontUrl: string | undefined,
  route: string | undefined,
  handle: string | undefined,
): string | undefined => {
  if (!storefrontUrl || !route || !handle) return undefined;
  return `${storefrontUrl.replace(/\/$/, '')}/${route.replace(/^\/|\/$/g, '')}/${encodeURIComponent(handle)}`;
};

import type { Location } from './schema';

// Pure rules, ported as today. Each cites the gk-pages source it came from (docs/architecture/domain/inventory.md#location).
// Unused-type guard for entities whose rules take narrower inputs:
export type { Location as _Location };

/** gateway/inventory.md LOCATION_IS_DEFAULT; the server also refuses when it holds stock */
export const canDeactivate = (l: Pick<Location, 'isDefault' | 'active'>) => l.active && !l.isDefault;

/** store/inventory/index.ts:286 (fetchWarehouses) — the v3 list returns inactive locations too; pickers show active only. Order kept. */
export const activeLocations = <L extends Pick<Location, 'active'>>(locations: L[]): L[] => locations.filter((l) => l.active);

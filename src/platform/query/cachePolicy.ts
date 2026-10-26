/** Freshness is one switch. Queries declare a class, never a number (ADR 0005). */
export type CacheClass = 'list' | 'detail' | 'lookup' | 'calc';

const policies = {
  balanced: { list: 30_000, detail: 60_000, lookup: 10 * 60_000, calc: 0 }, // default (d42)
  fresh: { list: 0, detail: 0, lookup: 10 * 60_000, calc: 0 }, // revalidate on every mount
} satisfies Record<string, Record<CacheClass, number>>;

export const ACTIVE_POLICY: keyof typeof policies = 'balanced'; // ← the switch
export const staleTimeFor = (c: CacheClass) => policies[ACTIVE_POLICY][c];

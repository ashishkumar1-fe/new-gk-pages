# Data access

[← Resources](README.md)

## Fetch functions

Each resource has a read-only data provider. Writes are commands, which call the API module directly.

```ts
interface DataProvider<T, TItem> {
  cache: CacheClass;                                 // cache policy below
  getList(params: ListParams, opts: { signal }): Promise<Page<TItem>>;
  getOne(id: Id, opts: { signal }): Promise<T>;
  getMany?(ids: Id[], opts: { signal }): Promise<TItem[]>;            // pickers, references
  search?(text: string, limit: number, opts: { signal }): Promise<TItem[]>;   // ⌘K and pickers
}
```

```ts
interface ListParams {
  view?: string;                         // active tab
  search?: string;
  filters?: Record<string, unknown>;     // filter id → value; turned into the typed query by each filter's toQuery
  scope?: Record<string, string>;        // required scope (location) or relation scope (customerId)
  sort?: { field: string; direction: 'asc' | 'desc' };
  page?: number;                         // 1-based
  limit?: number;                        // 50
}
```

A provider only builds the typed query and calls the API module, which parses, transforms and returns `Page<TItem>` ([service API](../service-api/README.md#module-contract)):

```ts
getList: (p, { signal }) => api.osOrder.listOrders(toQuery(p), { signal })
```

## Query keys

```ts
const keys = {
  all:     ['product', storeId] as const,             // [domain, storeId, …] (d31)
  lists:   () => [...keys.all, 'list'] as const,
  list:    (p: ListParams) => [...keys.lists(), p] as const,
  details: () => [...keys.all, 'detail'] as const,
  detail:  (id: Id) => [...keys.details(), id] as const,
  calc:    (input: unknown) => [...keys.all, 'calc', input] as const,   // server calculations
};
```

`storeId` is in every key, so one store's cache never shows in another.

## Cache policy

Today's gk-pages has no cache: every navigation refetches. In Ratio, freshness is one setting, not per-screen code:

- Every query takes its `staleTime` from a named class.
- The classes come from one policy object in `platform/query/cachePolicy.ts`.
- Switching policy is a one-line change.

```ts
type CacheClass = 'list' | 'detail' | 'lookup' | 'calc';

const policies = {
  balanced: { list: 30_000, detail: 60_000, lookup: 10 * 60_000, calc: 0 },   // default (d42)
  fresh:    { list: 0,      detail: 0,      lookup: 10 * 60_000, calc: 0 },   // revalidate on every mount
} satisfies Record<string, Record<CacheClass, number>>;

export const ACTIVE_POLICY: keyof typeof policies = 'balanced';   // ← the switch
```

| Class | Used by | Why |
|---|---|---|
| `list` | list screens | Orders arrive constantly |
| `detail` | detail and editor reads | The editor keeps its own draft |
| `lookup` | vendors, types, tags, taxonomy, locations, suppliers, sort options, views | Rarely change |
| `calc` | server calculations (`/calculate`, edit-session preview) | Always current |

- Data providers declare a class, never a number; the `new:resource` scaffolder won't generate one without it. A resource that must always be fresh overrides with `0` and a comment.
- `refetchOnWindowFocus: true` globally, in every policy: returning to the tab always revalidates.
- Either policy renders cached data instantly while the background refetch runs.
- Polling is declared on commands and jobs and run by machines ([poll policy](../docs/machines.md#poll-policy)).

## Invalidation

- Commands declare what they invalidate.
- After a save the detail cache is set from the response; lists are invalidated.
- Timeline: refetched immediately and again after 2.5 s after an order mutation, as today (events are written asynchronously).

## Seeding and prefetch

- Opening a row seeds the detail with the list row, so the header shows instantly.
- Hovering a row prefetches its detail.

## Errors

| Error | Behaviour |
|---|---|
| Schema drift | Logged to Sentry; data still renders ([ADR 0004](../adr/0004-validate-every-response.md)). Only a bad money value stops: the row shows "can't display", list continues |
| 401 | Session flow |
| 403 | Permission screen (detail); for commands see [execution](../commands/execution.md#errors-from-the-server) |
| 404 | Not-found screen with link to the list |
| Network / 5xx | 2 retries with backoff, then error state with retry |

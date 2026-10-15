# Data access

[← Resources](README.md)

## Fetch functions

Each resource has a read-only data provider. Writes are commands, which call the API module directly.

```ts
interface DataProvider<T, TItem> {
  getList(params: ListParams): Promise<Page<TItem>>;
  getOne(id: Id): Promise<T>;
  getMany?(ids: Id[]): Promise<TItem[]>;            // pickers, references
  search?(text: string, limit: number): Promise<TItem[]>;   // ⌘K and pickers
  count?(params: ListParams): Promise<number>;      // nav badges
}
```

Inside a provider: map `ListParams` to the service's params → call → unwrap the envelope → transform each row → parse with the schema → return `Page<TItem>`.

Service-specific mapping lives here, for example:

| Resource | List call today |
|---|---|
| Product | `GET /products/?storeId&search&vendor&tags&productType&status&page&limit&show_variants=true` |
| Collection | `GET /collections/?storeId&search&types&published&page&limit` |
| Inventory | `GET /v3/admin/inventory/levels?location_id&<range filters>&sort_by&sort_dir&page&limit`; search adds `search` |
| Order | `GET /orders?page&limit&sort_field&sort_direction&search&<filters>` + `/orders/views`, `/orders/sortby` |
| Customer | `POST /customers/filter { conditions, conditionLogic, page, limit, sortBy, sortOrder }` |
| Discount | `POST {BASE}/dashboard/v2/discount/fetch { status, search, sort_by, sort_order, page, limit, pageSize }` |

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

`storeId` is in every key, so one store's cache never shows in another ([API client](../platform/api-client.md#query-keys)).

## Cache policy

Today's gk-pages has no cache: every navigation refetches. Freshness is one setting, not per-screen code: every query takes its `staleTime` from a named class, and the classes come from one policy object in `platform/query/cachePolicy.ts`. Switching policy is a one-line change.

```ts
type CacheClass = 'list' | 'detail' | 'lookup' | 'calc';

const policies = {
  fresh:    { list: 0,      detail: 0,      lookup: 10 * 60_000, calc: 0 },   // revalidate on every mount and focus (tracker: "never feel stale")
  balanced: { list: 30_000, detail: 60_000, lookup: 10 * 60_000, calc: 0 },   // fewer refetches
} satisfies Record<string, Record<CacheClass, number>>;

export const ACTIVE_POLICY: keyof typeof policies = 'fresh';   // ← the switch
```

| Class | Used by | Why |
|---|---|---|
| `list` | list screens | Orders arrive constantly; refetch on window focus in both policies |
| `detail` | detail and editor reads | The editor keeps its own draft |
| `lookup` | vendors, types, tags, taxonomy, locations, suppliers, sort options, views | Rarely change |
| `calc` | server calculations (`/calculate`, edit-session preview) | Always current |

Resource data providers declare a class, never a number; a per-resource override is allowed only with a comment saying why. Either policy renders cached data instantly while the background refetch runs. Polling stays per command (refund status: 5 s, up to 24 times, as today).

## Invalidation

- Commands declare what they invalidate.
- After a save the detail cache is set from the response; lists are invalidated.
- Cross-resource effects are explicit: refund → order, timeline; receive PO/transfer → inventory; order cancel with restock → inventory; product save → inventory (stock edits).
- Timeline: refetched immediately and again after 2.5 s after an order mutation, as today (events are written asynchronously).

## Seeding and prefetch

- Opening a row seeds the detail with the list row, so the header shows instantly.
- Hovering a row prefetches its detail.

## Errors

| Error | Behaviour |
|---|---|
| Schema parse failure | Reported with resource and field path; the row shows "can't display", list continues |
| 401 | Session flow |
| 403 | Permission screen (detail), hidden action (commands) |
| 404 | Not-found screen with link to the list |
| Network / 5xx | 2 retries with backoff (proposed; same as commands), then error state with retry |

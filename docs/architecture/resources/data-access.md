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
| Inventory | `GET /inventory/warehouse/:warehouseId?filter&…&page&limit`; search uses `GET /inventory/search` |
| Order | `GET /orders?page&limit&sort_field&sort_direction&search&<filters>` + `/orders/views`, `/orders/sortby` |
| Customer | `POST /customers/filter { conditions, conditionLogic, page, limit, sortBy, sortOrder }` |
| Discount | `POST /os-discount/fetch { status, search, sort_by, sort_order, page, limit }` |

## Query keys

```ts
const keys = {
  all:     [merchantId, 'product'] as const,
  lists:   () => [...keys.all, 'list'] as const,
  list:    (p: ListParams) => [...keys.lists(), p] as const,
  details: () => [...keys.all, 'detail'] as const,
  detail:  (id: Id) => [...keys.details(), id] as const,
  calc:    (input: unknown) => [...keys.all, 'calc', input] as const,   // server calculations
};
```

Merchant ID first, so switching store never shows another store's data.

## Cache policy

Today's gk-pages has no cache: every navigation refetches. Proposed starting values, tuned after launch with real traffic:

| Data | Fresh for | Why |
|---|---|---|
| Lists | 30 s, refetch on window focus | Orders arrive constantly |
| Detail | 60 s | The editor keeps its own draft |
| Lookups (vendors, types, tags, taxonomy, warehouses, suppliers, sort options, views) | 10 min | Rarely change |
| Server calculations (`/calculate`) | 0 | Always current |
| Refund status | Polled 5 s, up to 24 times | As today |

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

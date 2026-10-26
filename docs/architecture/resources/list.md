# List

[← Resources](README.md)

## Config

```ts
interface ListConfig<TItem> {
  scope?: ScopeSelector;                   // inventory: a warehouse must be chosen
  columns: Column<TItem>[];
  defaultColumns?: string[];
  search?: {
    placeholder: string;
    debounceMs: number;                    // 500, as today's shared toolbar
    minLength?: (q: string) => boolean;    // orders: ≥2 chars or an order number
    mode?: 'server' | 'client';            // client = filters the loaded page (as today where the API lacks it)
  };
  filters?: Filter[];
  views?: { source: 'static'; items: View[]; mode?: 'server' | 'client' } | { source: 'server'; default: 'is_default' | 'first' };
  sort?: { source: 'static'; options: SortOption[]; default: SortOption }
       | { source: 'server'; default: SortOption }      // orders, drafts: /sortby
       | { source: 'column' };                           // column click sets sort { field, direction }
  pageSize: number;                        // 50 everywhere
  selection?: { enabled: boolean; max?: number };   // orders: max 100
  cellEdit?: { cells: string[]; command: CommandId };   // inventory: per-cell popover, immediate save
  insights?: { component: ComponentId; capability: string };   // design: strip above the products table
  rowLink?: 'detail' | ((r: TItem) => string) | false;
  empty: { title: string; body?: string; action?: CommandId };
}

type Filter<TQuery = unknown> = {
  id: string;
  label: string;
  toQuery: (value: unknown) => Partial<TQuery>;   // the list function's typed query, domain names
  mode?: 'server' | 'client';
} & (
  | { type: 'enum' | 'multi_enum'; options: Option[] | (() => Promise<Option[]>) }
  | { type: 'text' }
  | { type: 'number_range' }
  | { type: 'money_range' }                // entered in rupees, becomes Money
  | { type: 'date_range' }                 // local days, { from, to } DateOnly
  | { type: 'conditions'; fields: ConditionField[] }   // customers: condition list
);

interface Column<TItem> {
  id: string;
  header: string;                          // copy key
  cell?: (row: TItem) => CellSpec | { component: ComponentId };   // default: field with the column id
  sortKey?: string;                        // only where the API sorts by column
}
type CellSpec = { kind: 'text' | 'money' | 'date' | 'datetime' | 'status' | 'image_title' | 'count'; value: unknown };
interface View { id: string; label: string; params?: Partial<ListParams> }
interface SortOption { field: string; direction: 'asc' | 'desc'; label?: string }
interface ScopeSelector { param: string; source: () => Promise<Option[]>; required: boolean }
interface ConditionField { field: string; type: 'text' | 'number' | 'money' | 'date' | 'boolean' | 'tags' }
interface Option { value: string; label: string }
```

Custom cells and sections name a component by `ComponentId`; surfaces resolve it, so contracts never import React components ([structure](../docs/structure.md#layers-and-imports)).

`toQuery` speaks domain names and units; the API module encodes them for its service (comma-joined, repeated arrays, min/max pairs, condition objects, paise, day bounds), as listed in [gateway](../gateway/README.md).

## URL state

```
/orders?view=unfulfilled&q=rahul&financial_status=paid&created=2026-10-01..2026-10-14&sort=created_at:desc&page=2
```

| Param | Meaning |
|---|---|
| `view` | Active tab |
| `q` | Search text |
| `<filterId>` | Filter value; lists comma-separated; ranges `min..max` |
| `sort` | `field:direction` |
| `page` | Page (size fixed per resource) |
| scope | e.g. `location` for inventory |
| relation scope | e.g. `customerId` for a customer's orders |

Changing search, filters, sort, view or scope resets `page`.

## Views and sort

- **Server views** (orders, drafts): loaded from `/views`; a view's query (`["k=v"]`) becomes URL params. Default is the view marked default, else the first.
- **Server sort options** (orders, drafts): loaded from `/sortby`.
- **Column sort** (discounts, orders, drafts): clicking a sortable column sets `sort`; the API module encodes it per service.
- **No sort** (products, collections fixed to newest first): no sort UI, because the API doesn't sort. Customers: the API sorts, the UI is deferred ([deferred](../domain/deferred.md)).

## Selection and bulk

- Selection is per page; there is no "select all matching" (no API supports filter-based bulk).
- Optional cap (orders: 100, with a warning).
- Some bulk commands are conditional on the selection (orders: Unarchive only if all selected are archived).
- Selection clears when the URL changes.

## Column preferences

Visible columns per resource, stored locally per user. They never change the URL or what is fetched.

## States

| State | Shows |
|---|---|
| First load | Table skeleton with real headers |
| Refetch | Rows stay; thin progress bar |
| Empty (no records) | `empty` with its action |
| Empty (filters) | "No results" and clear filters |
| Error | Message and retry |
| Row parse error | Row shows "can't display" |

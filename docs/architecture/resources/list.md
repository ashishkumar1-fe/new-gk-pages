# List

[← Resources](README.md)

## Config

```ts
interface ListConfig<TItem> {
  scope?: ScopeSelector;                   // inventory: a warehouse must be chosen
  columns: Column<TItem>[];
  defaultColumns?: string[];
  search?: {
    param: string;                         // "search", "query", "search_term"
    placeholder: string;
    debounceMs: number;                    // as today per resource, 400 where today has none
    minLength?: (q: string) => boolean;    // orders: ≥2 chars or an order number
    endpoint?: 'list' | 'search';          // inventory and POs use a separate search endpoint
    mode?: 'server' | 'client';            // client = filters the loaded page (as today where the API lacks it)
  };
  filters?: Filter[];
  views?: { source: 'static'; items: View[]; mode?: 'server' | 'client' } | { source: 'server'; default: 'is_default' | 'first' };
  sort?: { source: 'static'; options: SortOption[]; default: SortOption }
       | { source: 'server'; default: SortOption }      // orders, drafts: /sortby
       | { source: 'column' };                           // discounts: sort_by on column click; orders, drafts: sort_field / sort_direction
  pageSize: number;                        // 50 everywhere
  selection?: { enabled: boolean; max?: number };   // orders: max 100
  inlineEdit?: InlineEditConfig<TItem>;    // inventory grid
  insights?: { component: ComponentType; capability: string };   // design: strip above the products table
  rowLink?: 'detail' | ((r: TItem) => string) | false;
  empty: { title: string; body?: string; action?: CommandId };
}

type Filter = {
  id: string;
  label: string;
  toParams: (value: unknown) => Record<string, unknown>;   // exact API mapping
  mode?: 'server' | 'client';
} & (
  | { type: 'enum' | 'multi_enum'; options: Option[] | (() => Promise<Option[]>) }
  | { type: 'text' }
  | { type: 'number_range' }
  | { type: 'money_range' }                // entered in rupees, sent in paise
  | { type: 'date_range' }                 // local day start/end, sent as ISO
  | { type: 'conditions'; fields: ConditionField[] }   // customers: condition list
);

interface Column<TItem> {
  id: string;
  header: string;                          // copy key
  cell?: (row: TItem) => ReactNode | CellSpec;   // default: field with the column id
  sortKey?: string;                        // only where the API sorts by column
}
type CellSpec = { kind: 'text' | 'money' | 'date' | 'datetime' | 'status' | 'image_title' | 'count'; value: unknown };
interface View { id: string; label: string; params?: Partial<ListParams> }
interface SortOption { field: string; direction: 'asc' | 'desc'; label?: string }
interface ScopeSelector { param: string; source: () => Promise<Option[]>; required: boolean }
interface ConditionField { field: string; type: 'text' | 'number' | 'money' | 'date' | 'boolean' | 'tags' }
interface Option { value: string; label: string }

interface InlineEditConfig<TItem> {
  editable: string[];                      // column ids
  derive?: (row: TItem, changed: string) => Partial<TItem>;   // inventory: on hand ↔ available
  save: CommandId;                         // one call with changed rows
}
```

`toParams` is required because each service encodes filters differently: comma-joined (products), repeated arrays (inventory), min/max pairs (orders), condition objects (customers).

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
| relation scope | e.g. `customer_id` for a customer's orders |

Changing search, filters, sort, view or scope resets `page`.

## Views and sort

- **Server views** (orders, drafts): loaded from `/views`; a view's query (`["k=v"]`) becomes URL params. Default is the view marked default, else the first.
- **Server sort options** (orders, drafts): loaded from `/sortby`.
- **Column sort** (discounts, orders, drafts): clicking a sortable column sets `sort_by` / `sort_order` (discounts) or `sort_field` / `sort_direction` (orders, drafts).
- **No sort** (products, collections, customers fixed to newest first): no sort UI, because the API doesn't sort.

## Selection and bulk

- Selection is per page; there is no "select all matching" (no API supports filter-based bulk).
- Optional cap (orders: 100, with a warning).
- Some bulk commands are conditional on the selection (orders: Unarchive only if all selected are archived).
- Selection clears when the URL changes.

## Inline edit

Inventory edits quantities in the table. Changed rows are tracked; a save bar shows "N items modified" with Cancel and Save. Save sends only changed rows in one command. Cancel restores the loaded values.

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

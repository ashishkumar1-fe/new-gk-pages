# Editor

[← Resources](README.md)

The record page for resources edited in place: product, collection, PO, transfer, draft order, customer, segment, discount. Orders use a read view with a separate edit route (see [defs/order.md](defs/order.md)). Singletons (settings) use it too, without create, delete or pager.

## Config

```ts
interface EditorConfig<T, TInput> {
  toInput: (record: T) => TInput;
  layout: { main: Section<TInput>[]; aside?: Section<TInput>[] };   // 65/35 on desktop, as today
  readOnlyWhen?: (r: T) => boolean;          // draft order completed
  header?: { status?: (d: TInput) => StatusSpec };
  save: CommandId;
  create?: { route: string; initial: (ctx: CreateContext) => TInput; command: CommandId };
  calculate?: {                              // server-side totals
    query: (d: TInput) => Promise<unknown>;  // draft calculate. Order edit is not an EditorConfig: its route runs the order edit session machine
    debounceMs: number;                      // 500 as today
    skipWhen?: (d: TInput) => boolean;       // no line items
  };
  children?: Record<string, ChildConfig>;
}

type Section<TInput> =
  | { id: string; title: string; fields: FieldSpec<TInput>[]; visibleWhen?: (d: TInput) => boolean; collapsible?: boolean }
  | { id: string; title?: string; component: ComponentId; visibleWhen?: (d: TInput) => boolean };   // resolved by surfaces

interface FieldSpec<TInput> {
  path: Path<TInput>;
  label: string;
  type: 'text' | 'textarea' | 'rich_text' | 'number' | 'money' | 'percent' | 'select'
      | 'multi_select' | 'tags' | 'boolean' | 'date' | 'image' | 'media_list' | 'reference' | 'phone';
  help?: string;
  readOnly?: boolean | ((d: TInput) => boolean);
  visibleWhen?: (d: TInput) => boolean;
}
```

## Saving

- Dirty and valid come from the form; Save is enabled only when both hold. Validation is the input schema plus runtime custom-field schemas, always run before save.
- The save itself runs the [record save machine](../docs/machines.md#record-save); one save bar with Discard / Save (design).
- Every editor has the [leave guard](../docs/machines.md#other-orchestration).
- With `calculate`, totals shown come from the server response, never computed locally (today's tax fallback is the one exception, kept as is). A response older than the latest request is dropped.

## Children

```ts
interface ChildConfig {
  path: string;                              // "variants", "lineItems", "addresses"
  columns: Column<unknown>[];
  editable?: string[];
  preview?: number;                          // rows before "View all" (design: 4 variants)
  subRoute?: string;                         // full list view
  pageSize?: number;                         // server-paged children (collection products: 50)
  blockPagingWhenDirty?: boolean;            // as today in collection products
}
```

When a child is saved through its own endpoint (customer addresses), the save command orchestrates the calls in today's order. The UI never calls child endpoints directly.

## Create

A create route uses the same editor with `create.initial`. Prefill sources are part of `CreateContext`: duplicate (`sourceId`), selected inventory rows (transfer/PO from inventory), customer (order from customer page). On success, navigate to the new record.

## Sub-routes

Flows that are their own page today stay their own route: receive (PO, transfer), edit order, customers in segment, variants full list.

# Contract

[← Resources](README.md)

```ts
interface ResourceDefinition<
  T extends Entity,             // detail shape
  TItem = T,                    // list row shape
  TInput = unknown,             // editor draft shape
> {
  // ── Identity ────────────────────────────────────────────
  name: string;                 // "product"; used in routes, keys, commands
  label: { singular: string; plural: string };   // copy keys
  icon: IconName;
  title: (r: T | TItem) => string;               // "#1042", product title
  subtitle?: (r: T | TItem) => string;

  // ── Data ────────────────────────────────────────────────
  service: 'dashboard' | 'os-order' | 'item' | 'inventory' | 'os-customer' | 'discount' | 'bulk-ops' | 'media-apps';   // gateway page ids (gateway/README.md#services)
  schema: { detail: ZodType<T>; item: ZodType<TItem>; input?: ZodType<TInput> };
  data: DataProvider<T, TItem>;                  // data-access.md
  keys: QueryKeys;

  // ── Routes ──────────────────────────────────────────────
  routes: {
    list?: string;                               // "/orders"; collections only
    detail?: string;                             // "/orders/$id"
    create?: string;                             // "/orders/new"
    sub?: Record<string, string>;                // { receive: "/purchase-orders/$id/receive" }
  };
  kind?: 'collection' | 'singleton';             // singleton: one record per store, editor only, no id (settings)

  // ── Screens ─────────────────────────────────────────────
  list?: ListConfig<TItem>;                      // list.md
  detail?: DetailConfig<T>;                      // read view with actions (orders)
  editor?: EditorConfig<T, TInput>;              // editor.md
  quickCreate?: { fields: (keyof TInput)[]; command: CommandId };

  // ── Relations ───────────────────────────────────────────
  relations?: Record<string, {
    resource: string;
    kind: 'one' | 'many';
    via: string;                                 // field on T, or list scope ("customerId")
  }>;

  // ── Actions (references only) ───────────────────────────
  commands?: {
    row?: CommandId[];
    bulk?: CommandId[];
    page?: CommandId[];                          // header buttons
    primary?: (r: T) => CommandId | undefined;   // status-driven main button (PO: Mark as ordered / Receive)
    more?: (r: T) => CommandId[];                // status-driven "More" menu
  };

  // ── Discovery ───────────────────────────────────────────
  search?: { enabled: boolean; limit?: number }; // ⌘K
  nav?: { group: string; position: number; parent?: string; badge?: { params: Partial<ListParams>; cap?: number } };   // count = getList({...params, limit: 1}).total
  settings?: { tab: string; group: string; position: number; keywords?: string[] };   // a settings sheet tab instead of a nav entry

  // ── Extensibility ───────────────────────────────────────
  customFields?: { ownerType: OwnerType; placement: 'main' | 'aside'; readOnly?: boolean };
  extensionTargets?: string[];                   // today's target names, e.g. "admin.product-details.block.render"

  // ── Access ──────────────────────────────────────────────
  permissions: { read: Permission; write?: Permission };
  capability?: string;                           // feature flag; off = hidden everywhere

  // ── Assistant ───────────────────────────────────────────
  assistant?: {
    description: string;
    readableFields: string[];
    listParams?: ZodType;                        // filters the AI may use (subset of list filters)
  };
}

interface DetailConfig<T> {
  layout: { main: Section<T>[]; aside?: Section<T>[] };
  pager?: (r: T) => { previous?: Id; next?: Id };   // orders: from the API; J/K keys
  editRoute?: (r: T) => string;                      // orders: "/orders/$id/edit"; the Edit entry is a command, so disabled-with-reason comes from its `enabled`
}
```

## Notes

- **Detail vs editor.** Most resources edit in place (editor). Orders are a read view with actions plus a separate edit route, because editing an order goes through an os-order edit session (begin → stage → preview → commit).
- **Status-driven actions.** POs and transfers change their main button and menu by status; `primary` and `more` express that instead of hard-coded buttons.
- **Scoped lists.** A relation `via` a list param (`customer_id`) gives "View all orders" from the customer page with no extra code.
- **Commands are IDs.** The registry resolves them, checks permission and `enabled`, and asks for confirmation.
- **Capability flag** hides the resource from nav, routes, ⌘K and the assistant at once.
- **Assistant metadata is opt-in.**

## Supporting types

```ts
type Permission = `${'read' | 'write'}_${string}`;  // Shopify-style scope: "read_products", "write_orders", "write_refunds"; enforcement off in v1
type ComponentId = string;                          // custom cell / section; surfaces resolve it
type IconName = string;                              // from the UI kit icon set
type StatusSpec = { label: string; tone: 'success' | 'warning' | 'critical' | 'info' | 'neutral' };
interface CreateContext {                            // prefill sources for create routes
  sourceId?: Id;                                     // duplicate
  selection?: { resource: string; rows: unknown[] }; // from inventory selection
  customerId?: Id;                                   // order from customer page
}
```

List types (`Column`, `Filter`, `View`, `SortOption`, `ScopeSelector`, `ConditionField`) are in [list.md](list.md#config); editor types in [editor.md](editor.md#config).

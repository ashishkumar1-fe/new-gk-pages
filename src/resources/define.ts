import type { ZodType, ZodTypeDef } from 'zod';
/** A schema whose parsed output is T; its input may differ (defaults, coercions). */
export type Schema<T> = ZodType<T, ZodTypeDef, unknown>;
import type { Page } from '@/domain/shared/entity';
import type { CacheClass } from '@/platform/query/cachePolicy';
import type { OwnerType } from '@/domain/customFields/schema';
import { getStoreId } from '@/platform/merchant';

export type CommandId = `${string}.${string}`;
import type { Permission } from '@/platform/permissions';
export type { Permission };
export type ComponentId = string; // custom cell / section; surfaces resolve it in features/components.ts
export type Tone = 'success' | 'warning' | 'critical' | 'info' | 'neutral';
export interface Option {
  value: string;
  label: string;
}

// ── Data access ───────────────────────────────────────────
export interface ListParams {
  view?: string;
  search?: string;
  filters: Record<string, unknown>; // filter id → value; each filter's toQuery types it
  scope?: Record<string, string>; // required scope (location) or relation scope (customerId)
  sort?: { field: string; direction: 'asc' | 'desc' };
  page: number; // 1-based
  limit: number;
}
export interface Opts {
  signal?: AbortSignal;
}
export interface DataProvider<T, TItem> {
  cache: CacheClass; // required; the scaffolder refuses to generate without it
  getList(params: ListParams, opts: Opts): Promise<Page<TItem>>;
  getOne(id: string, opts: Opts): Promise<T>;
  getMany?(ids: string[], opts: Opts): Promise<TItem[]>; // pickers, references
  search?(text: string, limit: number, opts: Opts): Promise<TItem[]>;
}

/** Query keys: [domain, storeId, …]. storeId is read at call time so a store switch changes every key. */
export const keysFor = (name: string) => ({
  all: () => [name, getStoreId()] as const,
  lists: () => [name, getStoreId(), 'list'] as const,
  list: (p: ListParams) => [name, getStoreId(), 'list', p] as const,
  details: () => [name, getStoreId(), 'detail'] as const,
  detail: (id: string) => [name, getStoreId(), 'detail', id] as const,
  calc: (input: unknown) => [name, getStoreId(), 'calc', input] as const, // server calculations (cache class 'calc')
});
export type QueryKeys = ReturnType<typeof keysFor>;

// ── List ──────────────────────────────────────────────────
export type CellSpec =
  | { kind: 'text' | 'count'; value: string | number | undefined }
  | { kind: 'money'; value: { minor: number; currency: string } | undefined }
  | { kind: 'date'; value: string | undefined }
  | { kind: 'status'; value: string; tone: Tone }
  | { kind: 'image_title'; value: string; image?: string }
  | { component: ComponentId };
export interface Column<TItem> {
  id: string;
  header: string;
  cell?: (row: TItem) => CellSpec;
  hidden?: boolean;
  sortKey?: string;
}
export interface ConditionField {
  field: string;
  type: 'text' | 'number' | 'money' | 'date' | 'boolean' | 'tags';
}
export type Filter = { id: string; label: string; toQuery: (value: unknown) => Record<string, unknown>; mode?: 'server' | 'client' } & (
  | { type: 'enum' | 'multi_enum'; options: Option[] | (() => Promise<Option[]>) }
  | { type: 'text' }
  | { type: 'number_range' } // "min..max" in the URL
  | { type: 'money_range' } // entered in rupees, becomes Money
  | { type: 'date_range' } // local days, { from, to } DateOnly
  | { type: 'conditions'; fields: ConditionField[] }
);
export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
  label?: string;
}
export interface ScopeSelector {
  param: string;
  source: () => Promise<Option[]>;
  required: boolean;
}
export interface View {
  id: string;
  label: string;
  query?: Record<string, unknown>;
}
export interface ListConfig<TItem> {
  scope?: ScopeSelector; // inventory: a location must be chosen
  columns: Column<TItem>[];
  defaultColumns?: string[];
  search?: { placeholder: string; debounceMs: number; minLength?: (q: string) => boolean; mode?: 'server' | 'client' };
  filters?: Filter[];
  views?: { source: 'static'; items: View[]; mode?: 'server' | 'client' };
  sort?:
    { source: 'static'; options: SortOption[]; default: SortOption } | { source: 'server'; default: SortOption } | { source: 'column' };
  pageSize: number;
  selection?: { enabled: boolean; max?: number };
  cellEdit?: { cells: string[]; command: CommandId }; // inventory: per-cell popover, immediate save
  insights?: { component: ComponentId; capability: string };
  rowLink?: 'detail' | ((r: TItem) => string) | false;
  empty: { title: string; body?: string; action?: CommandId };
}

/** Builds the typed query a list function takes: view query + each filter's toQuery + search/page. Domain names only. */
export const queryFromParams = <TItem>(list: ListConfig<TItem>, p: ListParams): Record<string, unknown> => {
  const view = list.views?.items.find((v) => v.id === p.view);
  const fromFilters = Object.entries(p.filters).reduce<Record<string, unknown>>((acc, [id, value]) => {
    const f = list.filters?.find((x) => x.id === id);
    return f && value !== undefined && value !== '' ? { ...acc, ...f.toQuery(value) } : acc;
  }, {});
  return {
    ...(view?.query ?? {}),
    ...fromFilters,
    ...(p.scope ?? {}),
    ...(p.sort ? { sort: p.sort } : {}),
    search: p.search || undefined,
    page: p.page,
    limit: p.limit,
  };
};

// ── Editor ────────────────────────────────────────────────
export type FieldType =
  | 'text'
  | 'textarea'
  | 'rich_text'
  | 'number'
  | 'money'
  | 'percent'
  | 'select'
  | 'multi_select'
  | 'tags'
  | 'boolean'
  | 'date'
  | 'image'
  | 'media_list'
  | 'reference'
  | 'phone';
export type Path<TInput> = Extract<keyof TInput, string>;
export interface FieldSpec<TInput> {
  path: Path<TInput>;
  label: string;
  type: FieldType;
  help?: string;
  options?: Option[];
  readOnly?: boolean | ((d: TInput) => boolean);
  visibleWhen?: (d: TInput) => boolean;
}
export type Section<TInput> =
  | { id: string; title: string; fields: FieldSpec<TInput>[]; visibleWhen?: (d: TInput) => boolean; collapsible?: boolean }
  | { id: string; title?: string; component: ComponentId; visibleWhen?: (d: TInput) => boolean };
/** Prefill sources for a create route: duplicate (sourceId + the loaded source), selected rows, a customer. */
export interface CreateContext {
  sourceId?: string;
  source?: unknown;
  selection?: { resource: string; rows: unknown[] };
  customerId?: string;
}
export interface ChildConfig {
  path: string; // "variants", "lineItems", "addresses"
  columns: Column<unknown>[];
  editable?: string[];
  preview?: number; // rows before "View all"
  subRoute?: string;
  pageSize?: number; // server-paged children (collection products: 50)
  blockPagingWhenDirty?: boolean;
}
export interface EditorConfig<T, TInput> {
  toInput: (record: T) => TInput;
  layout: { main: Section<TInput>[]; aside?: Section<TInput>[] };
  readOnlyWhen?: (r: T) => boolean; // draft order completed
  header?: { status?: (d: TInput) => { label: string; tone: Tone } };
  save: CommandId;
  create?: { route: string; initial: (ctx: CreateContext) => TInput; command: CommandId };
  calculate?: { query: (d: TInput) => Promise<unknown>; debounceMs: number; skipWhen?: (d: TInput) => boolean };
  children?: Record<string, ChildConfig>;
}

export interface DetailConfig<T> {
  layout: { main: Section<T>[]; aside?: Section<T>[] };
  pager?: (r: T) => { previous?: string; next?: string }; // orders: from the API; j/k keys
  editRoute?: (r: T) => string;
}

// ── Resource ──────────────────────────────────────────────
export interface ResourceDefinition<T, TItem = T, TInput = unknown> {
  name: string;
  label: { singular: string; plural: string };
  icon: string;
  title: (r: T | TItem) => string;
  service: 'dashboard' | 'os-order' | 'item' | 'inventory' | 'os-customer' | 'discount' | 'bulk-ops' | 'media-apps';
  schema: { detail: Schema<T>; item: Schema<TItem>; input?: Schema<TInput> };
  data: DataProvider<T, TItem>;
  keys: QueryKeys;
  routes: { list: string; detail?: string; create?: string; sub?: Record<string, string> };
  kind?: 'collection' | 'singleton';
  list?: ListConfig<TItem>;
  detail?: DetailConfig<T>; // read view with actions (orders)
  editor?: EditorConfig<T, TInput>;
  quickCreate?: { fields: Path<TInput>[]; command: CommandId };
  relations?: Record<string, { resource: string; kind: 'one' | 'many'; via: string }>;
  customFields?: { ownerType: OwnerType; placement: 'main' | 'aside'; readOnly?: boolean };
  extensionTargets?: string[];
  commands?: {
    primary?: (r: T) => CommandId | undefined;
    row?: CommandId[];
    bulk?: CommandId[];
    page?: CommandId[];
    more?: (r: T) => CommandId[];
  };
  search?: { enabled: boolean; limit?: number };
  nav?: { group: string; position: number; parent?: string; badge?: { params: Partial<ListParams>; cap?: number } };
  permissions: { read: Permission; write?: Permission };
  capability?: string;
  assistant?: { description: string; readableFields: string[]; listParams?: Schema<unknown> };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyResource = ResourceDefinition<any, any, any>;
export const defineResource = <T, TItem, TInput>(def: ResourceDefinition<T, TItem, TInput>) => def;

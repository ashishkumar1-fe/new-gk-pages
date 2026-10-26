import { defineResource, keysFor, queryFromParams, type ListConfig } from './define';
import {
  InventorySchema,
  InventoryListItemSchema,
  InventoryInputSchema,
  type Inventory,
  type InventoryListItem,
  type InventoryInput,
} from '@/domain/inventory/schema';
import { api } from '@/api';
import type { Page } from '@/domain/shared/entity';

/** Target spec: docs/architecture/resources/defs/inventory.md. Confirmed when real code agrees (build order). */
const get = (r: unknown, path: string) =>
  path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), r);

const list: ListConfig<InventoryListItem> = {
  columns: [
    { id: 'available', header: 'Available', cell: (r) => ({ kind: 'count', value: get(r, 'available') as never }) },
    { id: 'committed', header: 'Committed', cell: (r) => ({ kind: 'count', value: get(r, 'committed') as never }) },
    { id: 'onHand', header: 'On hand', cell: (r) => ({ kind: 'count', value: get(r, 'onHand') as never }) },
    { id: 'incoming', header: 'Incoming', cell: (r) => ({ kind: 'count', value: get(r, 'incoming') as never }) },
  ],
  search: { placeholder: 'Search inventory', debounceMs: 500 },
  views: {
    source: 'static',
    items: [
      { id: 'all', label: 'All', query: {} },
      { id: 'incoming', label: 'Incoming', query: { incomingMin: 1 } },
    ],
  },
  pageSize: 50,
  selection: { enabled: true },
  cellEdit: { cells: ['available'], command: 'inventory.adjust' },
  empty: { title: 'No inventory yet' },
};

export const inventory = defineResource<Inventory, InventoryListItem, InventoryInput>({
  name: 'inventory',
  label: { singular: 'Inventory', plural: 'Inventory' },
  icon: 'boxes',
  title: (r) => String(get(r, 'available') ?? r.id),
  service: 'inventory',
  schema: { detail: InventorySchema, item: InventoryListItemSchema, input: InventoryInputSchema },
  data: {
    cache: 'list',
    getList: (p, o) => api.inventory.listLevels(queryFromParams(list, p), o) as unknown as Promise<Page<InventoryListItem>>,
    getOne: (id, o) => api.inventory.listLevels(id, o) as unknown as Promise<Inventory>,
  },
  keys: keysFor('inventory'),
  routes: { list: '/inventory' },
  list,
  commands: {
    page: ['inventory.import', 'inventory.export'],
    bulk: ['inventory.bulkEdit'],
    row: [],
    more: () => [],
  },
  search: { enabled: false, limit: 4 },
  nav: { group: 'Products', position: 3, parent: 'product' },
  permissions: { read: 'read_inventory', write: 'write_inventory' },
  assistant: { description: 'Stock per SKU and location.', readableFields: ['available', 'committed', 'onHand', 'incoming'] },
});

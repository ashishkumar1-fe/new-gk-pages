import { defineResource, keysFor, queryFromParams, type ListConfig } from './define';
import {
  CollectionSchema,
  CollectionListItemSchema,
  CollectionInputSchema,
  type Collection,
  type CollectionListItem,
  type CollectionInput,
} from '@/domain/collection/schema';
import { api } from '@/api';
import type { Page } from '@/domain/shared/entity';

/** Target spec: docs/architecture/resources/defs/collection.md. Confirmed when real code agrees (build order). */
const get = (r: unknown, path: string) =>
  path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), r);

const list: ListConfig<CollectionListItem> = {
  columns: [
    { id: 'collection', header: 'Collection', cell: (r) => ({ kind: 'text', value: get(r, 'title') as never }) },
    { id: 'products', header: 'Products', cell: (r) => ({ kind: 'count', value: get(r, 'productsCount') as never }) },
    { id: 'status', header: 'Status', cell: (r) => ({ kind: 'text', value: get(r, 'published') as never }) },
    { id: 'type', header: 'Type', cell: (r) => ({ kind: 'text', value: get(r, 'kind') as never }) },
  ],
  search: { placeholder: 'Search collections', debounceMs: 500 },
  filters: [
    {
      id: 'type',
      label: 'Type',
      type: 'multi_enum',
      options: [
        { value: 'manual', label: 'manual' },
        { value: 'smart', label: 'smart' },
      ],
      toQuery: (v) => ({ kinds: v }),
    },
  ],
  views: {
    source: 'static',
    items: [
      { id: 'all', label: 'All', query: {} },
      { id: 'published', label: 'Published', query: { published: true } },
      { id: 'draft', label: 'Draft', query: { published: false } },
    ],
  },
  pageSize: 50,
  selection: { enabled: true },
  empty: { title: 'No collections yet' },
};

export const collection = defineResource<Collection, CollectionListItem, CollectionInput>({
  name: 'collection',
  label: { singular: 'Collection', plural: 'Collections' },
  icon: 'folder',
  title: (r) => String(get(r, 'title') ?? r.id),
  service: 'item',
  schema: { detail: CollectionSchema, item: CollectionListItemSchema, input: CollectionInputSchema },
  data: {
    cache: 'list',
    getList: (p, o) => api.item.listCollections(queryFromParams(list, p), o) as unknown as Promise<Page<CollectionListItem>>,
    getOne: (id, o) => api.item.getCollection(id, o) as unknown as Promise<Collection>,
  },
  keys: keysFor('collection'),
  routes: { list: '/collections', detail: '/collections/$id', create: '/collections/new' },
  list,
  editor: {
    toInput: (rec) => ({ ...rec }),
    layout: {
      main: [
        {
          id: 'details',
          title: 'Collection details',
          fields: [
            { path: 'title', label: 'Title', type: 'text' },
            { path: 'description', label: 'Description', type: 'textarea' },
          ],
        },
      ],
    },
    save: 'collection.update',
    create: { route: '/collections/new', initial: () => ({}), command: 'collection.create' },
  },
  commands: {
    page: ['collection.create'],
    bulk: ['collection.bulkEdit', 'collection.setPublished', 'collection.bulkDelete'],
    row: ['collection.copyLink'],
    more: () => ['collection.delete'],
  },
  search: { enabled: true, limit: 4 },
  nav: { group: 'Products', position: 2, parent: 'product' },
  permissions: { read: 'read_products', write: 'write_products' },
  assistant: { description: 'Groups of products, manual or rule-based.', readableFields: ['title', 'productsCount', 'published', 'kind'] },
});

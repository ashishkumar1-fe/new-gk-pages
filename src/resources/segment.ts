import { defineResource, keysFor, queryFromParams, type ListConfig } from './define';
import {
  SegmentSchema,
  SegmentListItemSchema,
  SegmentInputSchema,
  type Segment,
  type SegmentListItem,
  type SegmentInput,
} from '@/domain/segment/schema';
import { api } from '@/api';
import type { Page } from '@/domain/shared/entity';

/** Target spec: docs/architecture/resources/defs/segment.md. Confirmed when real code agrees (build order). */
const get = (r: unknown, path: string) =>
  path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), r);

const list: ListConfig<SegmentListItem> = {
  columns: [
    { id: 'name', header: 'Name', cell: (r) => ({ kind: 'text', value: get(r, 'name') as never }) },
    { id: 'description', header: 'Description', cell: (r) => ({ kind: 'text', value: get(r, 'description') as never }) },
    { id: 'updated', header: 'Updated', cell: (r) => ({ kind: 'date', value: get(r, 'updatedAt') as never }) },
  ],
  search: { placeholder: 'Search segments', debounceMs: 500 },
  pageSize: 50,
  selection: { enabled: false },
  empty: { title: 'No segments yet' },
};

export const segment = defineResource<Segment, SegmentListItem, SegmentInput>({
  name: 'segment',
  label: { singular: 'Segment', plural: 'Segments' },
  icon: 'users',
  title: (r) => String(get(r, 'name') ?? r.id),
  service: 'os-customer',
  schema: { detail: SegmentSchema, item: SegmentListItemSchema, input: SegmentInputSchema },
  data: {
    cache: 'list',
    getList: (p, o) => api.osCustomer.listSegments(queryFromParams(list, p), o) as unknown as Promise<Page<SegmentListItem>>,
    getOne: (id, o) => api.osCustomer.getSegment(id, o) as unknown as Promise<Segment>,
  },
  keys: keysFor('segment'),
  routes: { list: '/segments', detail: '/segments/$id', create: '/segments/new' },
  list,
  editor: {
    toInput: (rec) => ({ ...rec }),
    layout: {
      main: [
        {
          id: 'details',
          title: 'Segment details',
          fields: [
            { path: 'name', label: 'Name', type: 'text' },
            { path: 'description', label: 'Description', type: 'textarea' },
          ],
        },
      ],
    },
    save: 'segment.update',
    create: { route: '/segments/new', initial: () => ({}), command: 'segment.create' },
  },
  commands: {
    page: ['segment.create'],
    bulk: [],
    row: ['segment.delete'],
    more: () => [],
  },
  search: { enabled: true, limit: 4 },
  nav: { group: 'Customers', position: 2, parent: 'customer' },
  permissions: { read: 'read_customers', write: 'write_customers' },
  assistant: { description: 'Saved groups of customers by conditions.', readableFields: ['name', 'description', 'updatedAt'] },
});

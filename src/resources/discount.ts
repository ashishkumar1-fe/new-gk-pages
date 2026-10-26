import { defineResource, keysFor, queryFromParams, type ListConfig } from './define';
import {
  DiscountSchema,
  DiscountListItemSchema,
  DiscountInputSchema,
  type Discount,
  type DiscountListItem,
  type DiscountInput,
} from '@/domain/discount/schema';
import { api } from '@/api';
import type { Page } from '@/domain/shared/entity';

/** Target spec: docs/architecture/resources/defs/discount.md. Confirmed when real code agrees (build order). */
const get = (r: unknown, path: string) =>
  path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), r);

const list: ListConfig<DiscountListItem> = {
  columns: [
    { id: 'discount', header: 'Discount', cell: (r) => ({ kind: 'text', value: get(r, 'title') as never }) },
    { id: 'status', header: 'Status', cell: (r) => ({ kind: 'text', value: get(r, 'status') as never }) },
    { id: 'code', header: 'Code', cell: (r) => ({ kind: 'text', value: get(r, 'code') as never }) },
    { id: 'starts', header: 'Start date', cell: (r) => ({ kind: 'date', value: get(r, 'startsAt') as never }) },
    { id: 'ends', header: 'End date', cell: (r) => ({ kind: 'date', value: get(r, 'endsAt') as never }) },
  ],
  search: { placeholder: 'Search by code or title', debounceMs: 500 },
  views: {
    source: 'static',
    items: [
      { id: 'all', label: 'All', query: {} },
      { id: 'published', label: 'Published', query: { status: 'published' } },
      { id: 'draft', label: 'Draft', query: { status: 'draft' } },
      { id: 'inactive', label: 'Inactive', query: { status: 'inactive' } },
    ],
  },
  pageSize: 50,
  selection: { enabled: false },
  empty: { title: 'No discounts yet' },
};

export const discount = defineResource<Discount, DiscountListItem, DiscountInput>({
  name: 'discount',
  label: { singular: 'Discount', plural: 'Discounts' },
  icon: 'tag',
  title: (r) => String(get(r, 'title') ?? r.id),
  service: 'discount',
  schema: { detail: DiscountSchema, item: DiscountListItemSchema, input: DiscountInputSchema },
  data: {
    cache: 'list',
    getList: (p, o) => api.discount.fetchDiscounts(queryFromParams(list, p), o) as unknown as Promise<Page<DiscountListItem>>,
    getOne: (id, o) => api.discount.getDiscount(id, o) as unknown as Promise<Discount>,
  },
  keys: keysFor('discount'),
  routes: { list: '/discounts', detail: '/discounts/$id', create: '/discounts/new' },
  list,
  editor: {
    toInput: (rec) => ({ ...rec }),
    layout: {
      main: [
        {
          id: 'details',
          title: 'Discount details',
          fields: [
            { path: 'title', label: 'Title', type: 'text' },
            { path: 'code', label: 'Code', type: 'text' },
          ],
        },
      ],
    },
    save: 'discount.update',
    create: { route: '/discounts/new', initial: () => ({}), command: 'discount.create' },
  },
  commands: {
    page: ['discount.createWithAssistant', 'discount.create'],
    bulk: [],
    row: ['discount.publish', 'discount.moveToDraft', 'discount.markInactive'],
    more: () => [],
  },
  search: { enabled: true, limit: 4 },
  nav: { group: 'Discounts', position: 1 },
  permissions: { read: 'read_discounts', write: 'write_discounts' },
  assistant: { description: 'Discount codes and automatic discounts.', readableFields: ['title', 'status', 'code', 'startsAt', 'endsAt'] },
});

import { defineResource, keysFor, queryFromParams, type ListConfig } from './define';
import {
  DiscountSetSchema,
  DiscountSetListItemSchema,
  DiscountSetInputSchema,
  type DiscountSet,
  type DiscountSetListItem,
  type DiscountSetInput,
} from '@/domain/discountSet/schema';
import { api } from '@/api';
import type { Page } from '@/domain/shared/entity';

/** Target spec: docs/architecture/resources/defs/discount.md. Confirmed when real code agrees (build order). */
const get = (r: unknown, path: string) =>
  path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), r);

const list: ListConfig<DiscountSetListItem> = {
  columns: [
    { id: 'title', header: 'Discount set', cell: (r) => ({ kind: 'text', value: get(r, 'title') as never }) },
    { id: 'status', header: 'Status', cell: (r) => ({ kind: 'text', value: get(r, 'status') as never }) },
    { id: 'codes', header: 'Codes', cell: (r) => ({ kind: 'count', value: get(r, 'bulkCampaign.totalCodes') as never }) },
  ],
  search: { placeholder: 'Search discount sets', debounceMs: 500 },
  pageSize: 50,
  selection: { enabled: false },
  empty: { title: 'No discount sets yet' },
};

export const discountSet = defineResource<DiscountSet, DiscountSetListItem, DiscountSetInput>({
  name: 'discountSet',
  label: { singular: 'Discount set', plural: 'Discount sets' },
  icon: 'tags',
  title: (r) => String(get(r, 'title') ?? r.id),
  service: 'discount',
  schema: { detail: DiscountSetSchema, item: DiscountSetListItemSchema, input: DiscountSetInputSchema },
  data: {
    cache: 'list',
    getList: (p, o) => api.discount.fetchDiscounts(queryFromParams(list, p), o) as unknown as Promise<Page<DiscountSetListItem>>,
    getOne: (id, o) => api.discount.getDiscount(id, o) as unknown as Promise<DiscountSet>,
  },
  keys: keysFor('discountSet'),
  routes: { list: '/discount-sets', detail: '/discount-sets/$id', create: '/discount-sets/new' },
  list,
  editor: {
    toInput: (rec) => ({ ...rec }),
    layout: { main: [{ id: 'details', title: 'Discount set details', fields: [{ path: 'title', label: 'Title', type: 'text' }] }] },
    save: 'discountSet.update',
    create: { route: '/discount-sets/new', initial: () => ({}), command: 'discountSet.create' },
  },
  commands: {
    page: ['discountSet.create'],
    bulk: [],
    row: [],
    more: () => ['discountSet.downloadCodes'],
  },
  search: { enabled: false, limit: 4 },
  nav: { group: 'Discounts', position: 2, parent: 'discount' },
  permissions: { read: 'read_discounts', write: 'write_discounts' },
  assistant: { description: 'Bulk-generated discount codes.', readableFields: ['title', 'status', 'bulkCampaign.totalCodes'] },
});

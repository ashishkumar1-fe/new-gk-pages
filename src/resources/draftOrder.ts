import { defineResource, keysFor, queryFromParams, type ListConfig } from './define';
import {
  DraftOrderSchema,
  DraftOrderListItemSchema,
  DraftOrderInputSchema,
  type DraftOrder,
  type DraftOrderListItem,
  type DraftOrderInput,
} from '@/domain/draftOrder/schema';
import { api } from '@/api';
import type { Page } from '@/domain/shared/entity';

/** Target spec: docs/architecture/resources/defs/draft-order.md. Confirmed when real code agrees (build order). */
const get = (r: unknown, path: string) =>
  path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), r);

const list: ListConfig<DraftOrderListItem> = {
  columns: [
    { id: 'number', header: 'Draft #', cell: (r) => ({ kind: 'text', value: get(r, 'number') as never }) },
    { id: 'status', header: 'Status', cell: (r) => ({ kind: 'text', value: get(r, 'status') as never }) },
    { id: 'total', header: 'Total', cell: (r) => ({ kind: 'money', value: get(r, 'totals.total') as never }) },
    { id: 'date', header: 'Date', cell: (r) => ({ kind: 'date', value: get(r, 'createdAt') as never }) },
  ],
  search: { placeholder: 'Search draft orders', debounceMs: 500 },
  filters: [
    {
      id: 'status',
      label: 'Status',
      type: 'enum',
      options: [
        { value: 'open', label: 'open' },
        { value: 'invoice_sent', label: 'invoice_sent' },
        { value: 'completed', label: 'completed' },
      ],
      toQuery: (v) => ({ status: v }),
    },
  ],
  pageSize: 50,
  selection: { enabled: true },
  empty: { title: 'No draft orders yet' },
};

export const draftOrder = defineResource<DraftOrder, DraftOrderListItem, DraftOrderInput>({
  name: 'draftOrder',
  label: { singular: 'Draft order', plural: 'Draft orders' },
  icon: 'file',
  title: (r) => String(get(r, 'number') ?? r.id),
  service: 'os-order',
  schema: { detail: DraftOrderSchema, item: DraftOrderListItemSchema, input: DraftOrderInputSchema },
  data: {
    cache: 'list',
    getList: (p, o) => api.osOrder.listDraftOrders(queryFromParams(list, p), o) as unknown as Promise<Page<DraftOrderListItem>>,
    getOne: (id, o) => api.osOrder.getDraftOrder(id, o) as unknown as Promise<DraftOrder>,
  },
  keys: keysFor('draftOrder'),
  routes: { list: '/draft-orders', detail: '/draft-orders/$id', create: '/draft-orders/new' },
  list,
  editor: {
    toInput: (rec) => ({ ...rec }),
    layout: { main: [{ id: 'details', title: 'Draft order details', fields: [{ path: 'note', label: 'Note', type: 'textarea' }] }] },
    save: 'draftOrder.update',
    create: { route: '/draft-orders/new', initial: () => ({}), command: 'draftOrder.create' },
  },
  commands: {
    page: ['draftOrder.export', 'draftOrder.create'],
    bulk: ['draftOrder.bulkTags', 'draftOrder.bulkDelete'],
    row: [],
    more: () => ['draftOrder.sendInvoice', 'draftOrder.duplicate', 'draftOrder.delete'],
  },
  search: { enabled: true, limit: 4 },
  nav: { group: 'Orders', position: 2, parent: 'order' },
  permissions: { read: 'read_orders', write: 'write_orders' },
  assistant: { description: 'Orders created by staff before payment.', readableFields: ['number', 'status', 'totals.total', 'createdAt'] },
});

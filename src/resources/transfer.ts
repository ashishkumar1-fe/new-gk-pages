import { defineResource, keysFor, queryFromParams, type ListConfig } from './define';
import {
  TransferSchema,
  TransferListItemSchema,
  TransferInputSchema,
  type Transfer,
  type TransferListItem,
  type TransferInput,
} from '@/domain/transfer/schema';
import { api } from '@/api';
import type { Page } from '@/domain/shared/entity';

/** Target spec: docs/architecture/resources/defs/transfer.md. Confirmed when real code agrees (build order). */
const get = (r: unknown, path: string) =>
  path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), r);

const list: ListConfig<TransferListItem> = {
  columns: [
    { id: 'number', header: 'Transfer', cell: (r) => ({ kind: 'text', value: get(r, 'referenceNumber') as never }) },
    { id: 'status', header: 'Status', cell: (r) => ({ kind: 'text', value: get(r, 'status') as never }) },
    { id: 'expected', header: 'Expected arrival', cell: (r) => ({ kind: 'date', value: get(r, 'expectedAt') as never }) },
  ],
  search: { placeholder: 'Search transfers', debounceMs: 500 },
  views: {
    source: 'static',
    items: [
      { id: 'all', label: 'All', query: {} },
      { id: 'draft', label: 'Draft', query: { status: 'draft' } },
      { id: 'pending', label: 'Pending', query: { status: 'pending' } },
      { id: 'received', label: 'Received', query: { status: 'received' } },
    ],
  },
  pageSize: 50,
  selection: { enabled: true },
  empty: { title: 'No transfers yet' },
};

export const transfer = defineResource<Transfer, TransferListItem, TransferInput>({
  name: 'transfer',
  label: { singular: 'Transfer', plural: 'Transfers' },
  icon: 'arrow-right-left',
  title: (r) => String(get(r, 'referenceNumber') ?? r.id),
  service: 'inventory',
  schema: { detail: TransferSchema, item: TransferListItemSchema, input: TransferInputSchema },
  data: {
    cache: 'list',
    getList: (p, o) => api.inventory.listTransfers(queryFromParams(list, p), o) as unknown as Promise<Page<TransferListItem>>,
    getOne: (id, o) => api.inventory.getTransfer(id, o) as unknown as Promise<Transfer>,
  },
  keys: keysFor('transfer'),
  routes: { list: '/transfers', detail: '/transfers/$id', create: '/transfers/new' },
  list,
  editor: {
    toInput: (rec) => ({ ...rec }),
    layout: {
      main: [
        {
          id: 'details',
          title: 'Transfer details',
          fields: [
            { path: 'referenceNumber', label: 'Reference', type: 'text' },
            { path: 'note', label: 'Note', type: 'textarea' },
          ],
        },
      ],
    },
    save: 'transfer.update',
    create: { route: '/transfers/new', initial: () => ({}), command: 'transfer.create' },
  },
  commands: {
    primary: (r) =>
      r.status === 'draft'
        ? 'transfer.markPending'
        : ['pending', 'partially_received'].includes(r.status)
          ? 'transfer.openReceive'
          : undefined,
    page: ['transfer.create'],
    bulk: [],
    row: [],
    more: () => ['transfer.delete'],
  },
  search: { enabled: true, limit: 4 },
  nav: { group: 'Products', position: 5, parent: 'product' },
  permissions: { read: 'read_inventory', write: 'write_inventory' },
  assistant: { description: 'Stock moved between locations.', readableFields: ['referenceNumber', 'status', 'expectedAt'] },
});

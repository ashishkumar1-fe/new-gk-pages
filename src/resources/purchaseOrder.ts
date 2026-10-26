import { defineResource, keysFor, queryFromParams, type ListConfig } from './define';
import {
  PurchaseOrderSchema,
  PurchaseOrderListItemSchema,
  PurchaseOrderInputSchema,
  type PurchaseOrder,
  type PurchaseOrderListItem,
  type PurchaseOrderInput,
} from '@/domain/purchaseOrder/schema';
import { api } from '@/api';
import type { Page } from '@/domain/shared/entity';

/** Target spec: docs/architecture/resources/defs/purchase-order.md. Confirmed when real code agrees (build order). */
const get = (r: unknown, path: string) =>
  path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), r);

const list: ListConfig<PurchaseOrderListItem> = {
  columns: [
    { id: 'number', header: 'Purchase order', cell: (r) => ({ kind: 'text', value: get(r, 'referenceNumber') as never }) },
    { id: 'supplier', header: 'Supplier', cell: (r) => ({ kind: 'text', value: get(r, 'supplier.companyName') as never }) },
    { id: 'status', header: 'Status', cell: (r) => ({ kind: 'text', value: get(r, 'status') as never }) },
    { id: 'total', header: 'Total', cell: (r) => ({ kind: 'money', value: get(r, 'totalCost') as never }) },
    { id: 'expected', header: 'Expected arrival', cell: (r) => ({ kind: 'date', value: get(r, 'expectedAt') as never }) },
  ],
  search: { placeholder: 'Search purchase orders', debounceMs: 500 },
  views: {
    source: 'static',
    items: [
      { id: 'all', label: 'All', query: {} },
      { id: 'draft', label: 'Draft', query: { status: 'draft' } },
      { id: 'ordered', label: 'Ordered', query: { status: 'ordered' } },
      { id: 'received', label: 'Received', query: { status: 'received' } },
    ],
  },
  pageSize: 50,
  selection: { enabled: true },
  empty: { title: 'No purchase orders yet' },
};

export const purchaseOrder = defineResource<PurchaseOrder, PurchaseOrderListItem, PurchaseOrderInput>({
  name: 'purchaseOrder',
  label: { singular: 'Purchase order', plural: 'Purchase orders' },
  icon: 'clipboard',
  title: (r) => String(get(r, 'referenceNumber') ?? r.id),
  service: 'inventory',
  schema: { detail: PurchaseOrderSchema, item: PurchaseOrderListItemSchema, input: PurchaseOrderInputSchema },
  data: {
    cache: 'list',
    getList: (p, o) => api.inventory.listPurchaseOrders(queryFromParams(list, p), o) as unknown as Promise<Page<PurchaseOrderListItem>>,
    getOne: (id, o) => api.inventory.getPurchaseOrder(id, o) as unknown as Promise<PurchaseOrder>,
  },
  keys: keysFor('purchaseOrder'),
  routes: { list: '/purchase-orders', detail: '/purchase-orders/$id', create: '/purchase-orders/new' },
  list,
  editor: {
    toInput: (rec) => ({ ...rec }),
    layout: {
      main: [
        {
          id: 'details',
          title: 'Purchase order details',
          fields: [
            { path: 'referenceNumber', label: 'Reference', type: 'text' },
            { path: 'expectedAt', label: 'Expected arrival', type: 'text' },
          ],
        },
      ],
    },
    save: 'purchaseOrder.update',
    create: { route: '/purchase-orders/new', initial: () => ({}), command: 'purchaseOrder.create' },
  },
  commands: {
    primary: (r) => (r.status === 'draft' ? 'purchaseOrder.markOrdered' : r.status !== 'closed' ? 'purchaseOrder.openReceive' : undefined),
    page: ['purchaseOrder.create'],
    bulk: [],
    row: [],
    more: () => ['purchaseOrder.close', 'purchaseOrder.reopen', 'purchaseOrder.delete'],
  },
  search: { enabled: true, limit: 4 },
  nav: { group: 'Products', position: 4, parent: 'product' },
  permissions: { read: 'read_inventory', write: 'write_inventory' },
  assistant: {
    description: 'Stock ordered from suppliers.',
    readableFields: ['referenceNumber', 'supplier.companyName', 'status', 'totalCost', 'expectedAt'],
  },
});

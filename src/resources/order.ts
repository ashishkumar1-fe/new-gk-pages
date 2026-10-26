import { defineResource, keysFor, queryFromParams, type ListConfig } from './define';
import { OrderSchema, OrderListItemSchema, OrderInputSchema, type Order, type OrderListItem, type OrderInput } from '@/domain/order/schema';
import { api } from '@/api';
import type { Page } from '@/domain/shared/entity';

/** Target spec: docs/architecture/resources/defs/order.md. Confirmed when real code agrees (build order). */
const get = (r: unknown, path: string) =>
  path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), r);

const list: ListConfig<OrderListItem> = {
  columns: [
    { id: 'order', header: 'Order', cell: (r) => ({ kind: 'text', value: get(r, 'name') as never }) },
    { id: 'date', header: 'Date', cell: (r) => ({ kind: 'date', value: get(r, 'createdAt') as never }) },
    { id: 'customer', header: 'Customer', cell: (r) => ({ kind: 'text', value: get(r, 'customer.firstName') as never }) },
    { id: 'total', header: 'Total', cell: (r) => ({ kind: 'money', value: get(r, 'totals.total') as never }) },
    { id: 'payment', header: 'Payment status', cell: (r) => ({ kind: 'text', value: get(r, 'financialStatus') as never }) },
    { id: 'fulfillment', header: 'Fulfillment status', cell: (r) => ({ kind: 'text', value: get(r, 'fulfillmentStatus') as never }) },
  ],
  search: { placeholder: 'Search orders, customers, or products', debounceMs: 500 },
  filters: [
    {
      id: 'payment',
      label: 'Payment status',
      type: 'enum',
      options: [
        { value: 'paid', label: 'paid' },
        { value: 'partially_paid', label: 'partially_paid' },
        { value: 'pending', label: 'pending' },
        { value: 'refunded', label: 'refunded' },
        { value: 'voided', label: 'voided' },
      ],
      toQuery: (v) => ({ financialStatus: v }),
    },
    {
      id: 'fulfillment',
      label: 'Fulfillment status',
      type: 'enum',
      options: [
        { value: 'unfulfilled', label: 'unfulfilled' },
        { value: 'pending', label: 'pending' },
        { value: 'fulfilled', label: 'fulfilled' },
        { value: 'partially_fulfilled', label: 'partially_fulfilled' },
      ],
      toQuery: (v) => ({ fulfillmentStatus: v }),
    },
  ],
  pageSize: 50,
  selection: { enabled: true, max: 100 },
  empty: { title: 'No orders yet' },
};

export const order = defineResource<Order, OrderListItem, OrderInput>({
  name: 'order',
  label: { singular: 'Order', plural: 'Orders' },
  icon: 'receipt',
  title: (r) => String(get(r, 'name') ?? r.id),
  service: 'os-order',
  schema: { detail: OrderSchema, item: OrderListItemSchema, input: OrderInputSchema },
  data: {
    cache: 'list',
    getList: (p, o) => api.osOrder.listOrders(queryFromParams(list, p), o) as unknown as Promise<Page<OrderListItem>>,
    getOne: (id, o) => api.osOrder.getOrder(id, o) as unknown as Promise<Order>,
  },
  keys: keysFor('order'),
  routes: { list: '/orders', detail: '/orders/$id' },
  list,
  detail: { layout: { main: [{ id: 'summary', title: 'Summary', component: 'orderSummary' }] }, editRoute: (r) => `/orders/${r.id}/edit` },
  commands: {
    page: ['order.export', 'order.import', 'draftOrder.create'],
    bulk: ['order.bulkCancel', 'order.bulkTags', 'order.archive', 'order.unarchive', 'order.bulkFulfill'],
    row: ['order.fulfill', 'order.hold', 'order.releaseHold', 'order.updateTracking'],
    more: () => ['order.openStatusPage', 'order.duplicate', 'order.archive', 'refund.create', 'order.cancel'],
  },
  search: { enabled: true, limit: 4 },
  nav: { group: 'Orders', position: 1 },
  permissions: { read: 'read_orders', write: 'write_orders' },
  assistant: {
    description: 'Customer orders with payment and fulfillment status.',
    readableFields: ['name', 'createdAt', 'customer.firstName', 'totals.total', 'financialStatus', 'fulfillmentStatus'],
  },
});

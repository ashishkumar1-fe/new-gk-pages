import { defineResource, keysFor, queryFromParams, type ListConfig } from './define';
import {
  CustomerSchema,
  CustomerListItemSchema,
  CustomerInputSchema,
  type Customer,
  type CustomerListItem,
  type CustomerInput,
} from '@/domain/customer/schema';
import { api } from '@/api';
import type { Page } from '@/domain/shared/entity';

/** Target spec: docs/architecture/resources/defs/customer.md. Confirmed when real code agrees (build order). */
const get = (r: unknown, path: string) =>
  path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), r);

const list: ListConfig<CustomerListItem> = {
  columns: [
    { id: 'name', header: 'Name', cell: (r) => ({ kind: 'text', value: get(r, 'firstName') as never }) },
    { id: 'phone', header: 'Phone', cell: (r) => ({ kind: 'text', value: get(r, 'phone') as never }) },
    { id: 'orders', header: 'Orders', cell: (r) => ({ kind: 'count', value: get(r, 'stats.ordersCount') as never }) },
    { id: 'spent', header: 'Amount spent', cell: (r) => ({ kind: 'money', value: get(r, 'stats.amountSpent') as never }) },
  ],
  search: { placeholder: 'Search customers', debounceMs: 500 },
  filters: [{ id: 'tags', label: 'Tags', type: 'multi_enum', options: [], toQuery: (v) => ({ tags: v }) }],
  views: {
    source: 'static',
    items: [
      { id: 'all', label: 'All', query: {} },
      { id: 'email', label: 'Email subscribed', query: { marketingEmail: true } },
    ],
  },
  pageSize: 50,
  selection: { enabled: false },
  empty: { title: 'No customers yet' },
};

export const customer = defineResource<Customer, CustomerListItem, CustomerInput>({
  name: 'customer',
  label: { singular: 'Customer', plural: 'Customers' },
  icon: 'user',
  title: (r) => String(get(r, 'firstName') ?? r.id),
  service: 'os-customer',
  schema: { detail: CustomerSchema, item: CustomerListItemSchema, input: CustomerInputSchema },
  data: {
    cache: 'list',
    getList: (p, o) => api.osCustomer.filterCustomers(queryFromParams(list, p), o) as unknown as Promise<Page<CustomerListItem>>,
    getOne: (id, o) => api.osCustomer.getCustomer(id, o) as unknown as Promise<Customer>,
  },
  keys: keysFor('customer'),
  routes: { list: '/customers', detail: '/customers/$id', create: '/customers/new' },
  list,
  editor: {
    toInput: (rec) => ({ ...rec }),
    layout: {
      main: [
        {
          id: 'details',
          title: 'Customer details',
          fields: [
            { path: 'firstName', label: 'First name', type: 'text' },
            { path: 'lastName', label: 'Last name', type: 'text' },
            { path: 'email', label: 'Email', type: 'text' },
            { path: 'phone', label: 'Phone', type: 'text' },
            { path: 'note', label: 'Notes', type: 'textarea' },
          ],
        },
      ],
    },
    save: 'customer.update',
    create: { route: '/customers/new', initial: () => ({}), command: 'customer.create' },
  },
  commands: {
    page: ['customer.export', 'customer.create'],
    bulk: [],
    row: ['customer.setBlocked', 'customer.delete'],
    more: () => ['customer.setBlocked'],
  },
  search: { enabled: true, limit: 4 },
  nav: { group: 'Customers', position: 1 },
  permissions: { read: 'read_customers', write: 'write_customers' },
  assistant: {
    description: 'People who bought or signed up.',
    readableFields: ['firstName', 'phone', 'stats.ordersCount', 'stats.amountSpent'],
  },
});

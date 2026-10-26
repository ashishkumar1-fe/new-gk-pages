import { defineResource, keysFor, queryFromParams, type ListConfig } from './define';
import {
  LocationSchema,
  LocationListItemSchema,
  LocationInputSchema,
  type Location,
  type LocationListItem,
  type LocationInput,
} from '@/domain/location/schema';
import { api } from '@/api';
import type { Page } from '@/domain/shared/entity';

/** Target spec: docs/architecture/resources/defs/location.md. Confirmed when real code agrees (build order). */
const get = (r: unknown, path: string) =>
  path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), r);

const list: ListConfig<LocationListItem> = {
  columns: [
    { id: 'name', header: 'Name', cell: (r) => ({ kind: 'text', value: get(r, 'name') as never }) },
    { id: 'status', header: 'Status', cell: (r) => ({ kind: 'text', value: get(r, 'active') as never }) },
  ],
  pageSize: 50,
  selection: { enabled: true },
  empty: { title: 'No locations yet' },
};

export const location = defineResource<Location, LocationListItem, LocationInput>({
  name: 'location',
  label: { singular: 'Location', plural: 'Locations' },
  icon: 'map-pin',
  title: (r) => String(get(r, 'name') ?? r.id),
  service: 'inventory',
  schema: { detail: LocationSchema, item: LocationListItemSchema, input: LocationInputSchema },
  data: {
    cache: 'list',
    getList: (p, o) => api.inventory.listLocations(queryFromParams(list, p), o) as unknown as Promise<Page<LocationListItem>>,
    getOne: (id, o) => api.inventory.listLocations(id, o) as unknown as Promise<Location>,
  },
  keys: keysFor('location'),
  routes: { list: '/inventory/locations', detail: '/inventory/locations/$id', create: '/inventory/locations/new' },
  list,
  editor: {
    toInput: (rec) => ({ ...rec }),
    layout: {
      main: [
        {
          id: 'details',
          title: 'Location details',
          fields: [
            { path: 'name', label: 'Name', type: 'text' },
            { path: 'phone', label: 'Phone', type: 'text' },
          ],
        },
      ],
    },
    save: 'location.update',
    create: { route: '/inventory/locations/new', initial: () => ({}), command: 'location.create' },
  },
  commands: {
    page: ['location.create'],
    bulk: [],
    row: ['location.activate', 'location.deactivate', 'location.delete'],
    more: () => [],
  },
  search: { enabled: false, limit: 4 },
  permissions: { read: 'read_inventory', write: 'write_inventory' },
  assistant: { description: 'Warehouses and stores holding stock.', readableFields: ['name', 'active'] },
});

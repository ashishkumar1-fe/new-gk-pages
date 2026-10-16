# Segment

[← Resources](../README.md) · Schema: [customers.md](../../domain/customers.md#segment) · Today: `pages/customers/CustomerSegments.tsx`, `components/customers/SegmentForm.tsx`, `CustomersInSegment.tsx`

## List

```ts
list: {
  columns: [
    { id: 'name',        header: 'Name' },
    { id: 'description', header: 'Description' },
    { id: 'updated',     header: 'Updated', cell: date },
    { id: 'created',     header: 'Created', cell: date },
  ],
  search: { param: 'name', placeholder: 'Search segments', debounceMs: 300, mode: 'client' },   // as today: filters the loaded page
  pageSize: 50,                                 // sorted createdAt desc
  rowLink: (s) => `/segments/${s.id}/customers`,
  selection: { enabled: false },
  empty: { title: 'Create a segment', action: 'segment.create' },
}
```

## Editor

| Section | Fields |
|---|---|
| Details | name, description (both required) |
| Conditions | match AND / OR; rows of field, operator, value |

- Fields: totalSpent, tags, firstName, lastName, isDeleted, isActive, createdAt, updatedAt (`SegmentForm.tsx:319`); operators by field type (`:29`); comma-separated values split into lists (`:148`).
- Edit reads the saved AND / OR (today it resets to AND).
- `editor: { save: 'segment.update', create: { route: '/segments/new', command: 'segment.create' } }`

## Customers in segment (`/segments/$id/customers`)

Customer list scoped to the segment, sorted by amount spent (desc). Today's search and filters there are client-side; kept until the API supports them.

## Commands

```ts
commands: {
  page: ['segment.create'],
  row:  ['segment.delete'],
}
```

## Other

```ts
service:     'os-customer',
nav:         { group: 'customers', parent: 'customer', position: 2 },
permissions: { read: 'read_customers', write: 'write_customers' },
assistant:   { description: 'Saved groups of customers by conditions.', readableFields: ['name', 'description', 'conditions', 'customerCount'] },
```

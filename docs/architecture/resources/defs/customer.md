# Customer

[← Resources](../README.md) · Schema: [customers.md](../../domain/customers.md) · Today: `pages/customers/CustomerHome.tsx`, `components/customers/CreateCustomerForm.tsx`, `EditCustomer.tsx`

## List

```ts
list: {
  columns: [
    { id: 'name',     header: 'Name',               cell: fullName },          // link
    { id: 'phone',    header: 'Phone' },
    { id: 'location', header: 'Location',           cell: (c) => [c.defaultAddress?.province, c.defaultAddress?.country] },
    { id: 'orders',   header: 'Orders',             cell: (c) => c.stats.ordersCount },
    { id: 'spent',    header: 'Amount spent',       cell: (c) => money(c.stats.amountSpent) },
    { id: 'created',  header: 'Created At',         cell: date, hidden: true },
    { id: 'updated',  header: 'Updated At',         cell: date, hidden: true },
  ],
  search: { placeholder: 'Search customers', debounceMs: 500 },   // as today
  filters: [
    { id: 'tags', label: 'Tags', type: 'multi_enum', options: tagsLookup, toQuery: (v) => ({ tags: v }) },
  ],
  views: { source: 'static', items: [
    { id: 'all', label: 'All' },
    { id: 'email', label: 'Email subscribed', params: { filters: { marketingEmail: true } } },
  ] },
  // sort fixed: createdAt desc, as today
  pageSize: 50,
  selection: { enabled: false },          // no bulk actions today
  empty: { title: 'Add a customer', action: 'customer.create' },
}
```

Search: `customerSearch` ([domain](../../domain/customers.md#rules)); the module builds the conditions. Tag options come from the loaded page only, as today, until a tags lookup exists.

## Editor

| Column | Section | Fields / content | Notes |
|---|---|---|---|
| main | Overview | firstName, lastName, language, email, phone (+91), email and SMS consent | consent toggles disabled until email / phone entered |
| main | Addresses | addresses (child) | modal with address schema; delete runs `customer.deleteAddress` immediately |
| main | Custom fields | runtime fields | edit only |
| main | Orders | latest order, "Create order" (`draftOrder.createForCustomer`), "View all orders (n)" | edit only; links to orders scoped by `customerId` |
| main | Timeline | events and comments (`customer.comment`) | edit only |
| aside | Notes | ≤ 5000 chars | |
| aside | Tags | | |
| aside | Statistics | orders, amount spent, average order value | read-only |

- `editor: { save: 'customer.update', create: { route: '/customers/new', command: 'customer.create' } }`
Validation: `customerValidation` ([domain](../../domain/customers.md#rules)). Save and create steps: [commands](../../commands/defs/customers.md#customer).

## Commands

```ts
commands: {
  page: ['customer.export', 'customer.create'],
  row:  ['customer.setBlocked', 'customer.delete'],          // delete asks to confirm
  more: () => ['customer.setBlocked'],                        // "Create order" lives in the Orders card
}
```

## Other

```ts
service:      'os-customer',
relations:    { orders: { resource: 'order', kind: 'many', via: 'customerId' } },
search:       { enabled: true, limit: 4 },
nav:          { group: 'customers', position: 1 },
customFields: { ownerType: 'customer', placement: 'main' },
permissions:  { read: 'read_customers', write: 'write_customers' },
assistant:    { description: 'People who bought or signed up.', readableFields: ['firstName', 'lastName', 'email', 'phone', 'tags', 'stats.ordersCount', 'stats.amountSpent', 'stats.lastOrderAt', 'marketing'] },
```

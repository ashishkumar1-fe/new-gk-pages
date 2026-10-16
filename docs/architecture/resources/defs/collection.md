# Collection

[← Resources](../README.md) · Schema: [catalog.md](../../domain/catalog.md#collection) · Today: `pages/collections/CollectionsHome.tsx`, `components/collections/CollectionsForm.tsx`

## List

```ts
list: {
  columns: [
    { id: 'collection', header: 'Collection', cell: imageTitle },
    { id: 'products',   header: 'Products',   cell: (c) => c.productsCount },
    { id: 'conditions', header: 'Conditions', cell: rulesSummary },     // 2 lines, "+N more", tooltip
    { id: 'status',     header: 'Status',     cell: publishedBadge },   // Published / Draft
    { id: 'type',       header: 'Type',       cell: (c) => c.kind },    // Manual / Smart
    { id: 'createdAt',  header: 'Created at', cell: date, hidden: true },
    { id: 'updatedAt',  header: 'Updated at', cell: date, hidden: true },
  ],
  search: { param: 'search', placeholder: 'Search collections', debounceMs: 400 },   // today: 500 ms
  filters: [
    { id: 'type', label: 'Type', type: 'multi_enum', options: [manual, smart], toQuery: (v) => ({ kinds: v }) },
  ],
  views: { source: 'static', items: [
    { id: 'all', label: 'All' },
    { id: 'published', label: 'Published', params: { published: 'true' } },
    { id: 'draft', label: 'Draft', params: { published: 'false' } },
  ] },
  pageSize: 50,
  selection: { enabled: true },
  empty: { title: 'Create a collection', action: 'collection.create' },
}
```

## Editor

| Column | Section | Fields | Notes |
|---|---|---|---|
| main | Details | title, description | |
| main | Conditions | match all/any, rules | smart only; fields and operators as in [schema](../../domain/catalog.md#collection); custom field rules equals only |
| main | Products | product list | child, server-paged 50; add-products picker paged 10 with search |
| main | Custom fields | runtime fields | only if definitions exist |
| main | Search engine listing | seo.title, seo.description, handle | |
| aside | Image | imageUrl | |
| aside | Status | published | |
| aside | Template | templateSuffix | |

- Type (manual / smart) is chosen only on create, as today.
- Products child: paging is blocked while product changes are unsaved, as today. Changes are sent as `addProducts` / `removedProducts`.
- Save enabled only when dirty (today it is always enabled).
- `editor: { save: 'collection.update', create: { route: '/collections/new', command: 'collection.create' } }`

### Validation

| Rule | Source |
|---|---|
| Title required | `CollectionsForm.tsx:91` |
| Handle required | `:93` |
| Smart: ≥ 1 rule | `:278-279`, create `:207` |
| Manual (create): ≥ 1 product | `CreateCollectionsForm.tsx:214` |

## Commands

```ts
commands: {
  page: ['collection.create'],
  row:  ['collection.copyLink'],
  bulk: ['collection.bulkEdit', 'collection.setPublished', 'collection.bulkDelete'],
  more: () => ['collection.delete'],
}
```

## Other

```ts
service:      'item',   // products in a collection come from the collection detail (Products child), not a product list filter
search:       { enabled: true, limit: 4 },
nav:          { group: 'products', parent: 'product', position: 2 },
customFields: { ownerType: 'collection', placement: 'main' },
permissions:  { read: 'read_products', write: 'write_products' },
assistant:    { description: 'Groups of products, manual or rule-based.', readableFields: ['title', 'kind', 'published', 'productsCount', 'rules'] },
```

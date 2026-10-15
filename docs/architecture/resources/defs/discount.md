# Discount

[← Resources](../README.md) · Schema: [discounts.md](../../schema/discounts.md) · Today: `pages/discounts/DiscountsHome.tsx`, `components/discounts/*Form.tsx`, `pages/discount-set`

## List

```ts
list: {
  columns: [
    { id: 'discount',  header: 'Discount',   cell: titleOrCodeWithId },
    { id: 'status',    header: 'Status',     cell: statusBadge },        // published green, draft yellow
    { id: 'code',      header: 'Code' },
    { id: 'available', header: 'Available',  cell: unlimitedOrNumber, sortKey: 'available_coupons' },   // ≥ 1,000,000 → "Unlimited"
    { id: 'starts',    header: 'Start date', cell: date, sortKey: 'start_date' },
    { id: 'ends',      header: 'End date',   cell: endDateOrNone, sortKey: 'end_date' },               // 9999-12-31 → "No end date"
    { id: 'created',   header: 'Created',    cell: date, sortKey: 'created_at' },
    { id: 'updated',   header: 'Updated',    cell: date, sortKey: 'updated_at' },
  ],
  search: { param: 'search', placeholder: 'Search by code or title', debounceMs: 400 },   // today: every keystroke
  views: { source: 'static', items: ['all', 'published', 'draft', 'scheduled', 'inactive'].map(statusView) },
  sort: { source: 'column' },             // sort_by, sort_order
  pageSize: 50,                           // today 10
  selection: { enabled: false },          // no bulk today (API has bulk-update-status)
  empty: { title: 'Create a discount', action: 'discount.create' },
}
```

## Editor

One route per kind: `/discounts/new/{amount_off_products | amount_off_order | gift_with_cart | buy_x_get_y}`; edit at `/discounts/$id` picks the form by kind (slug → kind table in [schema](../../schema/discounts.md#discount)). Single save and Reset (restore initial values), then back to the list.

`editor: { save: 'discount.save', create: { route: '/discounts/new/$kind', command: 'discount.create' } }`

Not edited in today's forms, preserved on save: `combinable`, `mustApply`, `payment` flags.

| Kind | Sections, in order |
|---|---|
| Amount off products | Title and description · Code · Value (percentage 0–100 or fixed; products or collections) · Product requirements · Purchase requirements (none / amount / quantity) · Eligibility (all / segments / customers) · Max uses · Active dates · Terms · Visibility and device |
| Amount off order | Same without product requirements |
| Gift with cart | Value replaced by free product picker |
| Buy X get Y | Customer buys (products or collections ≤ 100, quantity 1–1000) · Customer gets (products or collections, free quantity 1–1000) · Eligibility · Max uses · Active dates · Visibility |

### Validation

| Rule | Source |
|---|---|
| Code 3–20 chars, `^[A-Z0-9-]+$` | `DiscountForm.tsx:286` |
| Percentage 0–100 | `:485` |
| End date not before start | `:1088` |
| Buy X get Y quantities 1–1000, ≤ 100 items | `BuyXGetYDiscountForm.tsx:256-363` |

Money, "unlimited" and "no end date" encoding is the transformer's job (paise, 1,000,000, `9999-12-31T23:59:59Z`), as today.

## Commands

```ts
commands: {
  page: ['discount.createWithAssistant', 'discount.create'],   // create opens a kind picker
  row:  ['discount.publish', 'discount.moveToDraft', 'discount.markInactive'],   // delete is disabled in gk-pages today
}
```

`discount.createWithAssistant` uses the existing os-discount AI session API.

## Discount set

Same list and editor at `/discount-sets`, with:

- Create adds: number of codes (1–1,000,000), prefix, suffix, length; prefix + length + suffix ≥ 10 (`OrderDisountForm.tsx:338`).
- Kinds: order, product, gift with cart (no buy X get Y, as today).
- Edit shows the generated codes with CSV download.

```ts
editor:   { save: 'discountSet.save', create: { route: '/discount-sets/new/$kind', command: 'discountSet.create' } },
commands: { more: (d) => d.bulkCampaign?.status === 'completed' ? ['discountSet.downloadCodes'] : [] },
```

## Other

```ts
service:     'os-discount',
nav:         { group: 'discounts', position: 1 },
permissions: { read: 'discounts:read', write: 'discounts:write' },
assistant:   { description: 'Discount codes and automatic discounts.', readableFields: ['title', 'code', 'kind', 'status', 'value', 'startsAt', 'endsAt', 'limits'] },
```

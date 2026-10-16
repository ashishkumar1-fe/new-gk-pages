# Discount

[← Resources](../README.md) · Schema: [discounts.md](../../domain/discounts.md) · Today: `pages/discounts/DiscountsHome.tsx`, `pages/discounts/CreateDiscountWizard.tsx`, `components/discounts/wizard/*`, `schemas/discountWizard.ts`; `components/discounts/*Form.tsx` (discount sets, AI create), `pages/discount-set`

## List

```ts
list: {
  columns: [
    { id: 'discount',  header: 'Discount',   cell: titleOrCodeWithId },
    { id: 'status',    header: 'Status',     cell: statusBadge },        // effectiveStatus ?? status; published green, draft yellow
    { id: 'code',      header: 'Code' },
    { id: 'available', header: 'Available',  cell: unlimitedOrNumber, sortKey: 'availableCoupons' },   // undefined → "Unlimited"
    { id: 'starts',    header: 'Start date', cell: date, sortKey: 'startsAt' },
    { id: 'ends',      header: 'End date',   cell: endDateOrNone, sortKey: 'endsAt' },               // undefined → "No end date"
    { id: 'created',   header: 'Created',    cell: date, sortKey: 'createdAt' },
    { id: 'updated',   header: 'Updated',    cell: date, sortKey: 'updatedAt' },
  ],
  search: { placeholder: 'Search by code or title', debounceMs: 500 },   // as today
  views: { source: 'static', items: ['all', 'published', 'draft', 'scheduled', 'inactive'].map(statusView) },
  sort: { source: 'column' },
  pageSize: 50,                           // today 10
  selection: { enabled: false },          // no bulk today (API has PUT /bulk/update)
  empty: { title: 'Create a discount', action: 'discount.create' },
}
```

## Editor

- **Create**: one route, `/discounts/new`, a 5-step wizard: offer type · offer & code · eligibility · usage & stacking · review.
- **Edit**: `/discounts/$id` opens the same wizard at step 2, kind and mode locked.
- **Code check**: `codeUnique`, a read through the API module, not a command.
- **Finish** (create and edit): "Publish this discount?" with Publish now / Save as draft / Cancel; the choice sets the status, then back to the list. Runs as the discount wizard machine ([machines](../../docs/machines.md#v1-machines)).

`editor: { save: 'discount.update', create: { route: '/discounts/new', command: 'discount.create' } }`

Hidden in today's wizard, round-tripped on save: `stacking`, `payment` flags, `crossDomainEffects` (`StepLimits.tsx:60-111`).

| Step | Fields |
|---|---|
| Offer type | cart · buy X get Y · bundle · dynamic tier · free gift |
| Offer & code | mode (code / automatic), title, code, display name, offer (per kind), gift top-up |
| Eligibility | minimum (none / amount / quantity, on subtotal or to-pay), customers (all / new / returning / specific customers, include or exclude), active dates, devices, visibility, description |
| Usage & stacking | total uses, per customer, per order, terms |
| Review | summary |

Legacy forms (discount sets, AI create), one per kind; not edited, preserved on save: `combinable`, `mustApply`, `payment` flags.

| Kind | Sections, in order |
|---|---|
| Amount off products | Title and description · Code · Value (percentage 0–100 or fixed; products or collections) · Product requirements · Purchase requirements (none / amount / quantity) · Eligibility (all / segments / customers) · Max uses · Active dates · Terms · Visibility and device |
| Amount off order | Same without product requirements |
| Gift with cart | Value replaced by free product picker |
| Buy X get Y | Customer buys (products or collections ≤ 100, quantity 1–1000) · Customer gets (products or collections, free quantity 1–1000) · Eligibility · Max uses · Active dates · Visibility |

Validation: `wizardValidation`, `draftValidation`, `legacyValidation` ([domain](../../domain/discounts.md#rules)); unlimited and no end date: `unlimited`, `noEndDate`.

## Commands

```ts
commands: {
  page: ['discount.createWithAssistant', 'discount.create'],   // create opens the wizard; AI button hidden in gk-pages today (route /discounts/create still live)
  row:  ['discount.publish', 'discount.moveToDraft', 'discount.markInactive'],   // delete is disabled in gk-pages today
}
```

## Discount set

Same list at `/discount-sets`; edited in the legacy v1 forms, not the wizard:

- Create adds: number of codes, prefix, suffix, length (`discountSetValidation`).
- Kinds: order, product, gift with cart (no buy X get Y, as today).
- Edit loads the generated codes (presigned file → zip → rows) and downloads them as CSV in the browser.
- Row status items do nothing today; no set status commands in v1.

```ts
editor:   { save: 'discountSet.update', create: { route: '/discount-sets/new/$kind', command: 'discountSet.create' } },
commands: { more: (d) => d.bulkCampaign?.status === 'completed' ? ['discountSet.downloadCodes'] : [] },
```

## Other

```ts
service:     'discount',   // discounts on Discount Service V2 via the gateway; sets on os-discount
nav:         { group: 'discounts', position: 1 },
permissions: { read: 'read_discounts', write: 'write_discounts' },
assistant:   { description: 'Discount codes and automatic discounts.', readableFields: ['title', 'code', 'kind', 'method', 'status', 'effectiveStatus', 'value', 'startsAt', 'endsAt', 'limits'] },
```

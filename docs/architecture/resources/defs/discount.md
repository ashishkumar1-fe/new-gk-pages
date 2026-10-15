# Discount

[← Resources](../README.md) · Schema: [discounts.md](../../schema/discounts.md) · Today: `pages/discounts/DiscountsHome.tsx`, `pages/discounts/CreateDiscountWizard.tsx`, `components/discounts/wizard/*`, `schemas/discountWizard.ts`; `components/discounts/*Form.tsx` (discount sets, AI create), `pages/discount-set`

## List

```ts
list: {
  columns: [
    { id: 'discount',  header: 'Discount',   cell: titleOrCodeWithId },
    { id: 'status',    header: 'Status',     cell: statusBadge },        // effectiveStatus ?? status; published green, draft yellow
    { id: 'code',      header: 'Code' },
    { id: 'available', header: 'Available',  cell: unlimitedOrNumber, sortKey: 'available_coupons' },   // ≥ 1,000,000 → "Unlimited"
    { id: 'starts',    header: 'Start date', cell: date, sortKey: 'start_date' },
    { id: 'ends',      header: 'End date',   cell: endDateOrNone, sortKey: 'end_date' },               // 9999-12-31 → "No end date"
    { id: 'created',   header: 'Created',    cell: date, sortKey: 'created_at' },
    { id: 'updated',   header: 'Updated',    cell: date, sortKey: 'updated_at' },
  ],
  search: { param: 'search', placeholder: 'Search by code or title', debounceMs: 400 },   // today: 500 ms
  views: { source: 'static', items: ['all', 'published', 'draft', 'scheduled', 'inactive'].map(statusView) },
  sort: { source: 'column' },             // sort_by, sort_order
  pageSize: 50,                           // today 10
  selection: { enabled: false },          // no bulk today (API has PUT /bulk/update)
  empty: { title: 'Create a discount', action: 'discount.create' },
}
```

## Editor

- **Create**: one route, `/discounts/new`, a 5-step wizard: offer type · offer & code · eligibility · usage & stacking · review.
- **Edit**: `/discounts/$id` opens the same wizard at step 2, kind and mode locked.
- **Code check**: on leaving step 2 (`discount.checkCode`).
- **Finish**: "Publish now" or "Save as draft" (draft needs only kind and title), then back to the list.

`editor: { save: 'discount.update', create: { route: '/discounts/new', command: 'discount.create' } }`

Hidden in today's wizard, round-tripped on save: `stacking`, `payment` flags, `crossDomainEffects` (`StepLimits.tsx:60-111`).

| Step | Fields |
|---|---|
| Offer type | cart · buy X get Y · bundle · dynamic tier · free gift |
| Offer & code | mode (code / automatic), title, code, display name, offer (per kind), gift top-up |
| Eligibility | minimum (none / amount / quantity, on subtotal or to-pay), customers (all / new / returning / specific phones, include or exclude), active dates, devices, visibility, description |
| Usage & stacking | total uses, per customer, per order, terms |
| Review | summary |

Legacy forms (discount sets, AI create), one per kind; not edited, preserved on save: `combinable`, `mustApply`, `payment` flags.

| Kind | Sections, in order |
|---|---|
| Amount off products | Title and description · Code · Value (percentage 0–100 or fixed; products or collections) · Product requirements · Purchase requirements (none / amount / quantity) · Eligibility (all / segments / customers) · Max uses · Active dates · Terms · Visibility and device |
| Amount off order | Same without product requirements |
| Gift with cart | Value replaced by free product picker |
| Buy X get Y | Customer buys (products or collections ≤ 100, quantity 1–1000) · Customer gets (products or collections, free quantity 1–1000) · Eligibility · Max uses · Active dates · Visibility |

### Validation

| Rule | Source (`schemas/discountWizard.ts`) |
|---|---|
| Title required; code ≥ 3 chars | `:12-13` |
| Cart / dynamic tier amount > 0; specific scope needs ≥ 1 product or collection | `:40-58`, `:92-107` |
| Buy X get Y: ≥ 1 buy rule; amount unless free | `:60-74` |
| End after start | `:157` |
| Description required when visible; minimum value required when a minimum is set | `:160-173` |
| Draft: kind and title only | `:175-178` |

Legacy forms:

| Rule | Source |
|---|---|
| Code 3–20 chars, `^[A-Z0-9-]+$` | `DiscountForm.tsx:286` |
| Percentage 0–100 | `:485` |
| End date not before start | `:1088` |
| Buy X get Y quantities 1–1000, ≤ 100 items | `BuyXGetYDiscountForm.tsx:256-363` |

Money, "unlimited" and "no end date" encoding is the transformer's job, as today: paise; V2 omits the field for unlimited and no end date; v1 uses 1,000,000 and `9999-12-31T23:59:59Z`.

## Commands

```ts
commands: {
  page: ['discount.createWithAssistant', 'discount.create'],   // create opens the wizard; AI button hidden in gk-pages today (route /discounts/create still live)
  row:  ['discount.publish', 'discount.moveToDraft', 'discount.markInactive'],   // delete is disabled in gk-pages today
}
```

`discount.createWithAssistant` uses the existing os-discount AI session API and today saves through the legacy v1 create (`CreateDiscountAI.tsx:337`).

## Discount set

Same list and editor at `/discount-sets`, with:

- Create adds: number of codes (1–1,000,000), prefix, suffix, length; prefix + length + suffix ≥ 10 (`OrderDisountForm.tsx:338`).
- Kinds: order, product, gift with cart (no buy X get Y, as today).
- Edit shows the generated codes with CSV download.

```ts
editor:   { save: 'discountSet.update', create: { route: '/discount-sets/new/$kind', command: 'discountSet.create' } },
commands: { more: (d) => d.bulkCampaign?.status === 'completed' ? ['discountSet.downloadCodes'] : [] },
```

## Other

```ts
service:     'os-discount',   // discounts on Discount Service V2 via the gateway; sets on os-discount
nav:         { group: 'discounts', position: 1 },
permissions: { read: 'read_discounts', write: 'write_discounts' },
assistant:   { description: 'Discount codes and automatic discounts.', readableFields: ['title', 'code', 'kind', 'status', 'value', 'startsAt', 'endsAt', 'limits'] },
```

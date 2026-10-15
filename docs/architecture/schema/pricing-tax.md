# Pricing and tax

[← Schema](README.md)

**Parity rule:** pricing and tax behave exactly as in today's gk-pages and backend. The schema mirrors what exists; any change to how prices, tax or margins are calculated is a product decision (see [deferred.md](deferred.md)).

## On the variant

```ts
interface VariantPricing {
  price: Money;              // selling price
  compareAtPrice?: Money;    // compare_at_price
  costPerItem?: Money;       // team-only
  profit?: Money;            // server-computed
  margin?: number;           // server-computed
}
```

Validations and derived values (discount %, margin) are ported from gk-pages as they are, not redefined.

## Tax

```ts
interface ProductTax {
  taxable: boolean;          // product.charge_tax (variants also carry taxable)
  hsnCode?: string;          // product.hs_code
}

interface TaxLine {
  title: string;             // as returned by the server
  rate: number;
  amount: Money;
}
```

- Tax is calculated by the backend (`/calculate` for drafts and order edits). The UI displays the tax lines it receives.
- Today's UI also has a display fallback when `total_tax` is missing (18%). It is kept as is until product decides otherwise.

## Price schedules

Bulk price changes, immediate or scheduled (`/bulk-edit/{storeId}/price-update`).

```ts
interface PriceSchedule extends Entity {
  title: string;
  description?: string;
  status: 'pending' | 'scheduled' | 'completed' | 'failed';
  action: {
    type: 'set' | 'increase_percent' | 'decrease_percent' | 'increase_amount' | 'decrease_amount';
    value: number;                 // percent, or paise for amounts
  };
  target: 'price' | 'compare_at_price';
  roundToNearest?: number;
  keepOldPriceAsCompareAt: boolean;   // updateComparedAtPriceToOld
  products: { all: true } | { filters: Record<string, unknown> };
  schedule: { kind: 'immediate' } | { kind: 'scheduled'; startAt: DateTime; endAt?: DateTime };
  recurrence?: { pattern: string; config: unknown; end?: unknown };
  notifyCustomers: boolean;
}
```

A conflicting schedule returns `interferingTasks`; the command shows them.

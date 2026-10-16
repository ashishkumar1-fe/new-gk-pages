# Pricing and tax

[← Domain](README.md) · Wire: [gateway › item](../gateway/item.md)

Pricing and tax behave exactly as today ([parity rule](README.md#five-rules-that-shape-everything)); any change is a product decision ([deferred](deferred.md)).

## Tax

```ts
interface ProductTax {
  taxable: boolean;                  // charge_tax
  hsnCode?: string;
}

interface TaxLine {
  title: string;                     // as the server returns it
  rate: number;                      // decimal, 0.18; shown as a percent
  amount: Money;
}
```

The server calculates tax (draft `calculate`, edit-session `preview`); the UI shows the lines it receives.

## Price schedules

Bulk price changes, run now or scheduled.

```ts
interface PriceSchedule extends Entity {
  name: string;
  description?: string;
  status: string;                    // only 'pending' matters: it can be cancelled
  action: {
    field: 'price' | 'compare_at_price';
    kind: 'change_to' | 'increase_percent' | 'decrease_percent' | 'increase_amount' | 'decrease_amount';
    value: number;                   // percent, or paise for change_to and amounts
  };                                 // wire: one of 10 combined PriceActionType values
  roundToNearest: boolean;           // round to a whole rupee
  keepOldPriceAsCompareAt: boolean;
  products: { all: true } | { filters: Record<string, unknown> };
  execution: { type: 'once'; startAt?: DateTime } | { type: 'recurring'; pattern: 'daily' | 'weekly' | 'monthly' | 'yearly'; at: RecurrenceTime; endAt: DateTime };
  notifyCustomers: boolean;
}

interface RecurrenceTime { hour: number; minute: number; second: number; dayOfWeek?: number; dayOfMonth?: number; month?: number }
```

## Rules

| Rule | What | gk-pages source |
|---|---|---|
| `displayTax` | server tax lines; when taxes apply and `total_tax` is missing: (subtotal − discount) × 18% | `components/orders/PaymentSection.tsx:596`, `:1246` |
| `taxRatePercent` | rate × 100 for display | `PaymentSection.tsx:198` |
| `paise` / `rupees` | × 100 / ÷ 100, 2 dp; null → 0 | `utils/calculationFunctions.ts:19` |
| `scheduleTiming` | name, action and amount required; start not in the past; recurring needs an end, not in the past | `pages/products/PriceSchedule.tsx:171`, `:277` |
| `scheduleCancellable` | status, lowercased, is `pending` | `pages/products/PriceScheduleList.tsx:385` |

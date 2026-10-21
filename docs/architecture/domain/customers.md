# Customers

[← Domain](README.md) · Wire: [gateway › os-customer](../gateway/os-customer.md)

## Customer

```ts
interface Customer extends Entity {
  firstName?: string;
  lastName?: string;
  email?: string;
  emailDomain?: string;
  phone?: string;                    // primary identifier for many Indian customers
  company?: string;
  status: 'active' | 'blocked';      // derived from isBlocked
  isDeleted: boolean;
  defaultAddress?: Address;
  tags: string[];
  note?: string;                     // wire: notes
  language: string;                  // "en"
  taxSetting: 'COLLECT_TAX' | 'DONT_COLLECT_TAX';
  marketing: { email: boolean; sms: boolean; push: boolean };   // wire: has*Subscription
  anniversaryDate?: DateOnly;
  stats: {                           // server-computed, read-only
    ordersCount: number;             // totalOrders
    amountSpent: Money;              // rupees on the wire (string on the KwikPass host)
    averageOrderValue: Money;
    firstOrderAt?: DateTime;
    lastOrderAt?: DateTime;
    abandonedCheckoutAt?: DateTime;
  };
  customFields: FieldValue[];        // written on update; not in the read shape
}

interface CustomerAddress extends Address, Entity {
  customerId: Id;
  isDefault: boolean;
  email?: string;
}
```

## Segment

Saved customer filters; the customer list uses the same conditions.

```ts
type SegmentFieldType = 'numeric' | 'text' | 'boolean' | 'date' | 'array';

interface Segment extends Entity {
  name: string;
  description: string;
  conditions: { field: string; operator: string; value: unknown }[];
  logic: 'AND' | 'OR';               // wire: conditionLogic
  customerCount: number;
  active: boolean;                   // isActive, default true
}
```

| Field type | Operators |
|---|---|
| numeric | equals, not_equals, greater_than, less_than, greater_than_or_equals, less_than_or_equals, is_set, is_not_set |
| text | equals, not_equals, contains, not_contains, starts_with, ends_with, is_set, is_not_set |
| boolean | is, is_not |
| date | before, after, between |
| array | contains, contains_any, contains_all, is_empty, is_not_empty |

## Rules

As today. Source paths are in gk-pages `src/`.

| Rule | What | gk-pages source |
|---|---|---|
| `customerValidation` | first and last name required, letters and spaces; email required, valid; country code +91; phone required, `^[6-9]\d{9}$`; tax setting required; notes ≤ 5000 | `schemas/customerSchema.ts` |
| `customerSearch` | `contains` OR-ed across email, first name, last name, name, phone, company, tags, address; AND-ed when other filters are active | `pages/customers/CustomerHome.tsx:94` |
| `segmentValidation` | name and description required, trimmed | `components/customers/SegmentForm.tsx:105` |
| `segmentFields` | segment fields and their types: totalSpent numeric, tags array, names text, isDeleted / isActive boolean, createdAt / updatedAt date | `SegmentForm.tsx:319` |
| `segmentDefaultOperator` | totalSpent → greater_than; tags → contains; booleans → is (false); dates → after; else equals | `SegmentForm.tsx:303` |
| `segmentValueSplit` | a text value with commas becomes a trimmed list | `SegmentForm.tsx:146` |
| `segmentLogic` | default AND; today's editor resets to AND on edit (fixed in v1) | `SegmentForm.tsx:94` |

Known conflicts, kept as today: the form defaults `taxSetting` to `DONT_COLLECT_TAX` while the reader defaults to `COLLECT_TAX`; the form schema defaults language to `'English [Default]'`, the transformer to `en`.

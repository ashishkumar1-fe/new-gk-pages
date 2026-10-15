# Customers

[← Schema](README.md)

Service: os-customer (`/api/v1/admin/customers`, `/addresses`, `/customer-segments`). camelCase; rejects unknown fields.

## Customer

```ts
interface Customer extends Entity {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;                    // primary identifier for many Indian customers
  company?: string;
  status: 'active' | 'blocked';      // isBlocked
  defaultAddress?: Address;
  tags: string[];
  note?: string;
  language: string;                  // "en"
  taxSetting: 'collect_tax' | 'exempt';
  marketing: { email: boolean; sms: boolean; push: boolean };
  stats: {                           // server-computed, read-only
    ordersCount: number;
    amountSpent: Money;              // backend sends rupees; converted to paise
    averageOrderValue: Money;
    firstOrderAt?: DateTime;
    lastOrderAt?: DateTime;
  };
  customFields: FieldValue[];
}
```

The backend accepts a customer with either email or phone. Today's UI requires first name, last name, email and phone; v1 keeps the UI rules ([customer resource](../resources/defs/customer.md#validation-schemascustomerschemats)).

## Address

Separate endpoint (`/addresses?customerId=`).

```ts
interface CustomerAddress extends Address, Entity {
  customerId: Id;
  isDefault: boolean;
  email?: string;
}
```

## Segment

Saved customer filters. The customer list uses the same conditions (`POST /customers/filter`).

```ts
interface Segment extends Entity {
  name: string;
  description?: string;
  conditions: ConditionGroup;        // see conventions.md
  customerCount: number;
  active: boolean;
}
```

Condition fields used today:

| Where | Fields |
|---|---|
| Customer list search and views | `email`, `firstName`, `lastName`, `name`, `phone`, `company`, `tags`, `address`, `hasEmailSubscription` |
| Segment editor | `totalSpent`, `tags`, `firstName`, `lastName`, `isDeleted`, `isActive`, `createdAt`, `updatedAt` |

Operators: `equals`, `not_equals`, `contains`, `contains_any`, `greater_than`, `less_than`, `between`.

# Domain

[← Architecture](../README.md)

Each entity has a small, React-free module: its shape and its rules.

The entity shapes themselves are in [../schema/](../schema/README.md). This doc covers how they are used in code.

## Per entity

```
domain/order/
  schema.ts   # Zod schemas: Order, OrderListItem, OrderListParams, inputs
  rules.ts    # pure functions: canRefund(order), isEditable(order)
  format.ts   # display helpers: orderStatusLabel, formatOrderTotal
```

## Schemas

One schema per shape, used in three places:

- **API boundary** — responses are parsed, so bad data fails loudly at the edge, not deep in a component.
- **Forms** — React Hook Form uses the same schema through the Zod resolver.
- **Commands / AI tools** — command input schemas become tool definitions (see [../commands/](../commands/README.md)).

Where the API shape differs from what the UI needs, a transformer in the domain's API module maps it once.

## Rules

Business rules are plain functions:

```ts
// as today (OrderDetails.tsx:466-488)
export const refundBlockReason = (o: Order): string | undefined =>
  o.status === 'cancelled' ? "Cancelled orders can't be refunded"
  : o.payment.method === 'cod' ? "COD orders can't be refunded"
  : ['refunded', 'partially_refunded', 'refund_pending'].includes(o.financialStatus) ? 'A refund already exists for this order'
  : undefined;
```

Components, commands and the assistant all call the same rule, so "can I refund this?" has one answer.

## Constraints

- No React, no network, no store imports in `domain/`.
- Rules are unit-tested; they are the cheapest tests we have.

## Custom fields (runtime schema)

Field definitions come from the server ([schema](../schema/custom-fields.md)). A helper turns them into a Zod schema at runtime and merges it with the static one:

```ts
const schema = ProductInputSchema.extend({ customFields: fieldsSchema(definitions) });
```

Supported types: the backend's field types listed in [custom-fields.md](../schema/custom-fields.md#definition).

## Rules come from gk-pages

Business rules (pricing validations, discount %, margin, variant combinations) are ported from today's gk-pages as they are. New rules from the design need product sign-off. See [../schema/deferred.md](../schema/deferred.md).

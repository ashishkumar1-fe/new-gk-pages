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

One schema per shape, used three ways:

- Parses the API response ([ADR 0004](../adr/0004-validate-every-response.md)).
- Drives the form (Zod resolver).
- Becomes the command / AI tool input.

Backend shapes are mapped once in the API module ([data flow](../schema/conventions.md#data-flow-transform-once-never-mutate)).

## Rules

Business rules are plain functions:

```ts
// as today (OrderDetails.tsx:537-559)
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

# Build order

[← Architecture](../README.md)

The [resource](../resources/registry.md) and [command](../commands/registry.md) definitions are the target spec. Steps 2 and 3 build products and orders by hand against it and adjust the contracts where real code disagrees, before the rest is ported.

| Step | Scope | Output |
|---|---|---|
| 1. Platform shell | Login, boot machine, merchant picker, API client and services, chrome, telemetry, UI primitives | Empty app a merchant can log into |
| 2. Products | Product and collection list and editor | Confirmed resource contract, record editor machine |
| 3. Orders | Order list and detail, notes, tags, archive, cancel, refund, edit (session), fulfilment and holds, drafts (complete, invoice) | Confirmed command contract, refund, order-edit-session and draft-payment-watch machines |
| 4. Assistant | Panel, screen context, read tools, proposal flow over v1 topics | AI over products and orders |
| 5. Remaining resources | Inventory, purchase orders, transfers, customers, segments, discounts | Ported through the registries |
| 6. Extensions | Extension targets on resources, app bridge in new chrome | Parity with today |

Steps 4 and 6 can move earlier if business priority demands, once step 3 is done.

## Done means

- Schema parses real sandbox responses (list and detail) for the resource.
- Write payloads match what gk-pages sends today (recorded and compared).
- Typed end to end, no `any` at boundaries.
- Loading, empty and error states.
- Permission keys declared (enforcement off in v1).
- Unit tests for rules (pinned to gk-pages behaviour), one E2E test per main flow.

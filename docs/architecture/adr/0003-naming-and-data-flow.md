# 0003 — Naming and data flow

[← ADRs](README.md)

Status: accepted · 2026-10-15

## Context

The backend names the same thing differently per service (`m_id`, `merchant_id`, `storeId`, `merchant-mid`), and drafts of these docs drifted (`product.save` vs `product.update`, `products:write` vs `products:view`). Reshaping data in many places is where staleness and mutation bugs come from.

## Decision

- **One name per concept** across the frontend; where open, use the Shopify Admin vocabulary. Tenant `storeId`; writes `resource.create` / `resource.update` / `resource.delete`; permissions as scopes `read_products`, `write_orders`. Table in [conventions](../domain/conventions.md#naming).
- **Transform once, never mutate.** Backend data is converted to the domain shape once, in the service's API module, into a new object. Above that it is read-only. Display formats are derived at render time by pure functions that return new values. Details in [conventions](../service-api/README.md#data-flow-transform-once-never-mutate).

## Consequences

- A backend rename touches one transformer.
- Lint rule: no assignment to properties of query data (`no-param-reassign` on query results, readonly domain types).

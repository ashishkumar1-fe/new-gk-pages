# 0004 — Validate every response

[← ADRs](README.md)

Status: accepted · 2026-10-15

## Context

Tracker d31 limited Zod validation to critical endpoints, because converting gk-pages in place would have meant writing schemas for code that had none. In the new codebase every resource and command already has a schema.

## Decision

Every response is parsed with its schema in the API module, the same way everywhere: `safeParse`, shape drift logged to Sentry with endpoint and field path, data still rendered. Money values are parsed strictly: a bad value shows "can't display" in its place and the rest renders ([data access](../resources/data-access.md#errors)). See [data flow](../service-api/README.md#data-flow-transform-once-never-mutate).

## Consequences

- One code path for all endpoints; no list of "critical" ones to maintain.
- Drift shows up in Sentry before it shows up as a bug.

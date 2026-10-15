# 0002 — New codebase

[← ADRs](README.md)

Status: accepted · 2026-10-15

## Context

The standalone tracker chose to convert gk-pages in place (approach A): keep `makeAPICall`'s signature so existing modules survive. The rest of the plan already changes most of what those modules do: Redux and `useEffect` fetching move to TanStack Query, antd/gokwik-ui-kit to our own kit, flat routes to typed routes, per-screen writes to commands. Little of today's code would survive unchanged.

## Decision

- Ratio is built in this repo (`new-gk-pages`) as a new codebase on the [architecture](../README.md).
- gk-pages is the behaviour reference, not the code base: business rules, payloads and validations are ported with tests that pin today's behaviour ([schema parity rule](../schema/README.md)).
- The tracker's platform decisions (d01–d36) carry over unchanged, except where they assumed in-place conversion: the API client keeps no `makeAPICall` signature (d11), and response validation covers every response ([ADR 0004](0004-validate-every-response.md)).

## Docs

Architecture and team docs live in this repo for now (`docs/`), one home per document. The folder can move to another home later as a whole.

## Consequences

- No compatibility layer for `@gokwik/utilities`, Redux slices or antd.
- gk-pages keeps running in the dashboard until cutover ([delivery](../platform/delivery.md#cutover)); fixes landing there must be checked against these docs.

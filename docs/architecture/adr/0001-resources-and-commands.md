# 0001 — Resources and commands

[← ADRs](README.md)

Status: accepted (draft architecture) · 2026-10-14

## Context

The admin is mostly lists and editors over 11 resources, plus an AI assistant and third-party extensions that must act on the same data. Today each gk-pages screen fetches and writes on its own (Redux slices, effect chains, per-page API calls), so behaviour such as confirmation, error handling and cache refresh differs per screen, and there is no single surface an assistant could use safely.

## Decision

- Reads are **resources** ([../resources/](../resources/README.md)): one definition per entity drives lists, editors, ⌘K search and assistant read tools.
- Writes are **commands** ([../commands/](../commands/README.md)): one definition per action, one execution path for buttons, menus, bulk bar, ⌘K, shortcuts, assistant and extensions.
- The assistant proposes commands; a person approves every write.

## Prior art considered


| Source | What we take |
|---|---|
| CQRS | Writes are explicit commands with typed input, separate from reads |
| VS Code commands | Stable string IDs; `when` conditions for visibility; enablement separate from visibility; shortcuts bound to IDs |
| React-Admin mutation modes | Pessimistic, optimistic and undoable as a per-command choice |
| Linear, Raycast palettes | Context-aware ⌘K: commands for the current record or selection first, keywords, shortcuts shown |
| Shopify Admin GraphQL | Mutations return field-level `userErrors` that map to form fields |
| Shopify admin action extensions | Separate targets for a single record (details page, More menu) and a selection (index page); a should-render check per record |
| Shopify bulk operations | Large writes run as a background job with status polling, not one long request |
| Medusa workflows | Multi-step writes as steps; each step can have a compensation that undoes it if a later step fails, run in reverse order |
| MCP tools | Name, description, JSON-schema input; annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`) that tell an AI how risky a call is |
| Shopify Sidekick | AI proposes changes, highlights the fields it filled, never saves without the merchant's approval; limited to the staff member's permissions |
| Atlassian Rovo agents | Agent asks for confirmation before any non-read action; deletes can require a second confirmation |
| Salesforce Agentforce | Actions grouped by topic with instructions; a per-action "require user confirmation" flag |

## Consequences

- Every write endpoint is called from exactly one command; screens never call write endpoints.
- Confirmation, permissions, cache refresh, audit and error display behave the same on every surface.
- Adding a surface (assistant topic, extension target) needs no new write code.
- Cost: an upfront registry and execution layer before the first screen ships; mitigated by building products and orders first and adjusting the contracts.

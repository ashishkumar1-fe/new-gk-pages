# ADRs

[← Architecture](../README.md)

One file per settled decision: `NNNN-short-title.md` with Context, Decision, Consequences. Never edit after acceptance; supersede instead.

| ADR | Decision |
|---|---|
| [0001](0001-resources-and-commands.md) | Reads as resources, writes as commands; assistant proposes, person approves |
| [0002](0002-new-codebase.md) | New codebase; gk-pages is the behaviour reference; docs live in this repo for now |
| [0003](0003-naming-and-data-flow.md) | One name per concept (Shopify vocabulary, `storeId`); transform once at the boundary, never mutate |
| [0004](0004-validate-every-response.md) | Every response parsed with its schema, the same way |
| [0005](0005-cache-policy-switch.md) | Cache freshness is one switch (`fresh` / `balanced`) |

## Tracker decisions d01–d42

From the standalone decision tracker (all closed); each page lists the ones it carries.

| Decisions | Page |
|---|---|
| d01–d04, d08, d36 | [platform › identity and access](../platform/identity-access.md) |
| d05–d07, d12 | [platform › auth and session](../platform/auth-session.md) |
| d11, d31 | [platform › API client](../platform/api-client.md) |
| d09, d10 | [surfaces › routing](../surfaces/routing.md) |
| d13–d16 | [surfaces › chrome](../surfaces/chrome.md) |
| d17, d18 | [gateway › access](../gateway/access.md) |
| d19–d21, d32, d34 | [operations › delivery](../operations/delivery.md) |
| d22–d30, d33, d35 | [operations › quality](../operations/quality.md) |
| d37, d39 | [operations › contribution](../operations/contribution.md) |
| d38 | [UI kit › governance](../docs/ui-kit.md#governance-d38) |
| d40 | [stack](../docs/stack.md) (adopted after review) |
| d41 | registry scope: [resources](../resources/README.md#rules), palette [chrome](../surfaces/chrome.md), machine owners [machines](../docs/machines.md) |
| d42 | fresh codebase [ADR 0002](0002-new-codebase.md); freshness [ADR 0005](0005-cache-policy-switch.md); docs stay in this repo (ADR 0002 over d42's Confluence) |

Still open: exact subdomain (d02, [open questions](../docs/open-questions.md) #2), phased rollout (d03, at cutover), detailed deploy process (d19, near launch).

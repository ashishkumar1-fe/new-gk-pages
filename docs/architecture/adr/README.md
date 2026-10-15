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

Platform decisions `d01`–`d36` come from the standalone decision tracker and are recorded in [../platform/](../platform/README.md), each page citing its decisions.

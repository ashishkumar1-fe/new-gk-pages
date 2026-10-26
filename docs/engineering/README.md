# Ratio — Engineering Standards

> Status: agreed · Owner: Ashish Kumar · Updated: 2026-10-16

How we write, review and ship code in this repo. The system architecture (layers, resources, commands, machines, schema) lives in [`../architecture/`](../architecture/README.md) — these docs cover everything *around* that architecture: principles, guardrails, quality, release engineering, and the AI-assisted workflow.

Decisions referenced as `dNN` come from the discovery/architecture decision record — see [`../architecture/discovery-decisions.md`](../architecture/discovery-decisions.md) and the formal spec in [`../specs/`](../specs/2026-10-16-ratio-standalone-design.md).

| Chapter | One line |
|---|---|
| [01 — Coding principles](01-coding-principles.md) | The 12 rules every PR is judged against |
| [02 — Contribution guardrails](02-contribution-guardrails.md) | CLAUDE.md recipes, the scaffolder, lint boundaries, CODEOWNERS |
| [03 — UI kit governance](03-ui-kit-governance.md) | Who may change the kit, closed APIs, change requests, Storybook-lite |
| [04 — AI-native repo](04-ai-native-repo.md) | Shared AI skills, team mistakes.md, the AI-PR contract |
| [05 — Quality & operations](05-quality-operations.md) | Errors, security headers, uptime, budgets, UX baseline |
| [06 — Release engineering](06-release-engineering.md) | CI gates, preview deploys, versioning, cache, cutover |
| [07 — Data & state policy](07-data-policy.md) | Final freshness policy, query keys, Zod boundaries, registry scope |
| [08 — Bugs & debugging](08-bugs-and-debugging.md) | Error-screen support box, request-id, silent-bug detection, ticket → fix flow |

## The three-sentence summary

1. **Writes go through commands, reads through resources** — screens never touch endpoints ([architecture](../architecture/README.md)).
2. **The right way is the fastest way** — the scaffolder generates correct code; lint and CODEOWNERS make wrong code unmergeable.
3. **Every contributor's AI follows the same recipes** — committed skills, recipes and mistakes make quality a property of the repo, not the person.

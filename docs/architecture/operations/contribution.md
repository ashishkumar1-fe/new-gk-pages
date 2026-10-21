# Contribution

[← Operations](README.md) · Decisions: d37, d39

Outside and AI-assisted contributors must produce our code by default: recipes teach, the scaffolder makes the right way the fastest, machines enforce.

## Guardrails (d37)

| Layer | What |
|---|---|
| `CLAUDE.md` | Recipes, not prose ("New entity screen? 1. run the scaffolder 2. copy `resources/product.ts` …") plus a forbidden list. Nested copies in `src/ui/` and `src/resources/`; `AGENTS.md` for other tools |
| Scaffolder | `npm run new:resource <name>`: resource and command definitions, `api/<service>` wire, transformer and fixtures, domain schema, registry entry, tests; cache class required. Pages come from the registry ([pages](../surfaces/pages.md)) |
| Lint and CI | Import boundaries ([structure](../docs/structure.md#layers-and-imports)); bans: direct axios / fetch, `useEffect` fetching, server data in Zustand, mutating query data, XState imports in components, `any`; kit rules in [UI kit](../docs/ui-kit.md#governance-d38). Red CI locks merge ([delivery](delivery.md#pipeline)) |
| CODEOWNERS | `/src/` frontend team; `/src/ui/` kit owners |

The UI kit and one polished exemplar (products) come first: every recipe points at them.

## AI-native repo (d39)

- `.claude/skills/` committed: `new-resource`, `add-command`, `review-pr`, `fix-bug`, so every contributor's AI runs the same workflows.
- `mistakes.md` committed: mistake, correct way, how it was caught. Every AI session reads it first.
- `.claude/settings.json` committed: safe commands allowed, `.env` and secrets reads denied, lint after edits.
- PR template with the checklist. AI-PR contract: small PRs (size: [open question 23](../docs/open-questions.md)), tests in the same PR, author states "I ran it" (screenshots for UI). Reviewers ask "is this our pattern?"; "does it work?" is CI's job.

## Fixing a bug (`fix-bug` skill)

- **Intake.** Required: Error ID or support-box text ([quality](quality.md#bug-evidence-d44-d45)), page link, what was expected. The assistant collects the rest itself (Sentry event, breadcrumbs, request ids, release, recent commits on the route) and asks for anything missing in **one** ticket comment. It never guesses.
- **Buckets.** Frontend bug: failing test first, fix, small PR with a preview link. Backend bug: comment with request id, endpoint and response, reassign; never worked around in a transformer. Not a bug: explain with the rule's source, change nothing. Information missing: one comment with every question.
- **Two checks:** a developer reviews the code; the reporter checks the preview.

## Code

- Colocate a component's styles, tests, hooks and schema; move to shared only on the third use.
- Tests: unit for pure logic (rules, money, transformers); integration with MSW fixtures; machines one test per transition; one Playwright flow per main flow on PRs, plus the staging smoke ([delivery](delivery.md#pipeline)).

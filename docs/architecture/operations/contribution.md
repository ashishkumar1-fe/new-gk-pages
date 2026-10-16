# Contribution

[← Operations](README.md) · Decisions: d37, d39

Outside and AI-assisted contributors must produce our code by default: recipes teach, the scaffolder makes the right way the fastest, machines enforce.

## Guardrails (d37)

| Layer | What |
|---|---|
| `CLAUDE.md` | Recipes, not prose ("New entity screen? 1. run the scaffolder 2. copy `resources/product.ts` …") plus a forbidden list. Nested copies in `src/ui/` and `src/resources/`; `AGENTS.md` for other tools |
| Scaffolder | `npm run new:resource <name>`: definition, commands, schema, 4-state page, test, pre-wired; cache class required |
| Lint and CI | Import boundaries ([structure](../docs/structure.md#layers-and-imports)); bans: direct axios / fetch, `useEffect` fetching, server data in Zustand, raw form elements, `any`. Red CI locks merge ([delivery](delivery.md#pipeline)) |
| CODEOWNERS | `/src/` frontend team; `/src/ui/` kit owners ([UI kit](../docs/ui-kit.md#governance-d38)) |

The UI kit and one polished exemplar (products) come first: every recipe points at them.

## AI-native repo (d39)

- `.claude/skills/` committed: `new-resource`, `add-command`, `review-pr`, `fix-bug`, so every contributor's AI runs the same workflows.
- `mistakes.md` committed: mistake, correct way, how it was caught. Every AI session reads it first.
- `.claude/settings.json` committed: safe commands allowed, `.env` and secrets reads denied, lint after edits.
- AI-PR contract: small PRs, tests in the same PR, author states "I ran it" (screenshots for UI). Reviewers ask "is this our pattern?"; "does it work?" is CI's job.

These AI files live in the repo whatever the docs home is.

## Code

- Colocate a component's styles, tests, hooks and schema; move to shared only on the third use.
- Compound components over many props; props down, events up; no event buses.
- One value per state (pristine, dirty, saving, error), never a pile of booleans.
- Tests: mostly integration, unit for pure logic (rules, money, transformers), a few Playwright smokes.
- Duplicate up to three times before abstracting.

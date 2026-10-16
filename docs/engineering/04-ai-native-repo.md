# 04 — AI-native repo

[← Engineering](README.md) · Decision: d39

Every contributor arrives with an AI (Claude, Codex, Cursor). The repo is designed for both audiences: [02](02-contribution-guardrails.md) stops wrong code; this chapter makes every AI produce **our** code — fast.

## 1. Repo-committed skills — shared AI workflows

`.claude/skills/` is committed to the repo, so **every developer's AI runs the same workflows** (and `AGENTS.md` points other tools at the same content):

```
.claude/skills/
├── new-resource/    → run the scaffolder, follow the golden path, 4 states, write the test
├── add-command/     → schema first, effect flags honestly set, invalidation thought through
├── review-pr/       → our checklist: boundaries, states, a11y, no shadow components
└── fix-bug/         → write the failing test first, then fix
```

Five developers no longer mean five prompting styles. Prompt quality becomes a property of the repo, not the person.

## 2. Team `mistakes.md` — one person's pain, everyone's AI's knowledge

Committed to the repo, updated by PR, one format:

```markdown
## Variant price must be a cleaned numeric STRING, not a number
**Mistake:** setValue(price, 42) → silent "Price is required" validation failure
**Correct:** store the cleaned numeric string
**Caught by:** 2 hours of debugging, Oct 2026
```

Every AI session reads it before writing code (CLAUDE.md says so). A landmine stepped on once is never stepped on again — by anyone, human or AI.

## 3. The AI-PR contract

AI generates code faster than humans can review it; without norms, review becomes rubber-stamping or a bottleneck. The contract (enforced via PR template + review culture):

- **PR ≤ ~400 lines.** "The AI wrote it, that's why it's big" is not an exemption — split it.
- The human author states **"I ran it myself"** (screenshots for UI changes). AI-generated code nobody executed does not enter review.
- **Tests ship in the same PR** — the cheapest thing to ask an AI for.
- Reviewers read it as AI-generated: the question is **"is this our pattern?"** — "does it work?" is CI's job.

## 4. Committed `.claude/settings.json`

Same base behaviour for every AI session: safe commands pre-allowed (test/lint/build — fewer permission prompts), **`.env` and secrets reads denied**, post-edit lint hooks. The repo decides the boundaries, not each laptop.

## How the pieces compose

A backend developer's Claude enters the repo → reads `CLAUDE.md` (recipes) → runs the scaffolder → consumes the kit → learns from `mistakes.md` → is stopped by lint/CODEOWNERS where it strays → ships a ≤400-line PR with tests that a human ran. The output matches the house standard **because wrong was made hard and right was made fast** — not because anyone was lectured.

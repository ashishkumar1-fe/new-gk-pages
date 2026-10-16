# 02 — Contribution guardrails

[← Engineering](README.md) · Decision: d37

**Problem:** contributors from outside the frontend team (often AI-assisted) write code in their own style, then the result doesn't match the codebase — "frontend me support nahi hai" arguments follow. **Principle:** instructions teach, machines enforce, the scaffolder makes the right way the fastest way. A rule that no machine checks is a suggestion.

## Layer 1 — CLAUDE.md: recipes, not rules

A root `CLAUDE.md` (plus nested ones in `src/ui/` and `src/resources/`, and an `AGENTS.md` symlink so Codex/Cursor read the same thing) written as **recipes**:

```markdown
## Building a new entity screen? EXACT STEPS:
1. Run `npm run new:resource <name>` — never create folders by hand.
2. Copy the pattern from resources/product.ts — do not invent a new one.
3. Writes go through defineCommand only. Screens never call write endpoints.
4. UI only from @ui. Raw <button>/<input> fails lint.
5. Every page ships 4 states: skeleton / empty / error / ready.

## FORBIDDEN (lint also fails):
- importing another feature's internals · useEffect+fetch · server data in Zustand
- any · Redux · direct axios · style overrides on kit components
- editing src/ui/ during feature work (read-only — open a Kit Change Request)
```

AI agents follow steps far more reliably than they follow policy prose.

## Layer 2 — The scaffolder: correct by construction

```bash
npm run new:resource order-detail
```

Generates (Plop templates in `tooling/generators/`): the resource definition skeleton, command stubs, Zod schema file, the 4-state page template, a machine stub when asked, and a test file — all pre-wired to the registries with conventions baked in (query keys with merchantId first, **mandatory explicit `staleTime`** — the template cannot be saved with it blank, safeParse at the boundary). The generated code *is* the pattern; human and AI contributors both start from it, so creativity goes into business logic, not structure.

## Layer 3 — Machine enforcement

- **ESLint boundaries** — layer rules and feature isolation (public `index.ts` only).
- **`no-restricted-imports`** — direct axios/fetch in features, antd, kit internals.
- **Pattern bans as lint** — `useEffect` fetching, server data in Zustand, raw form elements in features, shadow/duplicate components.
- **CI gates** ([06](06-release-engineering.md)) — red locks the merge button. No exceptions, including "the AI wrote it".

## Layer 4 — CODEOWNERS

```
# .github/CODEOWNERS
/src/      @frontend-team
/src/ui/   @kit-owners        # see 03 — stricter gate
```

With branch protection "require review from code owners", no PR touching these paths merges without the owning team's approval — GitHub enforces it, nobody argues about it.

## The milestone that makes all of this work

The **UI kit plus one golden exemplar** (products, end-to-end polished) must exist early — they are the copy-source every recipe points at. Guardrails without a paved example produce frustration, not quality.

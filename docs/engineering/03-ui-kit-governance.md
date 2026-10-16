# 03 — UI kit governance

[← Engineering](README.md) · Decision: d38 · Kit design: [architecture/ui-kit](../architecture/docs/ui-kit.md)

**Problem:** feature contributors must **consume** the kit, never mutate it. A new variant ("the tag should be pink here") goes through the kit owners — and even if someone edits the kit themselves, it must be unmergeable without approval.

## Lock 1 — CODEOWNERS on `/src/ui/`

`/src/ui/ @kit-owners` + branch protection "require code-owner review". Any PR touching the kit — add, edit, delete, new component — cannot merge without a kit owner's approval. This is the enforcement; everything else reduces how often it's needed.

## Lock 2 — Closed component APIs

The subtle one: if `Tag` accepted a `className`/`style` prop, a contributor could make it pink **inside their feature** without ever touching the kit — invisible to CODEOWNERS. So kit components expose **closed APIs**: a fixed list of approved variants and **no styling passthrough of any kind**. "Pink" simply cannot be expressed in feature code — the only way it can exist is by adding it to the kit's variant list, which is a kit change, which triggers CODEOWNERS. **The API design enforces the process.** Colors come only from design tokens; raw hex outside the kit fails lint.

## Lock 3 — Lint closes the bypasses

In `features/` and `resources/`: raw `<button>/<input>/<select>` banned (use the kit); kit-internal imports banned (public exports only); `style=` on kit components banned; defining look-alike "shadow components" banned. `CLAUDE.md` states it for agents: *`src/ui/` is READ-ONLY for feature work.*

## The open door — Kit Change Requests

Locks without a fast door create shadow kits (the death of every design system). So:

- GitHub issue template **"UI Kit change request"**: what, why, screenshot/Figma.
- **SLA:** small variants land fast, new components are a discussion *(the exact 1–2-day number is a proposed default — decision log §4)*.
- Every approved change appears in the Storybook-lite the same day, and the requester consumes it from there.

## Catalog — Storybook-lite

A `/playground` route **compiled only into non-prod builds** (`APP_ENV !== 'prod'`): every kit component, its variants, props and copy-paste snippets. No separate Storybook toolchain for now (maintenance tax while the kit is young); the structure keeps a later migration cheap.

## Packaging — written trigger

The kit stays an in-repo folder (iteration speed wins during the build phase; CODEOWNERS provides the lock). It becomes a published package only when either trigger fires: **a second consumer app wants the kit**, or **lockdown bypasses keep recurring**. A same-repo workspace package is the halfway step if needed.

---
name: fix-bug
description: Use when given a bug report or Jira ticket to investigate or fix in Ratio. Runs intake (collect evidence, ask the reporter only what only they know), classifies the bug, and fixes frontend bugs test-first with a PR.
---

# Fix a bug

The reporter (often a PM) does not know the code. Your job is to turn their report into evidence, never into a guess. Full background: `docs/engineering/08-bugs-and-debugging.md`.

## 1. Intake — check the ticket against this list

**Required from the reporter** (do not start fixing without these):

- [ ] Page link (the browser URL — it contains store, route and filters)
- [ ] What happened, and what should have happened
- [ ] Error ID, or a screenshot of the support box — if an error screen appeared

**Nice to have** (ask only if the bug can't be pinned down without them):

- [ ] Screenshot or video
- [ ] Every time, or sometimes?
- [ ] Approximate time
- [ ] One merchant or many?

**Collect yourself — NEVER ask the reporter for these:**

- Sentry event for the Error ID (Sentry MCP): stack trace, breadcrumbs, release version
- `X-Request-Id`s and the command log (`order.refund → POST … → 200 · req …`) from the breadcrumbs
- What the API actually returned (Sentry breadcrumb / Zod drift events)
- Recent changes to the files involved (`git log` on them)

Rule: **if a system can tell you, don't ask a human.**

### If something required is missing

Post **one** Jira comment with **all** your questions at once — no back-and-forth one at a time. Plain language with an example of what to send:

> ✅ "Please copy the link from the browser's address bar on the page where you saw the problem and paste it here."
> ❌ "Please share the request payload."

Then stop and wait. Do not guess.

## 2. Find the code

The path from URL to file is the same for every resource:

```
URL /store/:id/<resource>/... → route file → resource definition → endpoint file → transformer → command
```

Writes always go through a command (`runCommand`). A wrong action is a wrong command or a button wired to the wrong command.

## 3. Classify — exactly one bucket

| Bucket | Signal | What you do |
|---|---|---|
| **Frontend bug** | API returned correct data; we showed or sent the wrong thing | Go to §4 |
| **Backend bug** | API returned wrong data or errored on a valid request | Jira comment: "Backend bug — request-id `<id>`, this came back: …, expected: …". **Do not patch around it in a transformer.** |
| **Not a bug** | System behaves as designed | Explain in plain words on the ticket. Change nothing. |
| **Info missing** | Can't reproduce or locate with what you have | §1 "If something required is missing" |

## 4. Fix (frontend bugs)

1. **Write a failing test first** that shows the bug. If you cannot make it fail, you have not understood the bug — go back to §1 and ask; do not fix blind.
2. Fix. The test goes green; the rest of the suite stays green.
3. Open a **small PR** (AI-PR contract, `docs/engineering/04-ai-native-repo.md`) with:
   - **What broke** — the user-visible symptom
   - **Why** — the root cause in one or two lines
   - **How it's fixed** — and the test that proves it
   - Ticket link
4. Comment on the Jira ticket with the PR's **preview link** so the reporter can check the behaviour themselves.

A developer reviews the code; the reporter verifies the behaviour. Both are needed.

## 5. After the fix

If the bug came from a trap someone could fall into again, propose an entry for `docs/mistakes.md` in the same PR.

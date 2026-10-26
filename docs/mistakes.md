# mistakes.md (docs/mistakes.md)

Every AI session reads this first. Entry: what went wrong · the correct way · how it was caught.

- **Prices sent in rupees** (gk-pages discount wizard, live incident) · Money is `{ minor }` paise everywhere; transformers convert at the boundary only · caught by a merchant; now prevented by the `Money` type and the command payload test.
- **Fake success on a 2xx with `success: false`** (gk-pages discount wizard) · api `errors.ts` maps it to `error`; runCommand never toasts success on it · caught in code mapping.
- **List state in Redux/sessionStorage drifting** (gk-pages collections page size reset) · view state lives in the URL only · caught in a bug report.

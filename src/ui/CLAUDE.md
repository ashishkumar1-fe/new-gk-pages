# src/ui — the kit (read-only for feature work)

- Changes here need a "UI kit change request" issue and `@gokwik/kit-owners` approval (CODEOWNERS). Show the change in the playground.
- Presentational only: props in, events out. Import nothing from the app except `lib/`.
- Closed APIs: a fixed list of variants; no `className` or `style` passthrough. A new look is a kit change, not a prop.
- Never format or decide: money and dates arrive as strings from `domain/*/format.ts`; surfaces map status to tone.
- Every pattern takes loading, empty, error and disabled states. WCAG 2.2 AA and WAI-ARIA keyboard patterns are part of done.
- Tokens only (tailwind.config.js). No raw hex, raw px or arbitrary values.

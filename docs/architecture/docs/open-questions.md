# Open questions

[← Architecture](../README.md)

| # | Question | Owner | Notes |
|---|---|---|---|
| 1 | Reuse existing gk-pages code first (standalone lift-and-shift), or build fresh directly? | Product, Engineering | The standalone tracker assumes reuse; this doc assumes fresh. Middle path: lift-and-shift to unblock domain/auth, then rebuild domain by domain. |
| 2 | Final product name and subdomain | Product | Must be a gokwik.in subdomain for the session cookie |
| 3 | Gateway CORS for the new origin, with credentials | Backend / Platform | Blocks login and every API call |
| 4 | Login/session endpoints callable from the new origin | Backend | Includes a reliable "who am I" check |
| 5 | Where the assistant backend lives, model, cost limits | Engineering, Backend | |
| 6 | Permission list for commands | Backend | Keys declared on commands; enforcement off in v1 (gk-pages checks none today); staff UI out of scope |
| 7 | Design: navigation, tokens, components | Design, Product | Two-level nav, global search in v1 |
| 8 | Hosting and CI (S3/CloudFront, previews) | Platform | |
| 9 | Do any APIs bypass the gateway today (uploads, direct hosts)? | Ashish, Backend | Need a list before step 1 |
| 10 | Arya: core feature or installed app? | Product | Changes where it is built and how it gets permissions |
| 11 | Sales channels (Amazon, Flipkart, Myntra…) per product: backend support? | Backend, Product | Shown on product editor |
| 12 | APIs for onboarding checklist, checkout connect, shipping zones, domains | Backend | New in the design; not in gk-pages today |
| 13 | Notifications source (poll or push) | Backend | Bell is capability off until then |
| 15 | Staff activity log: where command audit events are stored and shown | Product, Backend | v1 sends them to PostHog only |
| 16 | Fix the data-affecting defects in today's writes | Product, QA | List in [commands README](../commands/README.md#defects-in-todays-writes); product bulk edit price bug first |
| 14 | Business-logic changes the design implies (GST rate, tax split, MRP label, marketplaces, inventory history, variant save, validations) | Product | Kept as today in v1; list and seams in [deferred.md](../schema/deferred.md#b-business-logic-keep-todays-behaviour-change-only-with-product-sign-off) |

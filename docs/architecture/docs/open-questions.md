# Open questions

[← Architecture](../README.md)

| # | Question | Owner | Notes |
|---|---|---|---|
| 2 | Final product name and subdomain | Product | Must be a gokwik.in subdomain for the session cookie |
| 3 | Gateway CORS for the new origin, with credentials | Backend / Platform | Blocks login and every API call |
| 4 | Login/session endpoints callable from the new origin | Backend | Includes a reliable "who am I" check |
| 5 | Where the assistant backend lives, model, cost limits | Engineering, Backend | |
| 6 | Permission list for commands | Backend | Keys declared on commands; enforcement off in v1 (gk-pages checks only the two Ratio Reports permissions today); staff UI out of scope |
| 7 | Design: navigation, tokens, components | Design, Product | Two-level nav, global search in v1 |
| 8 | Hosting and CI (S3/CloudFront, previews) | Platform | |
| 9 | Do any APIs bypass the gateway today (uploads, direct hosts)? | Ashish, Backend | Need a list before step 1 |
| 10 | Arya: core feature or installed app? | Product | Changes where it is built and how it gets permissions |
| 11 | Sales channels (Amazon, Flipkart, Myntra…) per product: backend support? | Backend, Product | Shown on product editor |
| 12 | APIs for onboarding checklist, checkout connect, shipping zones, domains | Backend | New in the design; not in gk-pages today |
| 13 | Notifications source (poll or push) | Backend | Bell is capability off until then |
| 15 | Staff activity log: where command audit events are stored and shown | Product, Backend | gk-pages already posts field-level change records to the Audit Service (`AUDIT_SERVICEURL`); v1 sends command events to PostHog only |
| 16 | Fix the data-affecting defects in today's writes | Product, QA | List in [commands README](../commands/README.md#defects-in-todays-writes); product bulk edit price bug first |
| 14 | Business-logic changes the design implies (GST rate, tax split, MRP label, marketplaces, inventory history, variant save, validations) | Product | Kept as today in v1; list and seams in [deferred.md](../domain/deferred.md#b-business-logic-keep-todays-behaviour-change-only-with-product-sign-off) |
| 20 | OpenAPI specs for os-order, item, inventory, os-customer, discount V2, bulk-ops? | Backend | Upgrades the [gateway API docs](../gateway/README.md) from inferred to confirmed; otherwise sandbox HAR captures |
| 21 | Does the server need `POST /team/switch-merchant` when every call already carries `merchant-mid`? Does it break two tabs on different stores? | Backend | Decides whether store switching is per tab ([merchant context](../platform/auth-session.md#merchant-context)) |
| 22 | What does `@gokwik/utilities` `makeAPICall` do exactly: headers added, envelope unwrapped, errors swallowed? | Dashboard team | The new client must match it; the package isn't in either repo |
| 23 | Tracker defaults never ratified: PR ≤ 400 lines, component ~150 lines, kit change SLA 1–2 days, uptime check per minute, MSW and no snapshot tests | Engineering | Promote or drop; listed in the tracker's decision log §4 |

## Decided

| Was | Decision |
|---|---|
| #1 Convert gk-pages in place or new codebase | New codebase ([ADR 0002](../adr/0002-new-codebase.md)) |
| #17 Response validation scope | Every response, one way ([ADR 0004](../adr/0004-validate-every-response.md)) |
| #19 Default cache policy | `balanced`, 30 s / 60 s, behind the switch ([ADR 0005](../adr/0005-cache-policy-switch.md)) |
| #18 Where team docs live | This repo for now; can move later as a whole ([ADR 0002](../adr/0002-new-codebase.md#docs)) |

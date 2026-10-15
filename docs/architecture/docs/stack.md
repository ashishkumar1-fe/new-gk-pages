# Stack

[← Architecture](../README.md)

Proposed. Each choice lists the main alternative we considered.

| Concern | Choice | Why | Alternative |
|---|---|---|---|
| App | React + TypeScript (strict) | Team skills, ecosystem | Svelte |
| Build | Vite | Fast dev, simple config, route splitting | Next.js (not needed: admin behind login, no SEO) |
| Routing | TanStack Router | Typed routes and search params, so URL state is safe | React Router |
| Server data | TanStack Query | Cache, dedupe, retry, invalidation, optimistic updates | RTK Query |
| Tables | TanStack Table | Headless, works with our own components | AG Grid |
| Forms | React Hook Form + Zod | Already used; schema shared with API and commands | TanStack Form |
| Flows | XState v5 | Explicit states for multi-step flows | Zustand + reducers |
| UI state | Zustand (small) | Only for a few global UI flags | React context |
| Components | Radix + Tailwind | Accessible primitives, own look | shadcn/ui as a starting copy |
| Errors | Sentry | Already used in the org | — |
| Product analytics | PostHog | Already used; events, flags, Web Vitals | — |
| Unit tests | Vitest + Testing Library | Fast, Vite-native | Jest |
| E2E tests | Playwright | Real flows across browsers | Cypress |
| Lint/format | ESLint + Prettier (or Biome) | Standard | — |

---
name: new-resource
description: Add a new entity (resource) to Ratio across every layer, the house way.
---
1. `npm run new:resource <name>`; answer service, cache class, route.
2. Record a sandbox response into `src/api/<service>/fixtures/<name>.list.json`; shape `<name>.wire.ts` from it; write `transformer.ts` (wire → domain, new object).
3. Port rules into `src/domain/<name>/rules.ts`, each with the gk-pages source line and a test.
4. Fill `src/resources/<name>.ts` by copying `src/resources/product.ts`. Do not write a page.
5. Commands: one card per action in `src/commands/<name>.ts`; reference ids from the resource.
6. `npm test && npm run typecheck && npm run lint`. Done means: docs/architecture/docs/build-order.md#done-means.

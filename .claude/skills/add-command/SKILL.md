---
name: add-command
description: Add one action (command card) and expose it on the right surfaces.
---
1. Copy a card from `src/commands/product.ts`. Set `id` (`resource.verb`, stable forever), `input` (Zod), `fromContext`, `form` (what the user still gives), `scope`, `visible`/`enabled` from domain rules, `permission`, `effect` flags, `confirm`, `mode`, `steps` (call `deps.api.*` only), `invalidates`, `onSuccess`, `expose`.
2. Add the id to the resource's `commands.page/row/bulk/more`.
3. Test: assert the exact endpoint and payload (recorded gk-pages payload), the confirm, and the invalidations.

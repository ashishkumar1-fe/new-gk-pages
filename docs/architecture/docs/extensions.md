# Extensions

[← Architecture](../README.md)

Today GK supports two kinds of third-party UI. Both carry over.

| Kind | Today | In the new admin |
|---|---|---|
| **UI extensions** | Sandboxed worker code (`gokwik-ui-extensions-core/host/rpc`), rendered into an `ExtensionPoint` | Same runtime; targets declared on resources |
| **Embedded apps** | Iframe with an app bridge (title bar, modal messages) | The [bridge](#bridge) at `/store/$storeId/apps/$handle/*`, plus toast, save bar (joins the leave guard), resource picker, redirect and sidebar entries under Apps |

## Changes

- **Targets come from resources**, with today's names: `admin.product-details.block.render`, `admin.product-details.sidebar.render`, `admin.product-details.action.render` ([product](../resources/defs/product.md#other)). Today `ExtensionPoint` is placed by hand and used only in the product form.
- **Actions go through commands.** Extension-added actions appear in record or selection menus; calls to built-in commands go through `runCommand` with the app as actor ([surfaces](../commands/surfaces.md#extensions)).
- **Context is typed.** Each target declares the context it passes, validated by its schema.

## Rules

- One crashing extension never breaks the page (error boundary per extension).
- Extensions never get the session token or direct API access; an embedded app gets an `appstore` token from the [broker](../platform/auth-session.md#app-tokens) in `INIT`, never in a URL.

## Bridge

Platform `embed` carries every iframe conversation (visual editor, bundle app, embedded apps); the [Embed machine](machines.md#embed) drives it.

- Envelope `{ v, kind: req | res | evt, id, type, payload }`, one Zod union per direction; unknown types are dropped and logged.
- A message counts only if `event.origin` is the embed's registered origin exactly and `event.source` is its iframe; replies name that origin, never `'*'`.
- Handshake READY → INIT (store, context, token) → ACK; INIT is resent on the iframe's `load`. Every request gets one response or times out.
- Navigation only to in-app paths under the app's base; remote redirects `https:` only. An embed never changes `storeId` (today the bundle app can rewrite `merchant-mid`, and an app can redirect to `javascript:`).
- Sandbox without `allow-top-navigation`; a store switch remounts the iframe.

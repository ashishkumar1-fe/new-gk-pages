# Extensions

[← Architecture](../README.md)

Today GK supports two kinds of third-party UI. Both carry over.

| Kind | Today | In the new admin |
|---|---|---|
| **UI extensions** | Sandboxed worker code (`gokwik-ui-extensions-core/host/rpc`), rendered into an `ExtensionPoint` | Same runtime; targets declared on resources |
| **Embedded apps** | Iframe with an app bridge (title bar, modal messages) | Same bridge at `/store/$storeId/apps/$handle/*`, plus toast, save bar (joins the leave guard), resource picker, redirect and sidebar entries under Apps |

## Changes

- **Targets come from resources**, with today's names: `admin.product-details.block.render`, `admin.product-details.sidebar.render`, `admin.product-details.action.render` ([product](../resources/defs/product.md#other)). Today `ExtensionPoint` is placed by hand and used only in the product form.
- **Actions go through commands.** Extension-added actions appear in record or selection menus; calls to built-in commands go through `runCommand` with the app as actor ([surfaces](../commands/surfaces.md#extensions)).
- **Context is typed.** Each target declares the context it passes, validated by its schema.

## Rules

- One crashing extension never breaks the page (error boundary per extension).
- Extensions never get the session token or direct API access. How an embedded app proves who the user is to its own backend (an app-scoped token, as App Bridge does) is open.

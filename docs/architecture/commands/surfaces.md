# Surfaces

[← Commands](README.md)

Every surface asks the registry "which commands apply here?" and calls `runCommand`. None has its own write logic.

| Surface | Finds commands by | Context given | Notes |
|---|---|---|---|
| Page header | Resource `commands.page` | route | Primary action rightmost |
| Record header | Resource `commands.primary` + `commands.more` | record | Primary and More menu can change with record status |
| Row menu | Resource `commands.row` | record (row) | Only commands with `scope: 'record'` |
| Bulk bar | Resource `commands.bulk` | selection | Count in labels; conditional commands check the whole selection |
| Editor save bar | Resource `editor.save` | record + draft | Save / Discard; `mod+s` |
| ⌘K palette | All palette-exposed, visible, permitted commands | route, record, selection | See below |
| Shortcuts | `shortcut` on visible commands | current screen | Shown in menus and ⌘K |
| Assistant | Assistant-exposed commands, by topic | route, record, selection, filters | See below |
| Extensions | Extension-exposed commands | record or selection | See below |

## ⌘K palette

- Order: commands for the current record or selection first, then the current resource, then global navigation and search results.
- Matching on label, keywords and resource name.
- Disabled commands show with their reason instead of disappearing.
- A command that needs input opens its form inside the palette or as a dialog.
- Recent commands are remembered per user.

## Assistant

The assistant is a surface over the same commands. It proposes, the person approves.

**Tools.** Generated from commands with `expose.assistant`:

```
name         command ID ("order.cancel")
description  description + topic instructions
inputSchema  JSON schema from the command's input
annotations  readOnlyHint      ← effect.readOnly
             destructiveHint   ← effect.destructive
             idempotentHint    ← effect.idempotent
             openWorldHint     ← effect.external
```

Read tools come from resources (list, get, search) with their `assistant.readableFields`.

**Topics.** Commands are grouped by topic (orders, catalog, inventory, customers, discounts). The assistant gets the tools of the topic in play plus read tools, not every command at once, which keeps choices precise.

**Proposal flow.**

```
user asks → assistant picks a command and fills input
          → proposal card: action, target(s), the filled form with AI-filled fields highlighted
          → user edits or approves (destructive: second confirm)
          → runCommand(surface: 'assistant')
          → result shown in the conversation, with links to affected records
```

- No write runs without the person's approval in that conversation.
- The assistant can only propose what the person may do (same permissions, enablement and capability).
- Bulk proposals list the target records before approval.
- Every assistant run is audited with the conversation and the approved proposal.

## Extensions

Installed apps can add commands and call allowed ones.

- **Adding.** An app registers commands for a target: `record` (a details page More menu) or `selection` (an index page bulk bar), with a should-render check per record. They appear like built-in commands and run inside the extension sandbox.
- **Calling.** An app can call built-in commands exposed to extensions, through the same `runCommand`, with the app as the actor and the merchant's confirmation for anything not read-only.
- Apps never receive session tokens or call write endpoints directly.

## Keyboard

- Shortcuts are bound to command IDs, scoped to the screens where the command is visible.
- `mod+k` opens the palette; `mod+s` saves the editor; `?` lists shortcuts for the current screen.
- Shortcuts never fire inside text inputs unless they use a modifier.

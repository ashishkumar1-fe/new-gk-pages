# UI kit

[← Architecture](../README.md)

Our own components on Radix primitives, styled with Tailwind and design tokens. Replaces gokwik-ui-kit (antd wrapper).

Source of truth for tokens and visuals: the **Ratio design system** (colors, typography, spacing, effects) from the design project.

## Layers

| Level | Examples |
|---|---|
| **Tokens** | color, type, spacing, radius, shadow (CSS variables) |
| **Primitives** | Button, Input, Select, Checkbox, Dialog, Popover, Tooltip, Tabs, Toast |
| **Patterns** | DataTable, FilterBar, BulkBar, Save bar, Form sections, Settings sheet, Empty/Error/Loading states, Page header |
| **Shell** | Sidebar, Top bar, Command palette, Assistant panel, Jobs indicator, Proposal card |

## Rules

- Feature code uses patterns and primitives, never raw Radix.
- Every component has loading, empty, error and disabled states.
- Keyboard and screen-reader support are part of "done".
- Docs: a `/playground` route, built only into non-prod, shows every component, variant and a snippet.

## Governance (d38)

- `src/ui/` is read-only for feature work; CODEOWNERS (`@kit-owners`) must approve any change.
- Closed APIs: a fixed list of variants and no `className` / `style` passthrough, so a new look can only come from a kit change. Raw hex outside the kit fails lint.
- Lint bans raw `<button>` / `<input>` / `<select>`, kit-internal imports and look-alike components in features.
- Need a variant? Open a "UI kit change request" issue; approved changes appear in the playground.
- Stays an in-repo folder until a second app needs it or bypasses keep recurring.

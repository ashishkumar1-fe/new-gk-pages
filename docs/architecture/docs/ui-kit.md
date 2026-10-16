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
- A Storybook-lite route documents each shared component.

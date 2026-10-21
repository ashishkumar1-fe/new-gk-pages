# UI kit

[← Architecture](../README.md)

Our own components on Radix primitives, styled with Tailwind and design tokens. Source of truth for tokens and visuals: the **Ratio design system** from the design project. Logic lives in the layers below; the kit only draws.

## Levels

| Level | Contents |
|---|---|
| **Tokens** | Design-system palette, then roles components use: accent, critical, success, warning, info, neutral, focus ring, overlay. Type, spacing, radius, control heights, motion (120 ms), ring (no shadows), z-layers |
| **Primitives** | Layout: Stack, Grid, Card, Divider · Actions: Button (incl. critical, icon-only), Link, DropdownMenu · Form: Field, TextField, Textarea, NumberField (prefix, suffix), Select, Combobox, TagInput, Checkbox, Radio, Switch, DatePicker, RichText, MediaGrid · Feedback: Badge, Banner, Spinner, Skeleton, ProgressBar, Toast · Overlays: Dialog, ConfirmDialog, Drawer, Popover, Tooltip · Data: DataTable (TanStack Table), Pagination, Tabs, Stepper, Timeline, EmptyState, Avatar, Kbd, Icon |
| **Patterns** | PageHeader, PageLayout (65/35), FormSection, SaveBar, FilterBar, BulkBar, Picker, ResultSummary |
| **Shell** | Frames only: AppFrame, Sidebar, TopBar, CommandPalette, SidePanel, Sheet |

Surfaces fill and wire them: resource pickers, palette sources, nav gating, the assistant panel and proposal card (`assistant/`), the jobs indicator, the toast queue, the form adapter (React Hook Form → `Field`), `confirm()` and formatter calls ([pages](../surfaces/pages.md)).

## Rules

- **Presentational only.** Props in, events out; the kit imports nothing from the app ([structure](structure.md#layers-and-imports)). Interactive state is controlled (`value` / `onChange`, `open` / `onOpenChange`); internal state only for focus, hover, open.
- **Never formats or decides.** Money and dates arrive as strings from domain formatters; surfaces map a status to a tone. Built-in copy has English defaults, overridable by a `labels` prop.
- Every pattern takes loading, empty, error and disabled states as props.
- WCAG 2.2 AA and the WAI-ARIA keyboard patterns are part of "done".
- `/playground`, built only into non-prod, shows every component and variant; axe runs on each, and Playwright compares screenshots.
- Icons: lucide, plus one wrapper for brand SVGs. Rich text: today gk-pages uses react-quill-new; the library is picked at implementation.

## Governance (d38)

- `src/ui/` is read-only for feature work; CODEOWNERS (`@kit-owners`) approves changes, requested by a "UI kit change request" issue and shown in the playground.
- Closed APIs: a fixed list of variants and no `className` / `style` passthrough, so a new look can only come from a kit change.
- Lint (errors, not warnings): raw hex, raw px, Tailwind arbitrary values (`bg-[#…]`) and fonts other than Inter outside the kit; raw `<button>` / `<input>` / `<select>`; kit-internal imports; look-alike components. Ideas taken from the design system's adherence lint, rewritten for our ESLint.
- Stays an in-repo folder until a second app needs it or bypasses keep recurring.

# Assistant

[← Architecture](../README.md)

An in-app AI panel, similar to Rovo in Jira. It reads what the user is looking at and can propose actions. The user confirms every write.

The design names it **Arya**: a side panel that stays open while the user moves between pages ([chrome](../surfaces/chrome.md)). It is another surface over the same contracts; the conversation loop is the [assistant machine](machines.md#assistant).

## Screen context

Sent with each message so "refund these" works:

- current route and resource,
- active filters (from the URL),
- selected row ids,
- open record id.

A chip above the input shows what is shared; the user can remove it.

## Results

| Result | Shown as |
|---|---|
| Text | Streamed message, with Stop |
| Records (list, get, search) | Record cards or a table with links; more than a few rows opens the list page with those filters |
| "Show me…" | Navigates or sets URL filters; no write, no approval |
| Write | [Proposal card](../commands/surfaces.md#assistant) |
| Command result | Outcome with links to affected records |
| Error | Message with Retry |

Unknown result types fall back to text.

## Rules

Tools, topics, the proposal flow and approval rules: [commands › surfaces](../commands/surfaces.md#assistant).

- LLM calls and API keys stay on the backend; the browser streams responses.
- No "auto-approve" in v1.

## Open

Core feature or installed app, backend, model and cost limits: [open questions](open-questions.md) #5, #10.

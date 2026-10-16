# Assistant

[← Architecture](../README.md)

An in-app AI panel, similar to Rovo in Jira. It reads what the user is looking at and can propose actions. The user confirms every write.

The design names it **Arya**: a side panel that stays open while the user moves between pages. Its conversation state lives at the app root, not in a page.

## How it fits

The assistant is another surface over the same contracts. It gets no special access.

The conversation loop is the [assistant machine](machines.md#assistant).

## Screen context

Sent with each message so "refund these" works:

- current route and resource,
- active filters (from the URL),
- selected row ids,
- open record id.

## Rules

Tools, topics, the proposal flow and approval rules: [commands › surfaces](../commands/surfaces.md#assistant).

- LLM calls and API keys stay on the backend; the browser streams responses.
- No "auto-approve" in v1.
- Tool results are rendered as UI (tables, record cards), not only text.

## Open

- Is Arya part of the core product or an installed app? The design lists it under Settings → Apps.
- Which backend hosts the assistant endpoint (see [open-questions.md](open-questions.md)).
- Model and cost limits per merchant.

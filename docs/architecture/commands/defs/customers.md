# Customer commands

[← Commands](../README.md) · Resources: [customer](../../resources/defs/customer.md), [segment](../../resources/defs/segment.md) · Service: os-customer. Paths are relative to `{CUSTOMER}/api/v1/admin` unless they start with a token ([base URLs](../../platform/api-client.md#base-urls)).

Permission: `write_customers` for every command (enforcement off in v1).

Effect: R read-only · D destructive · I idempotent · X external. Mode: P pessimistic · O optimistic. Writes carry `staffId`, `staffName` (camelCase for this service; os-customer rejects unknown fields).

## Customer

| Command | Scope | Steps | Confirm | Effect | Mode | After |
|---|---|---|---|---|---|---|
| `customer.create` | page | 1 `POST /customers`; 2 `POST /addresses` default first, then others | — | — | P | toast "Customer created"; open detail (today: list) |
| `customer.update` | record | 1 `PUT /customers/:id` (if fields or custom fields changed); 2 per changed address `PUT /addresses/:id` or `POST /addresses` | — | — | P | toast "Customer updated"; set detail |
| `customer.deleteAddress` | record | `DELETE /addresses/:id` | "Delete this address?" | D | P | invalidate addresses |
| `customer.setBlocked` | record | `PATCH /customers/:id/status` `{isBlocked}` | "Disable this customer account?" / "Are you sure you want to enable this account?" | I | P | toast "Customer account disabled / enabled" |
| `customer.delete` | record | `DELETE /customers/:id` | critical: "Delete this customer? This can't be undone." (list row only) | D | P | toast; invalidate list |
| `customer.comment` | record | `POST {KWIKPASS_CUSTOMER}/v1/admin/customers/:id/comment` `{message, visibility}` | — | — | P | invalidate timeline |
| `customer.export` | page | current page: CSV in the browser; all: job below | — | R | P (job) | open file when ready |

Notes:
- `customer.create` step 2 failing after step 1: customer exists; result reports which addresses failed and offers retry for them (no delete of the customer).
- Custom fields are not sent on create, as today; they are available after the first save.
- Label of `customer.setBlocked` depends on state: "Disable account" / "Enable account".
- Export input: `{ scope: 'page' | 'all', format, includeTags, includeMetafields }`; "all" ignores current filters, as today. The job is polled every 3 s, ≤ 20 times ([gateway](../../gateway/os-customer.md)).
- Import exists in the API but has no UI today; not in v1.

## Segment

| Command | Scope | Steps | Confirm | Effect | Mode | After |
|---|---|---|---|---|---|---|
| `segment.create` | page | `POST /customer-segments?merchantId=` `{name, description, conditions, conditionLogic}` | — | — | P | toast "Segment created"; go to list |
| `segment.update` | record | `PUT /customer-segments/:id?merchantId=` | — | I | P | toast "Segment updated"; go to list |
| `segment.delete` | record | `DELETE /customer-segments/:id` | critical: "Delete this segment?" | D | P | toast; invalidate list |

## Exposure

| Command | Palette | Assistant | Extensions |
|---|---|---|---|
| create, update, comment, export, segment.create, segment.update | ✓ | ✓ (topic: customers) | update, comment: record targets |
| setBlocked, delete, deleteAddress, segment.delete | ✓ | — | — |

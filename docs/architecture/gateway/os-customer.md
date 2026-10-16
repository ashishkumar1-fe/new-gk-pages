# os-customer

[← Gateway](README.md)

Base `{CUSTOMER}` (`REACT_APP_CUSTOMER_BASE_URL`); paths relative to `/api/v1/admin` unless shown as full (leading `~`). Case: camelCase. Money: rupees as plain numbers (`totalSpent`, `averageOrderValue`, rendered `₹${totalSpent}`); the KwikPass host types them as `string`. Envelope: `{ success, statusCode, status_code, statusMessage, message, data, error, errors }`; Response column shows it as `{ data: … }`.

- Headers: `merchant-mid` + `gk-merchant-id` (modules/customers via `makeApiCall`); segments send `merchant-mid` only, plus `?merchantId=`; export sends `merchant-id`.
- Soft failure: `makeAPICall` resolves `{ success: false, message }` instead of throwing; every wrapper here maps that to `{ status: { success: false, code: 500 } }`. No handled error codes.
- Staff identity: writes marked *staff* spread `StaffBody` into the body (os-customer DTOs run `forbidNonWhitelisted`; snake_case would 400).
- `field?` in a table cell = inferred from usage; `?:` in a type block = optional in the typed interface.

```ts
interface StaffBody { staffId?: string; staffName?: string }   // omitted when empty
```

## Customers

Source: `modules/customers/api.ts`, `modules/customers/type.ts`

| Endpoint | Request | Response |
|---|---|---|
| `POST /customers/filter` | `CustomerFilterPayload` | `{ data: { customers: Customer[], total, page, limit } }` |
| `GET /customers/:customerId` | — | `{ data: { customer: Customer } }` (reader falls back to `data` as the customer) |
| `POST /customers` | `CustomerFormData & StaffBody` | `{ data: { customer: Customer, id?: string } }` |
| `PUT /customers/:customerId` | `Customer & { metafields?: CustomerMetafieldPayload[] } & StaffBody` | `{ data: { customer: Customer } }` |
| `PATCH /customers/:customerId/status` | `{ isBlocked: boolean }` | `{ data: { customer: Customer } }` |
| `DELETE /customers/:customerId` | — | not read |

```ts
interface FilterCondition { field: string; operator: 'equals' | 'contains' | 'contains_any' | 'greater_than' | 'less_than' | 'between'; value: string | number | boolean | string[] }
interface CustomerFilterPayload { conditions?: FilterCondition[]; conditionLogic?: 'AND' | 'OR'; page: number; limit: number; sortBy: string; sortOrder: string; search?: string; tags?: string[]; hasEmailSubscription?: boolean }
interface Customer {
  id: string; firstName: string; lastName: string; email: string; phone: string; company: string
  totalOrders: number; totalSpent: number; averageOrderValue: number   // rupees
  tags: string[]; notes: string; language: string; taxSetting: string
  hasEmailSubscription: boolean; hasPushSubscription: boolean; hasSmsSubscription: boolean
  isBlocked: boolean; isDeleted: boolean; emailDomain: string | null
  createdAt: string; updatedAt: string; firstOrderDate: string | null; lastOrderDate: string | null
  abandonedCheckoutDate: string | null; anniversaryDate: string | null
  defaultAddress: { city?: string; country?: string; address1?: string; address2?: string; zip?: string; province?: string } | null
}
interface CustomerFormData { firstName: string; lastName: string; email: string; phone?: string; tags: string[]; company: string; language: string; notes?: string; hasEmailSubscription: boolean; hasSmsSubscription: boolean; taxSetting: string; totalOrders?: number; totalSpent?: number; averageOrderValue?: number }
interface CustomerMetafieldPayload { metafield_id?: string; namespace: string; name?: string; key: string; value: string | null; data_type: string; metafield_definition_id?: string }   // snake_case inside camelCase body; backend diffs create/update/delete from the array
```

- `PUT` sends the whole `Customer` back (read-only counters included), not a patch.
- Disable/enable is `PATCH …/status`, reversible; `DELETE` is separate.

## Addresses

Source: `modules/customers/api.ts`, `modules/customers/type.ts`

| Endpoint | Request | Response |
|---|---|---|
| `GET /addresses?customerId=&page=&limit=` | query; defaults `page=1`, `limit=10` | `{ data: { addresses: CustomerAddress[] } }` |
| `POST /addresses` | `AddressWrite & { customerId } & StaffBody` | `{ data: { address: CustomerAddress } }` |
| `PUT /addresses/:addressId` | `AddressWrite & { customerId } & StaffBody` (`id` stripped from body) | `{ data: { address: CustomerAddress } }` |
| `DELETE /addresses/:addressId` | — | not read |

```ts
interface AddressWrite { firstName: string; lastName: string; address1: string; address2?: string; city: string; province: string; country: string; zip: string; phone: string; isDefault: boolean; company?: string; countryCode?: string }
interface CustomerAddress extends AddressWrite { id: string; customerId: string; company?: string | null; countryCode?: string | null; email?: string | null; provinceCode?: string | null; createdAt?: string; updatedAt?: string; isDeleted?: boolean; oldId?: string | null }
```

- Form model (`address`, `state`, `pinCode`) differs from wire (`address1`, `province`, `zip`); the UI maps before calling.
- No default-address endpoint: default is `isDefault` on the write.

## Comments

Source: `modules/timeline/api/timeline.api.ts`

Base `{KWIKPASS_CUSTOMER}` (`REACT_APP_KWIKPASS_CUSTOMER_API_URL`), paths relative to `/v1/admin`.

| Endpoint | Request | Response |
|---|---|---|
| `POST /customers/:customerId/comment` | `{ message: string, visibility: string /* default 'internal' */ } & StaffBody` | `{ success, message }` only |

- Emits a `COMMENT_ADDED` customer event; os-timeline writes the row.
- camelCase `staffId`/`staffName` here; os-order comments use snake_case.

## Segments

Source: `modules/customer-segments/api.ts`, `modules/customer-segments/type.ts`

Every call appends `?merchantId=<merchant-mid>`.

| Endpoint | Request | Response |
|---|---|---|
| `GET /customer-segments` | query `{ page, limit, sortBy, sortOrder }` | `{ data: { segments: CustomerSegment[], total, page, limit } }` |
| `GET /customer-segments/:segmentId` | — | `{ data: { segment: CustomerSegment } }` |
| `POST /customer-segments` | `SegmentFormData` | `{ data: { segment: CustomerSegment, id?: string } }` |
| `PUT /customer-segments/:segmentId` | `SegmentFormData` | `{ data: { segment: CustomerSegment } }` |
| `DELETE /customer-segments/:segmentId` | — | not read |
| `GET /customer-segments/:segmentId/customers` | query `{ page=1, limit=10, sortBy='createdAt', sortOrder='desc' }` | `{ data: { customers: Customer?[], total, page, limit } }` |

```ts
interface SegmentCondition { field: string; operator: string; value: string | number | boolean | string[] }
interface CustomerSegment { id: string; name: string; description: string; customerCount: number; conditions: SegmentCondition[]; isActive: boolean; createdAt: string; updatedAt: string }
interface SegmentFormData { name: string; description: string; conditions?: SegmentCondition[]; conditionLogic?: string }
```

- Segment members are typed `any[]`; the screen renders them as `Customer`.
- No staff identity on segment writes.

## Export and import

Source: `utils/customers.ts`

| Endpoint | Request | Response |
|---|---|---|
| `POST /customers/export` | `{ merchantId, format: 'excel' \| 'csv', conditions: [{ field: 'id', operator: 'in', value: '<id>,<id>' }] \| [], conditionLogic: 'AND', sortBy: 'totalSpent', sortOrder: 'desc', tags: 'all' \| '', includeMetafields: boolean }` | `{ data: { id? } }` |
| `GET ~/api/v1/exports/:exportId` | — (polled every 3 s, max 20) | `{ data: { success?, status?, data: { fileUrl?, status? /* 'completed' \| 'failed' */ } } }` |
| `POST ~/v1/customers/import` | multipart `file`, `merchantId` | not read |

- Export: `operator: 'in'` and a comma-joined `value` string are outside `FilterCondition`; `tags` is a string, not `string[]`.
- Export status is double-nested (`data.data.status`); failure is `data.success === false` or `status === 'failed'` at either level.
- Import path drops the `/api` prefix and the `/admin` segment.

## KwikPass customer host

Source: `services/customerService.ts`, `modules/discounts/api.ts` (pickers)

Base `{KWIKPASS_CUSTOMER}` (`REACT_APP_KWIKPASS_CUSTOMER_API_URL`), paths relative to `/v1/admin`. Header `merchant-mid` only (`Merchant-mid` on create). Used by the order page's customer section and the discount pickers.

| Endpoint | Request | Response |
|---|---|---|
| `POST /customers/filter` | `ICustomerQueryPayload`; order page: six `contains` conditions (`email`, `firstName`, `lastName`, `phone`, `company`, `tags`), `conditionLogic: 'OR'`, `sortBy: 'totalSpent'` | `{ data: { customers: ICustomer[], total, page, limit } }` |
| `GET /customers/:customerId` | — | `{ data: ICustomer }` |
| `POST /customers` | `{ firstName, lastName, phone, email, company }` (`''` defaults) | `{ data: { id? } }` |
| `PUT /customers/:customerId?merchantId=` | `{ firstName?, lastName?, phone?, email?, company? } & StaffBody & { skipTimeline?: true }` | `{ data: { email?, phone? } }` |
| `GET /addresses` | query `{ customerId, merchantId, page, limit }` | `{ data: { addresses: CustomerAddress?[], total? } }` |
| `POST /addresses` | `AddressWrite & { customerId } & StaffBody & { skipTimeline?: true }` | `success` only? |
| `PUT /addresses/:addressId` | `AddressWrite & { customerId } & StaffBody & { skipTimeline?: true }` | `success` only? |
| `GET /customer-segments?merchantId=` | — | `{ data: { segments: ICustomerSegment[] } }` |
| `GET /customer-segments/:segmentId?merchantId=` | — | `{ data: ICustomerSegment }` |

```ts
interface ICondition { field: 'totalSpent' | 'tags' | 'email' | 'phone' | 'firstName' | 'lastName' | 'name' | 'company' | 'address' | 'createdAt'; operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'contains' | 'contains_any'; value: number | string | string[] }
interface ICustomerQueryPayload { conditions: ICondition[]; conditionLogic: 'AND' | 'OR'; page: number; limit: number; sortBy: ICondition['field']; sortOrder: 'asc' | 'desc' }
interface ICustomer extends Omit<Customer, 'totalSpent' | 'averageOrderValue' | 'defaultAddress' | 'notes' | 'taxSetting'> { totalSpent: string; averageOrderValue: string; defaultAddress: any | null }
interface ICustomerSegment { id: string; name: string; description: string; conditionLogic: string; conditions: Record<string, any>[]; createdAt: string; updatedAt: string }
```

- Same resources as `{CUSTOMER}` on a different host and prefix; the single-customer read is unwrapped (`data` is the customer, not `{ customer }`).
- `skipTimeline: true` in the body (not a header: CORS) suppresses the customer-timeline event when os-order's mirror records it.
- `defaultAddress` here carries `firstName`, `lastName`, `company`, `phone` as well (read by the order page).
- Address update must use `PUT /addresses/:id`; falling back to create duplicates the row and logs `ADDRESS_ADDED`.
- `createCustomer` rethrows on failure; the other service functions log and return `undefined`.

## Unused

Keys in `apiEndpoints.ts` with no call site.

| Key | Path |
|---|---|
| `customerAndSegments.exportCustomers` | `api/v1/customers/export` (no leading slash) |
| `customerAndSegments.customerAddresses` | `/api/v1/admin/addresses/customer` |
| `customerAndSegments.createSegment` | `/api/v1/admin/customer-segments` (calls use `segments`) |
| `customers.exportCustomers` | `{KWIKPASS_CUSTOMER}/v1/customers/export` |

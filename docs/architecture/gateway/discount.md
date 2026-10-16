# discount

[← Gateway](README.md)

Two services. Discount V2 base `{BASE}/dashboard/v2/discount` (`REACT_APP_BASE_URL`, dashboard gateway). os-discount base `{DISCOUNT}` (`REACT_APP_KWIKPASS_DISCOUNT_API_URL`); paths relative to `/api/v1/admin/os-discount`, joined with `joinApiUrl` (collapses a duplicate `/api` when the base already ends in it). Case: snake_case. Money: V2 in **paise** (×100: `amount` unless `method: 'PERCENT_OFF'`, `max_discount`, `min_value`, `max_value`); os-discount v1 also in paise (the legacy transformer multiplies form values by 100). Envelope: `{ success, status_code, message, data }`; Response column shows it as `{ data: … }` (V2 and AI wrappers unwrap with `data.data ?? data`).

- Headers: `merchant-mid` + `gk-merchant-id` only. No custom headers (gateway CORS allowlist rejects them; preflight fails as "CORS error").
- Scoping: merchant in body `merchant_id` (V2, sets) or query `?merchant_id=` (V2 get); V2 merchant-config takes it from headers.
- Soft failure: `makeAPICall` resolves `{ success: false, message, data: <BE body> }` instead of throwing; wrappers return `{ status: { success: false, code: 500 } }`. Exceptions noted per group.
- `field?` in a table cell = inferred from usage; `?:` in a type block = optional in the typed interface.

## Discount V2 (gateway)

Source: `modules/discounts/v2/api.ts`, `modules/discounts/v2/type.ts`, `modules/discounts/api.ts` (list, status, delete via `DISCOUNT_V2_BASE`)

| Endpoint | Request | Response |
|---|---|---|
| `POST /create` | `CreateDiscountV2Request` | `{ data: DiscountV2 }` |
| `GET /:id?merchant_id=` | — | `{ data: DiscountV2 }` |
| `PUT /update/:id` | `Partial<CreateDiscountV2Request>` | `{ data: DiscountV2 }` |
| `POST /fetch` | `FetchDiscountsV2Params`; listing table sends `IDiscountsRequest & { page, limit, pageSize }` | `{ data: { data: DiscountV2[], pagination: { total, current_page, total_pages, limit } } }` |
| `PUT /bulk/update` | `{ merchant_id, discount_ids: string[], status?: 'published' \| 'draft' \| 'inactive' \| 'deleted', visibility?, updated_by? }` | not read |
| `POST /check-code` | `{ code, merchant_id }` | `{ data: { exists: boolean } }` |
| `GET /merchant-config` | — | `{ data: MerchantDiscountConfig? }` |
| `PUT /config/merchant/upsert` | `MerchantDiscountConfig & { merchant_id, updated_by: '' }` | not read |
| `GET {BASE}/api/dashboard/merchant-config` | — | `{ data: { payment_methods?, shipping_prices?, show_tiered_prepaid_discount? } }` ([dashboard](dashboard.md)) |

```ts
type DiscountTypeV2 = 'CART' | 'BXGY' | 'BUNDLE' | 'DYNAMICTIER'
type CartAmountReference = 'SUBTOTAL' | 'TO_PAY'
interface ProductMatcherV2 { match_by: 'Id' | 'VariantId' | 'CollectionId' | 'Tag'; ids?: string[]; all_products?: boolean; min_quantity?: number; max_quantity?: number; min_value?: number; max_value?: number }
interface CartConditionsV2 { type: 'CART_AMOUNT' | 'CART_QUANTITY' | 'NO_CONDITIONS'; min_value?: number; max_value?: number; reference?: CartAmountReference; product_matchers?: ProductMatcherV2[] }
interface ActionV2 {
  type: 'CART' | 'PRODUCT' | 'BXGY' | 'BUNDLE' | 'DYNAMICTIER' | 'FREE_GIFT'
  method: 'FREE' | 'FIXED_PRICE' | 'CAPPED' | 'FLAT_OFF' | 'PERCENT_OFF'
  amount?: number; max_discount?: number                     // paise (amount is % for PERCENT_OFF)
  buy_rules?: ProductMatcherV2[]; get_rule?: ProductMatcherV2; get_quantity?: number; auto_add_freebie?: boolean
  gift_product?: { id: string; variant_id: string; name: string; unit_price: number; image_url?: string; qty?: number }
  cart_conditions?: CartConditionsV2
}
interface TargetingConfigV2 { applicable_for_all_users?: boolean; applicable_user_ids?: string[]; applicable_user_categories?: string[]; exclude_user_ids?: boolean; applicable_for_all_merchants?: boolean; applicable_merchant_ids?: string[]; applicable_devices?: string[] }
interface StackingRulePair { allowed?: string[][]; blocked?: string[][] }
interface StackingConfigV2 { enabled: boolean; max_stack_count?: number; calculation_basis?: CartAmountReference; mode_rules?: StackingRulePair; type_rules?: StackingRulePair; discount_rules?: StackingRulePair; max_discount_cap?: { enabled: boolean; type?: 'PERCENTAGE' | 'FIXED'; value?: number; reference?: CartAmountReference } }
interface CrossDomainEffectV2 { target_domain: 'DISCOUNT' | 'SHIPPING' | 'REWARDS' | 'PAYMENT'; effect_type: 'BLOCK' | 'ALLOW' | 'EXCLUDE' | 'SET_VALUE' | 'ADD_VALUE'; effect_value?: { value: number; unit: string; label?: string }; target_filter?: Record<string, unknown>; reason?: string; priority?: number }
interface CreateDiscountV2Request {
  merchant_id: string; title: string; code: string; display_name?: string; description?: string; terms_and_conditions?: string[]
  mode: 'MANUAL' | 'AUTOMATIC'; status: 'draft' | 'published'; valid_from: string; valid_until?: string
  type: DiscountTypeV2; actions: ActionV2[]; cart_conditions?: CartConditionsV2
  usage_limit?: { total_uses?: number; per_user?: number; per_order?: number }
  targeting?: TargetingConfigV2; visibility?: 'hidden' | 'always' | 'eligible'; view_in_listing?: boolean
  stacking_config?: StackingConfigV2; cross_domain_effects?: CrossDomainEffectV2[]; priority?: number
}
type DiscountV2 = CreateDiscountV2Request & { id: string; effective_status?: string; created_at?: string; updated_at?: string }
interface FetchDiscountsV2Params { merchant_id: string; status?: string; type?: string; mode?: string; search?: string; sort_by?: string; sort_order?: 'asc' | 'desc'; page?: number; limit?: number; visibility?: string }
interface MerchantDiscountConfig {   // inferred from DiscountSettings read + buildPayload
  stacking_config?: { enabled; calculation_basis; max_stack_count? }; cross_domain_effects?: CrossDomainEffectV2[]
  recommendation?: { strategy: 'max_discount' | 'min_discount' | 'match'; options: string[]; auto_apply }
  view_offers_sort?: { mode: 'manual'; order: string[] } | { mode: 'discount_value'; direction: 'asc' | 'desc' } | null
  utm_config?: { auto_apply; allow_manual_apply; hide_other_offers; default_recommendation } | { enabled: false }
  disable_discount_box?; show_confetti?; exit_discount?: { enabled; codes }; abc_discount?: { enabled; codes: { code; stacking }[] }
}
```

- No delete route (404): delete is `PUT /bulk/update` with `status: 'deleted'`; publish, revert-to-draft and disable use the same call.
- `mode` is immutable after create (engine ignores it on update).
- `fetchDiscountsV2` types pagination as `{ page, limit, total }`; the wire carries `current_page`, `total_pages`. Listing aliases `valid_from`/`valid_until` → `start_date`/`end_date` for the legacy table.
- Must go through the gateway; the microservice host rejects the merchant headers (CORS).
- Merchant settings: payment exclusions use `target_filter.types`, shipping exclusions `target_filter.ids`; `view_offers_sort: null` clears (omitting keeps the old value).

## os-discount v1 discounts (legacy get/create/update)

Source: `modules/discounts/api.ts`, `modules/discounts/type.ts`

| Endpoint | Request | Response |
|---|---|---|
| `GET /:discountId` | — | `{ data: { data: IDiscount } }` |
| `POST /create` | `ICreateDiscountRequest` (legacy forms, AI "open in form") | `{ data: ? }` |
| `PUT /update/:discountId` | `ICreateDiscountRequest` | not read |

```ts
interface IDiscount {
  id: string; title: string; code: string; description: string; terms_and_conditions: string[]
  start_date: string; end_date: string; max_coupon_per_customer: number; available_coupons: number
  applicable_for_all_users: boolean; exclude_applicable_user_id: boolean; applicable_device: 'website' | 'app' | 'website_and_app'
  merchant_id: string; status: string; effective_status?: string; created_at: string; updated_at: string
  payment_flags: { cod_disable: boolean; prepaid_disc_disable: boolean }; visibility: 'always' | 'hidden' | 'eligible'
  bulk_campaign?: BulkCampaign | null
}
interface ICreateDiscountRequest {
  title: string; code: string; description: string; terms_and_conditions: string[]; start_date: string; merchant_id: string
  rules?: { actions: string[]; conditions: Record<string, any>[]; is_deleted?: boolean; priority?: number; rule_id?: string }[]
  end_date?: string; max_coupon_per_customer?: number; available_coupons?: number; applicable_for_all_users?: boolean; auto_apply?: boolean
  applicable_device?: string; applicable_for_all_merchants?: boolean; frequency?: string; max_discount_per_customer?: number; visible?: boolean
  can_club_with_other_discounts?: boolean; must_apply?: boolean; status?: 'draft' | 'active' | 'inactive'; discount_type?: Record<string, any>
  applicable_user_id?: string; applicable_user_categories?: string[]
}
```

- Create failure: the message shown is `response.response.data.message` (e.g. 409 "coupon code already exists"), falling back to the BE body's `message`/`data`/`error`; code from `status`. Not collapsed to 500.
- Status values differ from V2: `active`/`inactive` here, `published`/`draft`/`inactive` there; `effective_status` (engine-derived, incl. scheduled/expired) wins for display.

## Discount sets

Source: `modules/discount-set/api.ts`, `modules/discount-set/transformer.ts`

| Endpoint | Request | Response |
|---|---|---|
| `POST /fetch` | `IDiscountsRequest & { is_discount_set: true, page, limit }` | `{ data: { data: { data: IDiscount[], pagination: { current_page, limit, total, total_pages, has_next?, has_previous? } } } }` |
| `POST /create-discount-set` | `DiscountSetWrite` | `{ data: ? }` |
| `PUT /update/:discountId` | `DiscountSetWrite` | not read |
| `POST /get-discount-coupons` | `{ merchant_id, discount_id }` | `{ data: { data: { discount_code?, status?, discount_id? }[] } }` |
| `POST {BASE}/api/v1/admin/os-discount/bulk-discount/presigned-url` | `{ url: <bulk_campaign.discount_codes_url>, operation_type: 'FETCH' \| 'PUT' }` (`withCredentials`) | `{ data: { presignedUrl? \| presigned_url? \| url? } }` (or one level deeper under `data`) |

```ts
interface IDiscountsRequest { status?: string; merchant_id?: string; search?: string; start_date?: string; end_date?: string; auto_apply?: true; is_discount_set?: boolean; sort_by?: string; sort_order?: 'desc' | 'asc'; page?: number; limit?: number }
interface BulkCampaign { campaign_id?: string; prefix?: string; suffix?: string; per_code_uses?: number; total_codes?: number; code_length?: number; ends_at?: string; discount_codes_url?: string | null; title?: string; job_status?: 'INITIATED' | 'COMPLETED' | string; campaign_created_at?: string }
interface DiscountSetWrite {   // as built by transformer.ts, plus per-type rule fields
  applicable_for_all_merchants: false; merchant_id: string; frequency?: 'unlimited'; applicable_device; must_apply; title; description; code; visibility
  start_date: string; end_date: string /* '9999-12-31T23:59:59Z' = no end */; terms_and_conditions: string[]
  applicable_for_all_users: boolean; exclude_applicable_user_id: true; applicable_user_id: string[]; applicable_user_categories: string[]
  available_coupons: number /* 1000000 = unlimited */; max_coupon_per_customer: 1 | 1000000
  number_of_random_coupons?: number; prefix?: string; suffix?: string; length?: number; email?: string   // logged-in staff email
}
```

- Same `/fetch` as v1 with `is_discount_set: true`; the body is nested one level deeper than V2.
- Create failure keeps the upstream message (prefix/suffix conflict) from `response.response.data.message`; code from `status_code`.
- Codes download: wait for `bulk_campaign.job_status === 'COMPLETED'`, exchange the S3 key for a presigned URL, fetch the zipped CSV directly (no cookie).
- Presign lives on `{BASE}`, not `{DISCOUNT}`. Publish/delete of sets go through V2 `/bulk/update`.

## AI sessions

Source: `modules/discount-ai/api.ts`, `modules/discount-ai/type.ts`

| Endpoint | Request | Response |
|---|---|---|
| `POST /sessions` | `{ title? }` | `{ data: { session_id: string, created_at: string } }` |
| `GET /sessions?limit=20` | — | `{ data: { sessions: DiscountAiSessionSummary[] } }` |
| `GET /sessions/:sessionId` | — | `{ data: GetSessionResponse }` |
| `POST /sessions/:sessionId/message` | `{ content: string }` | `{ data: TurnResult }` |
| `POST /sessions/:sessionId/select` | `{ selection_token, selected_ids: string[], picked_metadata?: Record<id, { title?, image_url?, price?, sku? }> }` | `{ data: TurnResult }` |
| `POST /sessions/:sessionId/confirm` | `{ action_token }` | `{ data: { ok: boolean, result: Record<string, any> } }` |
| `POST /sessions/:sessionId/publish` | `{ draft_id }` | `{ data: { discount_id: string } }` |
| `DELETE /sessions/:sessionId` | — | not read |

```ts
interface DiscountAiSessionSummary { id: string; title?: string | null; last_message_at?: string | null; status: 'active' | 'archived' | 'deleted' }
interface DiscountAiMessage { id: string; session_id: string; role: 'user' | 'assistant' | 'tool' | 'system'; content?: string | null; tool_name?: string | null; tool_args?: Record<string, any> | null; tool_result?: Record<string, any> | null; created_at: string }
interface GetSessionResponse {
  session: DiscountAiSessionSummary & { merchant_id: string; created_at: string; updated_at: string }
  messages: DiscountAiMessage[]
  latest_draft?: { id: string; version: number; discount_config: Record<string, any>; validation_status: 'draft' | 'valid' | 'invalid'; validation_errors?: any[] | null } | null
}
interface TurnResult {
  message_id?: string; reply: string; type: 'CartDiscount' | 'ProductBundle' | 'BxGy' | 'DynamicTierDiscount' | null
  form_values: Record<string, any> | null; draft_id: string | null; suggestions: string[]
  requires_confirmation: { kind: 'bulk_action' | 'modify_live' | 'duplicate_overlap' | 'publish' | string; summary: string; action_token: string; target_descriptor?: Record<string, any> } | null
  requires_selection: { selection_token: string; prompt: string; multi: boolean; kind: string; purpose?: string; hint?: string; candidates: any[] } | null
  bail_reason: 'budget_truncated' | 'max_iterations' | 'protocol_violation' | null
}
interface DiscountAiErrorBody { code?: string; message?: string; errors?: { path?: string; code?: string; message?: string }[] }
```

- Handled errors (from `err.response.status`): 409 turn still in flight, 429 rate limit (reads `retry-after` header), 503 service down; else `response.data.message`.
- `requires_selection` → open the native product/collection picker, then `POST …/select` with the token. `candidates` is always `[]`.
- `ProductBundle`/`DynamicTierDiscount` have no form; `CartDiscount` is narrowed by `form_values.action_type`.

## Redeem

Source: `modules/discounts/api.ts`

| Endpoint | Request | Response |
|---|---|---|
| `POST /redeem` | `{ discount_id, discount_code, merchant_id, order_id, customer_id?: string, discount_amount?: number }` (first four checked client-side) | `{ data: { success, message, discount_applied?: { discount_id, discount_code, discount_amount, customer_id }, transaction_id?, remaining_balance? } }` |

- No production caller: only order-page tests mock `redeemDiscount`. Admin surface on purpose (storefront surface fails CORS from the dashboard).

## Pickers

Source: `modules/discounts/api.ts`

| Picker | Endpoint | Base | Request | Response |
|---|---|---|---|---|
| Products search | `GET /api/v1/admin/products?status=active&search=&storeId=&page=&limit=50&show_variants=true` | `{BASE}` | query | `{ data: ? }` ([item](item.md)) |
| Product by id | `GET /api/v1/admin/products/:productId?storeId=&show_variants=true&all=false` | `{BASE}` | query | `{ data: { product: ? } }` |
| Variant by id | `GET /api/v1/admin/variants/:variantId` | `{BASE}` | — | `{ data: { data: ? } }` |
| Collections search | `GET /api/v1/admin/collections?storeId=&search=&page=&limit=&all=false` | `{BASE}` | query | `{ data: ? }` |
| Collection by id | `GET /api/v1/admin/collections/:collectionId?storeId=&all=false&page=&limit=` | `{BASE}` | query | `{ data: { data? \| collection?, pagination? } }` |
| Customers search | `POST /v1/admin/customers/filter` | `{KWIKPASS_CUSTOMER}` | `ICustomerQueryPayload` | `{ data: { customers: ICustomer[] } }` ([os-customer](os-customer.md#kwikpass-customer-host)) |
| Customer by id | `GET /v1/admin/customers/:customerId` | `{KWIKPASS_CUSTOMER}` | — | `{ data: ICustomer }` |
| Segments list | `GET /v1/admin/customer-segments?merchantId=` | `{KWIKPASS_CUSTOMER}` | — | `{ data: { segments: ICustomerSegment[] } }` |
| Segment by id | `GET /v1/admin/customer-segments/:segmentId?merchantId=` | `{KWIKPASS_CUSTOMER}` | — | `{ data: ICustomerSegment }` |

- Collection and product-by-id pickers force `all=false` (pagination mode). Product search passes `page`/`limit` into the builder only once; duplicate query params were parsed unpredictably.
- Customer pickers end paging when a page returns fewer than the limit (no `total` read).

## Unused

| Key / function | Path |
|---|---|
| `discounts.list` | `/api/v1/admin/os-discount/list` |
| `discounts.fetch` | `/api/v1/admin/os-discount/fetch` (sets use `discountSet.fetch`) |
| `discounts.validate` | `/api/v1/admin/os-discount/validate` |
| `discounts.setDiscountStatus` | `/api/v1/admin/os-discount/:id/status` (moved to V2 `/bulk/update`) |
| `discounts.deleteDiscountById` | `/api/v1/admin/os-discount/delete/:id` (moved to V2 `/bulk/update`) |
| `discounts.bulkUpdateStatus` | `/api/v1/admin/os-discount/bulk-update-status` |
| `discounts.revoke` | `/api/v1/admin/os-discount/revoke` |
| `discounts.dashboardUpdate` | `/dashboard/discount/update/:id` |
| `discountAi.getDraft` | `/api/v1/admin/os-discount/sessions/:sessionId/drafts/:draftId` |
| `fetchProductsByIdsApi` | `{BASE}/api/v1/product/details?storeId=` `{ productIds }` |
| `fetchCollectionsByIdsApi` | `{BASE}/api/v1/collection/details?storeId=` `{ collectionIds }` |
| `deleteDiscountV2`, `bulkUpdateDiscountsV2` (v2/api.ts) | V2 `/bulk/update`; live calls go through `modules/discounts/api.ts` |
| `getDiscountAiSession`, `publishDiscountAiDraft`, `deleteDiscountAiSession` | defined, no caller; rows kept above |

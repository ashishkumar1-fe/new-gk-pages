# dashboard

[← Gateway](README.md)

Base `{BASE}` (`REACT_APP_BASE_URL`, the gateway); paths relative to `/api/dashboard`. Case: snake_case (query `isSignIn` is the exception). Envelope: `{ status_code: number; message?: string; data: T }`; errors read `response.data.{ status_code, message }`.

## Auth and session

Source: dashboard-ui `src/store/user/index.ts`, `src/pages/login/login.tsx`, `src/pages/verifyOtp.tsx`, `src/pages/oAuth/OAuthCallback.tsx`, `src/library/utilities/helpers/helper.ts`

| Endpoint | Request | Response |
|---|---|---|
| `POST /user/signin` | `{ email, password, onboard_kwikpass_custom: boolean }` | `{ status_code: 200 }`, OTP emailed; no session yet |
| `POST /user/send-otp?isSignIn=true` | `{ email }` | `{ status_code: 200 }` (resend; `isSignIn=false` on signup) |
| `POST /user/verify-otp` | `{ otp: string, email, password?, onboard_kwikpass_custom?: true }` | `LoginResult` ? + `Set-Cookie: token` |
| `GET /user/google-signin?code=&onboard_kwikpass_custom=` | OAuth `code` from callback (`state=login`) | `LoginResult` ? + `Set-Cookie: token` |
| `GET /user/logout` | — | `{ status_code: 200 }`, clears `token` |
| `GET /user/auth/me` | — | defined in constants, never called |

```ts
interface LoginResult {                       // all ?
  token?: string | { token: string; otp_verified: boolean }
  current_dashboard?: 'old' | string
  email?: string                              // google-signin
  is_internal_user?: boolean
  role?: { permissions?: string[] }
  kp_custom_onboarding?: boolean
}
```

- `password` (signin) and `email` (verify-otp) are AES-encrypted client-side with `REACT_APP_PUBLIC_CRYPTO_KEY`; send-otp `email` is plain; verify-otp `password` is the already-encrypted signin value.
- Errors: signin `400` + message containing `otp already sent` → treated as success; `403` (signin, verify-otp) → email unverified → send-otp → `/verify-otp`; google-signin `401` → invalid creds; logout `401` → treated as success.
- `token: { token, otp_verified: true }` → forced password change (`localStorage.temptoken`); `current_dashboard: 'old'` → redirect to the old dashboard with `?t=<token>`.
- Session check: `is_logged_in=true` is set by JS, not the server (24h, `path=/`, `SameSite=Lax`, `Secure` on https) after verify-otp / google-signin / merchant verify; `checkAuth()` reads only this cookie. `token` is httpOnly.
- No "me" call at boot: `GET /user/details` is the real session probe; `401` = logged out (toast suppressed). Logout also expires `token` and `userSessionId` client-side.

## User and merchant

Source: dashboard-ui `src/store/user/index.ts`, `src/store/user/types.ts`, `src/library/utilities/interface/interface.ts`, `src/library/components/common/header/index.tsx`, `src/library/components/common/MerchantSelector/index.tsx`; gk-pages `src/store/user/`

| Endpoint | Request | Response |
|---|---|---|
| `GET /user/details` | — | `UserDetailsResponse` ? |
| `GET /user/merchant-search?q=` | `q` | `{ merchants: SearchedMerchant[] }` |
| `POST /team/switch-merchant` | `{ merchant_id: number }` | `{ merchant: { kyc_completion_status } }` ?; then refetch `/user/details` |

```ts
interface UserDetailsResponse {
  user_details: UserDetails
  merchant_details: MerchantDetails
  config: MerchantConfig                      // see Merchant config
  kyc_details?: unknown                       // ?
  payment_configs?: unknown                   // ?
  appEmbedData?: { enable_on_main_theme: boolean; enable_on_selected_theme: boolean }
}
interface UserDetails {
  email: string
  is_internal_user: boolean
  role: Role
  allowed_merchants: AllowedMerchant[]
  id?: string                                 // ? gk-pages reads
  name?: string                               // ?
  first_name?: string                         // ? gk-pages reads
  phone?: string                              // ?
}
interface Role { id: string; name: string; permission_type: 'web' | 'merchant'; permissions: string[]; created_at: string; updated_at: string }
interface AllowedMerchant {
  _id: string; id: number; merchant_id: string; merchant_test_id: number; business_name: string; short_name: string
  email: string; group_ids: string[]; service_id: string; status: number; user_id: string; created_at: string; updated_at: string
}
interface MerchantDetails {
  m_id: string
  platform: string
  onboarding_status?: {
    kwik_checkout_app?: string; kwikpass_app?: string; kwikpass_app_mkt?: string; cod_lite_app?: string
    gokwik_cards_app?: boolean; gokwik_upi_app?: boolean; gokwik_cash_on_delivery_app?: string   // last ?
  }
  latest_app_onboarding_in_progress?: string
  id?: number                                 // ?
  business_name?: string; short_name?: string; name?: string           // ?
  is_multi_platform?: boolean; platform_details?: Record<string, any>  // ?
  website?: string; country?: string; email?: string                   // ?
  kyc_completion_status?: 'Approved' | '' | string                     // ?
  is_active?: boolean; active_product_count?: number                   // ?
}
interface SearchedMerchant { id: number; m_id: string; business_name: string; short_name: string; platform: string; is_multi_platform: boolean; platform_details?: Record<string, any> }
```

- `merchant_details.id` (number) ≠ `m_id` (string): switch-merchant and the header picker use `id`; the `merchant-mid` / `gk-merchant-id` headers carry `m_id`.
- `allowed_merchants` sits under `user_details`; the picker is disabled when it has one entry.
- `mode` (`live` | `test`) is derived client-side, not sent: `config.enhancer_app || kyc_completion_status === '' || (permissions includes 'live_mode' && kyc_completion_status === 'Approved')`; skipped for internal users.
- Permission strings branched on: `live_mode`, `complete_payment_kyc`.
- gk-pages makes no call of its own: it reads the shell's `dashboardStore.userData` (`user_details.{id,name,first_name,email,is_internal_user}`, `merchant_details.{m_id,id,short_name,name,platform}`).

## Merchant config

Source: dashboard-ui `src/store/user/types.ts`, `src/library/components/common/sideNav/navigationUtils.ts`, `src/library/components/common/sideNav/SideNavMerger.tsx`, `src/store/user/index.ts`, `src/pages/dashboard-products/components/CheckoutConfigModal.tsx`

| Endpoint | Request | Response |
|---|---|---|
| `GET /user/details` → `config` | — | `MerchantConfig` |
| `GET /merchant/:m_id/navigation` | — | `{ navigation_map: NavItem[] }` ? |
| `GET /feature-flags` | — | `Record<string, boolean>` ? (e.g. `support_hub`) |
| `PATCH /merchant-config?merchant_mid=` | `{ enhancer_app?, gk_payments_app?, cod_app?: boolean }` (changed keys only) | envelope ? |

```ts
interface MerchantConfig {
  selected_products?: {                       // typed as Record<string, boolean>; keys ?
    pages?: boolean; checkout?: boolean; rto?: boolean; payments?: boolean
    kwik_pass?: boolean; kwik_pass_mkt?: boolean; kwik_ship?: boolean; kwikship?: boolean; kwik_commerce?: boolean
  }
  supported_checkout_configs?: Record<string, boolean>
  cod_lite?: boolean
  is_gkp_enabled?: boolean                    // ?
  enhancer_app?: boolean                      // ?
}
interface NavItem { key: string; label: string; path: string; permission: string; isInternal?: boolean; pitch_page?: unknown; children?: NavItem[] }   // ?
```

- `selected_products.pages` gates the GK Pages side-nav entry when navigation falls back to the static menu.
- `PATCH /merchant-config` without `merchant_mid` returns success but updates 0 rows.
- `NavItem` keys are camelCase (`isInternal`) inside a snake_case envelope.

## Other dashboard endpoints gk-pages uses

Source: gk-pages `src/modules/ratio-reports/api.ts`, `src/modules/ratio-reports/endpoints.ts`, `src/library/utilities/userLogEvents/userLogEvents.ts`, `src/modules/visual-editor/editorToken.ts`

| Endpoint | Request | Response |
|---|---|---|
| `GET /dashboard_filters?dashboard=merchant\|admin&page=reports` | query | `DashboardFilter[]` |
| `POST /dashboard/gk-pages/editor-token` | empty; merchant from `merchant-mid` | `{ token, expires_at }` (unix seconds; `data.data ?? data`) |
| `POST /event` ? | `{ event_type, event_name, screen_name, request_id: email, session_id: '<email>_<userSessionId>', merchant_id, merchant_name, username, timestamp: ISO, data }` | ignored |

```ts
interface DashboardFilter { key: string; input_details?: { options?: Record<string, unknown>[]; value_key?: string } }
// report types = filter key 'reportType'; option value = option[value_key] ?? option.value, label = option.text
```

- gk-pages `REACT_APP_BASE_URL` ends in `/api`; `dashboard_filters` strips it (`dashboardBackendUrl`), `/event` does not → `…/api/api/dashboard/event`, which the gateway does not route.
- `/event` goes through `logUserEvent` (`@gokwik/utilities`); method and final body are inside the package, so the row is `?`.
- `userSessionId` cookie (18 digits, 365d) is minted client-side.
- `dashboard_filters` uses plain `makeAPICall` (no `gk-merchant-id`), matching the shell.

## Unused

Source: gk-pages `src/store/analytics/api.ts`, `src/library/utilities/hooks/useShopifyMerchantConfig.ts`, `src/store/shopify-app/index.ts`

Analytics query defaults: `F` = `{ payment_method_filter: 'all', sales_channel: 'all' }`; `F+` = `F` + `sales_by: 'count'`.

| Endpoint | Request | Response |
|---|---|---|
| `GET /stats/:m_id` | `{ sales_channel: 'all', startDate, endDate }` | `{ abc_orders_data: { metrics: { total_orders, total_sales, source }[], conversion }, … }` ? |
| `GET /merchantStats/checkout-funnel-metrics` | `F` | not read |
| `GET /merchantStats/checkout-funnel-trend-metrics` | `F` | `{ checkoutFunnelTrend }` ? |
| `GET /merchantStats/order-metrics` | `F` | `{ averageOrderStats, orderStats, saleStats }` ? |
| `GET /merchantStats/marketing-sales-metrics` | `F` | `{ lastUpdatedAt, stats }` ? |
| `GET /merchantStats/payment-metrics` | `F+` | `{ lastUpdatedAt, stats: { key, value, change, contribution }[] }` ? |
| `GET /merchantStats/top-product-metrics` | `F+` | `{ lastUpdatedAt, stats: { description, totalSales }[] }` ? |
| `GET /merchantStats/discount-usage-trend-metrics` | `F+` | `{ lastUpdatedAt, stats: { coupon_code, contribution }[] }` ? |
| `GET /merchantStats/discount-usage-failure-metrics` | `F+` | `{ lastUpdatedAt, stats: { coupon_code, contribution }[] }` ? |
| `GET /merchantStats/gmv-sales-split-metrics` | `{ split_by: 'mkt_source', sales_by: 'count', sales_channel: 'all' }` | `{ lastUpdatedAt, stats: { source, contribution }[] }` ? |
| `GET /merchantStats/discount-usage-data-metrics` | `F` | `{ lastUpdatedAt, stats }` ? |
| `GET /merchantStats/address-prefill-metrics` | `F` | not read |
| `GET /vd/order-metrics` | `{ start_date, end_date }` | `{ total_orders, total_sales, prepaid_percentage, aov }` ? |
| `GET /vd/funnel-metrics` | `{ start_date, end_date }` | `{ address_prefilled_percentage, checkout_conversion_percentage, sso_percentage }` ? |
| `GET /vd/cod-share` | `{ start_date, end_date }` | `{ cod_share }` ? |
| `GET /vd/cod-rto-rate` | `{ start_date, end_date }` | `{ cod_rto_rate }` ? |
| `GET` / `POST /shopify-app/merchant-config` | POST: `Partial<IShopifyMerchantConfig>` | `IShopifyMerchantConfig` |
| `POST /shopify-app/send-email` | `{ event_name: 'KWIK_CHECKOUT_DASHBOARD_RATING', feedback, rating: number }` | `{ status_code: 200 }` |

- Analytics: `src/store/analytics` reducer is registered but `fetchAllAnalyticsData` / `fetchAnalyticsDataAsync` are never dispatched (the Analytics page uses `services/analyticsApiService`); `vd/*` entries are commented out.
- Shopify: `useShopifyMerchantConfigApi` is never imported and `fetchShopifyAppMerchantConfig` never dispatched; dashboard-ui still calls `shopify-app/merchant-config`.

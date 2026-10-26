import { notImplemented } from '@/lib/notImplemented';

/**
 * discount service. Base: {BASE}/dashboard/v2/discount · {DISCOUNT}/api/v1/admin/os-discount. Every endpoint gk-pages uses, with its request and response shape, is in
 * docs/architecture/gateway/discount.md. Each stub below becomes one typed function: domain input in, domain output out,
 * parsed with the wire schema (wire.ts) and transformed (transformer.ts). Replace a stub only together with a recorded fixture.
 */
export const createDiscount = (..._args: unknown[]) => notImplemented('discount POST /create');
export const getDiscount = (..._args: unknown[]) => notImplemented('discount GET /:id?merchant_id=');
export const updateDiscount = (..._args: unknown[]) => notImplemented('discount PUT /update/:id');
export const fetchDiscounts = (..._args: unknown[]) => notImplemented('discount POST /fetch');
export const bulkUpdateDiscounts = (..._args: unknown[]) =>
  notImplemented('discount PUT /bulk/update (status: published|draft|inactive|deleted)');
export const checkCode = (..._args: unknown[]) => notImplemented('discount POST /check-code');
export const getMerchantConfig = (..._args: unknown[]) => notImplemented('discount GET /merchant-config');
export const upsertMerchantConfig = (..._args: unknown[]) => notImplemented('discount PUT /config/merchant/upsert');
export const createDiscountSet = (..._args: unknown[]) => notImplemented('discount POST {DISCOUNT}/create-discount-set');
export const updateDiscountSet = (..._args: unknown[]) => notImplemented('discount PUT {DISCOUNT}/update/:id');
export const presignCodesFile = (..._args: unknown[]) =>
  notImplemented('discount POST {BASE}/api/v1/admin/os-discount/bulk-discount/presigned-url');
export const createAiSession = (..._args: unknown[]) => notImplemented('discount POST {DISCOUNT}/sessions');
export const sendAiMessage = (..._args: unknown[]) => notImplemented('discount POST {DISCOUNT}/sessions/:id/message');
export const selectAiChoice = (..._args: unknown[]) => notImplemented('discount POST {DISCOUNT}/sessions/:id/select');
export const confirmAiAction = (..._args: unknown[]) => notImplemented('discount POST {DISCOUNT}/sessions/:id/confirm');

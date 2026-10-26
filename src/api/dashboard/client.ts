import { notImplemented } from '@/lib/notImplemented';

/**
 * dashboard service. Base: {BASE}/api/dashboard. Every endpoint gk-pages uses, with its request and response shape, is in
 * docs/architecture/gateway/dashboard.md. Each stub below becomes one typed function: domain input in, domain output out,
 * parsed with the wire schema (wire.ts) and transformed (transformer.ts). Replace a stub only together with a recorded fixture.
 */
export const getMerchantConfig = (..._args: unknown[]) => notImplemented('dashboard GET /merchant-config');
export const getSeoDefaults = (..._args: unknown[]) => notImplemented('dashboard GET /seo-defaults');
export const searchMerchants = (..._args: unknown[]) => notImplemented('dashboard GET /user/merchant-search?q=');

/**
 * Env and service base URLs are read only here. Only VITE_-prefixed keys reach the bundle.
 * Names mirror gk-pages with `REACT_APP_` replaced by `VITE_` (REACT_APP_BULK_OPS_API_URL → VITE_BULK_OPS_API_URL).
 * A base that is not set falls back to the gateway base, which is where the demo's MSW handlers answer.
 */
const env = import.meta.env as Record<string, string | undefined>;
const read = (key: string, fallback = '') => (env[key] ?? fallback).replace(/\/$/, '');

export const BASE = read('VITE_BASE_URL'); // gateway; also dashboard APIs and Discount V2
export const ORDER = read('VITE_ORDER_BASE_URL', BASE);
export const INVENTORY = read('VITE_INVENTORY_API_URL', BASE);
export const CUSTOMER = read('VITE_CUSTOMER_BASE_URL', BASE);
export const KWIKPASS_CUSTOMER = read('VITE_KWIKPASS_CUSTOMER_API_URL', BASE);
export const DISCOUNT = read('VITE_KWIKPASS_DISCOUNT_API_URL', BASE);
export const TIMELINE = read('VITE_TIMELINE_SERVICE_API_URL', BASE);
export const BULK_OPS = read('VITE_BULK_OPS_API_URL', BASE);
export const RESOURCES = read('VITE_OS_RESOURCE_API_URL', BASE);
export const APPS = read('VITE_MERCHANT_APP_STORE_API_URL', BASE);

/** MSW mocks on unless VITE_MOCKS is the string 'false'. */
export const MOCKS = env.VITE_MOCKS !== 'false';
declare const __APP_VERSION__: string;
export const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';

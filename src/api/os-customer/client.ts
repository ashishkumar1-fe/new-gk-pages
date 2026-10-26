import { notImplemented } from '@/lib/notImplemented';

/**
 * os-customer service. Base: {CUSTOMER}/api/v1/admin. Every endpoint gk-pages uses, with its request and response shape, is in
 * docs/architecture/gateway/os-customer.md. Each stub below becomes one typed function: domain input in, domain output out,
 * parsed with the wire schema (wire.ts) and transformed (transformer.ts). Replace a stub only together with a recorded fixture.
 */
export const filterCustomers = (..._args: unknown[]) => notImplemented('os-customer POST /customers/filter');
export const getCustomer = (..._args: unknown[]) => notImplemented('os-customer GET /customers/:customerId');
export const createCustomer = (..._args: unknown[]) => notImplemented('os-customer POST /customers');
export const updateCustomer = (..._args: unknown[]) => notImplemented('os-customer PUT /customers/:customerId');
export const setCustomerBlocked = (..._args: unknown[]) => notImplemented('os-customer PATCH /customers/:customerId/status');
export const deleteCustomer = (..._args: unknown[]) => notImplemented('os-customer DELETE /customers/:customerId');
export const createAddress = (..._args: unknown[]) => notImplemented('os-customer POST /addresses');
export const updateAddress = (..._args: unknown[]) => notImplemented('os-customer PUT /addresses/:id');
export const deleteAddress = (..._args: unknown[]) => notImplemented('os-customer DELETE /addresses/:id');
export const addCustomerComment = (..._args: unknown[]) =>
  notImplemented('os-customer POST {KWIKPASS_CUSTOMER}/v1/admin/customers/:id/comment');
export const updateCustomerContact = (..._args: unknown[]) =>
  notImplemented('os-customer PUT {KWIKPASS_CUSTOMER}/v1/admin/customers/:cid?merchantId=');
export const listSegments = (..._args: unknown[]) => notImplemented('os-customer GET /customer-segments');
export const getSegment = (..._args: unknown[]) => notImplemented('os-customer GET /customer-segments/:id');
export const createSegment = (..._args: unknown[]) => notImplemented('os-customer POST /customer-segments?merchantId=');
export const updateSegment = (..._args: unknown[]) => notImplemented('os-customer PUT /customer-segments/:id?merchantId=');
export const deleteSegment = (..._args: unknown[]) => notImplemented('os-customer DELETE /customer-segments/:id');
export const startCustomerExport = (..._args: unknown[]) => notImplemented('os-customer POST /customers/export');
export const getCustomerExport = (..._args: unknown[]) => notImplemented('os-customer GET /customers/export/:jobId');

import { notImplemented } from '@/lib/notImplemented';
/** item service, collections and lookups. docs/architecture/gateway/item.md */
export const listCollections = (..._a: unknown[]) => notImplemented('item GET /collections');
export const getCollection = (..._a: unknown[]) => notImplemented('item GET /collections/:id?storeId=');
export const createCollection = (..._a: unknown[]) => notImplemented('item POST /collections');
export const updateCollection = (..._a: unknown[]) => notImplemented('item PUT /collections/:id?storeId= (addProducts, removedProducts)');
export const deleteCollection = (..._a: unknown[]) => notImplemented('item DELETE /collections/:id?storeId=');
export const bulkDeleteCollections = (..._a: unknown[]) => notImplemented('item POST /collections/bulk-delete');
export const bulkUpdateCollections = (..._a: unknown[]) => notImplemented('item PATCH /collections/bulk');
export const listVendors = (..._a: unknown[]) => notImplemented('item GET /products/vendors');
export const listProductTypes = (..._a: unknown[]) => notImplemented('item GET /products/types');
export const listTaxonomy = (..._a: unknown[]) => notImplemented('item GET /taxonomy');
export const createPriceSchedule = (..._a: unknown[]) => notImplemented('item POST /bulk-edit/{storeId}/price-update');
export const cancelPriceSchedule = (..._a: unknown[]) => notImplemented('item DELETE /bulk-edit/{storeId}/price-update/schedules/:id');
export const listPriceSchedules = (..._a: unknown[]) => notImplemented('item GET /bulk-edit/{storeId}/price-update/schedules');

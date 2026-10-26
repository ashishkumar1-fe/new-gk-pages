import { notImplemented } from '@/lib/notImplemented';

/**
 * inventory service. Base: {INVENTORY}. Every endpoint gk-pages uses, with its request and response shape, is in
 * docs/architecture/gateway/inventory.md. Each stub below becomes one typed function: domain input in, domain output out,
 * parsed with the wire schema (wire.ts) and transformed (transformer.ts). Replace a stub only together with a recorded fixture.
 */
export const listItems = (..._args: unknown[]) => notImplemented('inventory GET /v3/admin/inventory/items');
export const listLevels = (..._args: unknown[]) => notImplemented('inventory GET /v3/admin/inventory/levels');
export const connectLevel = (..._args: unknown[]) => notImplemented('inventory POST /v3/admin/inventory/levels/connect');
export const disconnectLevel = (..._args: unknown[]) => notImplemented('inventory POST /v3/admin/inventory/levels/disconnect');
export const setQuantities = (..._args: unknown[]) => notImplemented('inventory POST /v3/admin/inventory/set-quantities (idempotency-key)');
export const adjustQuantities = (..._args: unknown[]) =>
  notImplemented('inventory POST /v3/admin/inventory/adjust-quantities (idempotency-key)');
export const setOnHand = (..._args: unknown[]) => notImplemented('inventory POST /v3/admin/inventory/set-on-hand (idempotency-key)');
export const listAdjustments = (..._args: unknown[]) => notImplemented('inventory GET /v3/admin/inventory/adjustments');
export const listLocations = (..._args: unknown[]) => notImplemented('inventory GET /v3/admin/locations');
export const createLocation = (..._args: unknown[]) => notImplemented('inventory POST /v3/admin/locations');
export const updateLocation = (..._args: unknown[]) => notImplemented('inventory PATCH /v3/admin/locations/:id');
export const activateLocation = (..._args: unknown[]) => notImplemented('inventory POST /v3/admin/locations/:id/activate');
export const deactivateLocation = (..._args: unknown[]) => notImplemented('inventory POST /v3/admin/locations/:id/deactivate (drain_to)');
export const deleteLocation = (..._args: unknown[]) => notImplemented('inventory POST /v3/admin/locations/:id/delete');
export const importInventory = (..._args: unknown[]) => notImplemented('inventory POST /v1/admin/inventory/import (multipart)');
export const exportInventory = (..._args: unknown[]) => notImplemented('inventory GET /v1/admin/inventory/export-csv');
export const listPurchaseOrders = (..._args: unknown[]) => notImplemented('inventory GET /v1/admin/purchase-orders');
export const getPurchaseOrder = (..._args: unknown[]) => notImplemented('inventory GET /v1/admin/purchase-orders/:id');
export const createPurchaseOrder = (..._args: unknown[]) => notImplemented('inventory POST /v1/admin/purchase-orders');
export const updatePurchaseOrder = (..._args: unknown[]) => notImplemented('inventory PATCH /v1/admin/purchase-orders/:id');
export const deletePurchaseOrder = (..._args: unknown[]) => notImplemented('inventory DELETE /v1/admin/purchase-orders/:id');
export const listSuppliers = (..._args: unknown[]) => notImplemented('inventory GET /v1/admin/suppliers');
export const listTransfers = (..._args: unknown[]) => notImplemented('inventory GET /v1/admin/transfers');
export const getTransfer = (..._args: unknown[]) => notImplemented('inventory GET /v1/admin/transfers/:id');
export const createTransfer = (..._args: unknown[]) => notImplemented('inventory POST /v1/admin/transfers');
export const updateTransfer = (..._args: unknown[]) => notImplemented('inventory PATCH /v1/admin/transfers/:id');
export const deleteTransfer = (..._args: unknown[]) => notImplemented('inventory DELETE /v1/admin/stock-transfers/:id');
export const listFieldDefinitions = (..._args: unknown[]) => notImplemented('inventory GET /v1/admin/metafield-definitions');
export const createFieldDefinition = (..._args: unknown[]) => notImplemented('inventory POST /v1/admin/metafield-definitions');
export const updateFieldDefinition = (..._args: unknown[]) => notImplemented('inventory PUT /v1/admin/metafield-definitions/:id');
export const deleteFieldDefinition = (..._args: unknown[]) => notImplemented('inventory DELETE /v1/admin/metafield-definitions/:id');
export const listMetaobjects = (..._args: unknown[]) => notImplemented('inventory GET /v1/admin/metaobjects');

import { notImplemented } from '@/lib/notImplemented';

/**
 * os-order service. Base: {ORDER}/api/v1/admin. Every endpoint gk-pages uses, with its request and response shape, is in
 * docs/architecture/gateway/os-order.md. Each stub below becomes one typed function: domain input in, domain output out,
 * parsed with the wire schema (wire.ts) and transformed (transformer.ts). Replace a stub only together with a recorded fixture.
 */
export const listOrders = (..._args: unknown[]) => notImplemented('os-order GET /orders');
export const getOrder = (..._args: unknown[]) => notImplemented('os-order GET /orders/:orderId');
export const updateOrder = (..._args: unknown[]) => notImplemented('os-order PATCH /orders/:orderId');
export const cancelOrder = (..._args: unknown[]) => notImplemented('os-order PATCH /orders/:orderId/cancel');
export const updateNote = (..._args: unknown[]) => notImplemented('os-order PATCH /orders/:orderId/note');
export const bulkCancel = (..._args: unknown[]) => notImplemented('os-order POST /orders/bulk-cancel');
export const bulkArchive = (..._args: unknown[]) => notImplemented('os-order POST /orders/bulk-archive');
export const bulkUnarchive = (..._args: unknown[]) => notImplemented('os-order POST /orders/bulk-unarchive');
export const getSortOptions = (..._args: unknown[]) => notImplemented('os-order GET /orders/sortby');
export const getViews = (..._args: unknown[]) => notImplemented('os-order GET /orders/views');
export const beginEdit = (..._args: unknown[]) => notImplemented('os-order POST /orders/:orderId/edit/begin');
export const getEditSession = (..._args: unknown[]) => notImplemented('os-order GET /orders/:orderId/edit/:sessionId');
export const stageEdit = (..._args: unknown[]) => notImplemented('os-order POST /orders/:orderId/edit/:sessionId/stage');
export const previewEdit = (..._args: unknown[]) => notImplemented('os-order POST /orders/:orderId/edit/:sessionId/preview');
export const commitEdit = (..._args: unknown[]) => notImplemented('os-order POST /orders/:orderId/edit/:sessionId/commit');
export const discardEdit = (..._args: unknown[]) => notImplemented('os-order POST /orders/:orderId/edit/:sessionId/discard');
export const listFulfillments = (..._args: unknown[]) => notImplemented('os-order GET /orders/:orderId/fulfillments');
export const createFulfillment = (..._args: unknown[]) => notImplemented('os-order POST /orders/:orderId/fulfillments');
export const updateTracking = (..._args: unknown[]) => notImplemented('os-order POST /orders/:orderId/fulfillments/:fid/update_tracking');
export const holdOrder = (..._args: unknown[]) => notImplemented('os-order POST /orders/:orderId/hold');
export const releaseHold = (..._args: unknown[]) => notImplemented('os-order POST /orders/:orderId/release_hold');
export const bulkFulfill = (..._args: unknown[]) => notImplemented('os-order POST /orders/bulk-fulfill');
export const calculateRefund = (..._args: unknown[]) => notImplemented('os-order POST /refunds/calculate');
export const createRefund = (..._args: unknown[]) => notImplemented('os-order POST /refunds (x-idempotency-key)');
export const getRefund = (..._args: unknown[]) => notImplemented('os-order GET /refunds/:refundId');
export const listRefunds = (..._args: unknown[]) => notImplemented('os-order GET /orders/:orderId/refunds');
export const listDraftOrders = (..._args: unknown[]) => notImplemented('os-order GET /draft-orders');
export const getDraftOrder = (..._args: unknown[]) => notImplemented('os-order GET /draft-orders/:id');
export const calculateDraft = (..._args: unknown[]) => notImplemented('os-order POST /draft-orders/calculate');
export const createDraft = (..._args: unknown[]) => notImplemented('os-order POST /draft-orders');
export const updateDraft = (..._args: unknown[]) => notImplemented('os-order PUT /draft-orders');
export const completeDraft = (..._args: unknown[]) => notImplemented('os-order POST /draft-orders/:id/complete');
export const sendInvoice = (..._args: unknown[]) => notImplemented('os-order POST /draft-orders/:id/send-invoice');
export const duplicateDraft = (..._args: unknown[]) => notImplemented('os-order POST /draft-orders/:id/duplicate');
export const deleteDraft = (..._args: unknown[]) => notImplemented('os-order DELETE /draft-orders/:id');
export const bulkDeleteDrafts = (..._args: unknown[]) => notImplemented('os-order POST /draft-orders/bulk/delete');
export const bulkDraftTags = (..._args: unknown[]) => notImplemented('os-order POST /draft-orders/bulk/tags/add|remove');
export const listTags = (..._args: unknown[]) => notImplemented('os-order GET /orders/tags');
export const createTag = (..._args: unknown[]) => notImplemented('os-order POST /orders/tags');
export const addOrderTags = (..._args: unknown[]) => notImplemented('os-order POST /orders/:orderId/tags');
export const removeOrderTag = (..._args: unknown[]) => notImplemented('os-order DELETE /orders/:orderId/tags/:tagId');
export const bulkOrderTags = (..._args: unknown[]) => notImplemented('os-order POST /orders/bulk/tags/add|remove');
export const listTimeline = (..._args: unknown[]) => notImplemented('os-order GET {TIMELINE}/events?subject=');
export const addComment = (..._args: unknown[]) => notImplemented('os-order POST /orders/:orderId/comments');

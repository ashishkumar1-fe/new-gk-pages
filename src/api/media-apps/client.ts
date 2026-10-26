import { notImplemented } from '@/lib/notImplemented';

/**
 * media-apps service. Base: {RESOURCES}/api/v1/admin/media · {APPS}/api/v1. Every endpoint gk-pages uses, with its request and response shape, is in
 * docs/architecture/gateway/media-apps.md. Each stub below becomes one typed function: domain input in, domain output out,
 * parsed with the wire schema (wire.ts) and transformed (transformer.ts). Replace a stub only together with a recorded fixture.
 */
export const listAssets = (..._args: unknown[]) => notImplemented('media-apps GET /assets');
export const getAsset = (..._args: unknown[]) => notImplemented('media-apps GET /assets/:assetId');
export const updateAsset = (..._args: unknown[]) => notImplemented('media-apps PUT /assets/:assetId');
export const deleteAsset = (..._args: unknown[]) => notImplemented('media-apps DELETE /assets/:assetId');
export const bulkDeleteAssets = (..._args: unknown[]) => notImplemented('media-apps DELETE /assets/bulk');
export const uploadAsset = (..._args: unknown[]) => notImplemented('media-apps POST /upload (multipart)');
export const presignUpload = (..._args: unknown[]) => notImplemented('media-apps POST /upload/presign');
export const confirmUpload = (..._args: unknown[]) => notImplemented('media-apps POST /upload/confirm/:assetId');
export const listApps = (..._args: unknown[]) => notImplemented('media-apps GET {APPS}/apps');
export const installApp = (..._args: unknown[]) => notImplemented('media-apps POST {APPS}/apps/:id/install');

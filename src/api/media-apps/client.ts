import { notImplemented } from '@/lib/notImplemented';

/**
 * media-apps service. Base: {RESOURCES}/api/v1/admin/media · {APPS}/api/v1. Endpoints and shapes: docs/architecture/gateway/media-apps.md.
 * Media assets are ported (library.client.ts, re-exported here). Apps remain stubs until their fixtures are recorded.
 */
export {
  listAssets,
  getAsset,
  searchAssets,
  updateAsset,
  deleteAsset,
  bulkDeleteAssets,
  addAssetFromUrl,
  uploadAsset,
} from './library.client';
export const listApps = (..._args: unknown[]) => notImplemented('media-apps GET {APPS}/apps');
export const installApp = (..._args: unknown[]) => notImplemented('media-apps POST {APPS}/apps/:id/install');

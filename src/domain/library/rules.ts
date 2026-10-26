import type { AssetKind, Library } from './schema';

/** Pure rules for the content library. Sources: gk-pages pages/content-library + modules/assets. */

/** image/* → image, video/* → video, anything else → document. (gk-pages modules/assets/utils.ts getAssetType) */
export const kindOf = (mimeType: string): AssetKind =>
  mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('video/') ? 'video' : 'document';

/** An asset still referenced by a product or page cannot be deleted; the reason names the count. (ContentLibrary.tsx delete guard) */
export const deleteBlockReason = (a: Pick<Library, 'usedIn'>): string | undefined =>
  a.usedIn > 0 ? `Used in ${a.usedIn} place${a.usedIn === 1 ? '' : 's'}. Remove it there first.` : undefined;
export const canDelete = (a: Pick<Library, 'usedIn'>) => deleteBlockReason(a) === undefined;

/** Upload limits as today: images 10 MB, videos 100 MB, documents 25 MB. (modules/assets/constants.ts MAX_FILE_SIZE) */
export const MAX_BYTES: Record<AssetKind, number> = { image: 10 * 1024 * 1024, video: 100 * 1024 * 1024, document: 25 * 1024 * 1024 };
export const uploadBlockReason = (file: { mimeType: string; sizeBytes: number }): string | undefined => {
  const kind = kindOf(file.mimeType);
  return file.sizeBytes > MAX_BYTES[kind]
    ? `${kind[0]!.toUpperCase()}${kind.slice(1)}s must be under ${Math.round(MAX_BYTES[kind] / 1024 / 1024)} MB.`
    : undefined;
};

/** Title defaults to the file name without its extension. (UploadModal.tsx:48) */
export const titleFromFileName = (fileName: string) =>
  fileName
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim();

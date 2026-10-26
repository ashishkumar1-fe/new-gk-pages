import type { AssetKind, Library } from './schema';

export const titleOf = (r: Pick<Library, 'title'>) => r.title;

/** 1024-based, one decimal above KB. "2.4 MB" */
export const formatBytes = (n: number): string => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
};

export const kindLabel = (k: AssetKind) => ({ image: 'Image', video: 'Video', document: 'Document' })[k];
export const kindTone = (k: AssetKind): 'info' | 'warning' | 'neutral' =>
  (({ image: 'info', video: 'warning', document: 'neutral' }) as const)[k];

/** "1200 × 800" or "—" for files without dimensions. */
export const dimensions = (a: Pick<Library, 'width' | 'height'>) => (a.width && a.height ? `${a.width} × ${a.height}` : '—');

export const usedInLabel = (n: number) => (n === 0 ? 'Not used' : `${n} place${n === 1 ? '' : 's'}`);

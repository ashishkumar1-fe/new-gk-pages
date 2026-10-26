import { describe, it, expect } from 'vitest';
import { canDelete, deleteBlockReason, kindOf, titleFromFileName, uploadBlockReason } from './rules';
import { formatBytes, dimensions } from './format';

describe('library rules (content library)', () => {
  it('classifies by mime type', () => {
    expect(kindOf('image/webp')).toBe('image');
    expect(kindOf('video/mp4')).toBe('video');
    expect(kindOf('application/pdf')).toBe('document');
  });
  it('blocks delete while the asset is in use, with the count in the reason', () => {
    expect(canDelete({ usedIn: 0 })).toBe(true);
    expect(deleteBlockReason({ usedIn: 3 })).toBe('Used in 3 places. Remove it there first.');
  });
  it('enforces per-kind upload limits', () => {
    expect(uploadBlockReason({ mimeType: 'image/png', sizeBytes: 5 * 1024 * 1024 })).toBeUndefined();
    expect(uploadBlockReason({ mimeType: 'image/png', sizeBytes: 11 * 1024 * 1024 })).toMatch(/under 10 MB/);
  });
  it('derives a title from the file name', () => {
    expect(titleFromFileName('summer_banner-v2.webp')).toBe('summer banner v2');
  });
  it('formats bytes and dimensions', () => {
    expect(formatBytes(2_516_582)).toBe('2.4 MB');
    expect(formatBytes(900)).toBe('900 B');
    expect(dimensions({ width: 1200, height: 800 })).toBe('1200 × 800');
    expect(dimensions({})).toBe('—');
  });
});

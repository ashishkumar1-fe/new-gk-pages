import { describe, it, expect } from 'vitest';
import list from './fixtures/library.list.json';
import { RawLibraryList, type RawLibrary } from './library.wire';
import { toAsset, toWire } from './library.client';

describe('media-apps assets wire schema and transformer', () => {
  it('parses the recorded list response', () => {
    expect(RawLibraryList.safeParse(list).success).toBe(true);
  });
  it('turns the wire asset into the domain shape, classifying by mime type', () => {
    const a = toAsset(list.items[0] as RawLibrary);
    expect(a.kind).toBe('image');
    expect(a.sizeBytes).toBe(482133);
    expect(a.tags).toEqual(['banner', 'summer']);
    expect(a.usedIn).toBe(2);
  });
  it('derives a title from the file name when the service sends none', () => {
    const a = toAsset(list.items[3] as RawLibrary);
    expect(a.title).toBe('running shoes air hero');
  });
  it('writes metadata only, with empty strings as null', () => {
    expect(toWire({ title: 'Hero', altText: '', tags: ['a'], folder: undefined })).toEqual({
      title: 'Hero',
      alt_text: null,
      tags: ['a'],
      folder: null,
    });
  });
});

import { defineResource, keysFor, queryFromParams, type ListConfig } from './define';
import {
  LibrarySchema,
  LibraryListItemSchema,
  LibraryInputSchema,
  type Library,
  type LibraryListItem,
  type LibraryInput,
} from '@/domain/library/schema';
import { dimensions, formatBytes, kindLabel, kindTone, usedInLabel } from '@/domain/library/format';
import { api } from '@/api';

/** Content library (design: Content · gk-pages pages/content-library). Assets of the store: images, videos, documents. */
const list: ListConfig<LibraryListItem> = {
  columns: [
    { id: 'asset', header: 'Asset', cell: (a) => ({ kind: 'image_title', value: a.title, image: a.thumbnailUrl }) },
    { id: 'kind', header: 'Type', cell: (a) => ({ kind: 'status', value: kindLabel(a.kind), tone: kindTone(a.kind) }) },
    { id: 'size', header: 'Size', cell: (a) => ({ kind: 'text', value: formatBytes(a.sizeBytes) }) },
    { id: 'dimensions', header: 'Dimensions', cell: (a) => ({ kind: 'text', value: dimensions(a) }) },
    { id: 'folder', header: 'Folder', cell: (a) => ({ kind: 'text', value: a.folder }) },
    { id: 'usedIn', header: 'Used in', cell: (a) => ({ kind: 'text', value: usedInLabel(a.usedIn) }) },
    { id: 'updatedAt', header: 'Updated', cell: (a) => ({ kind: 'date', value: a.updatedAt }) },
  ],
  search: { placeholder: 'Search by title, file name or tag', debounceMs: 300 },
  filters: [
    {
      id: 'folder',
      label: 'Folder',
      type: 'enum',
      options: [
        { value: 'Products', label: 'Products' },
        { value: 'Campaigns', label: 'Campaigns' },
        { value: 'Brand', label: 'Brand' },
        { value: 'Documents', label: 'Documents' },
      ],
      toQuery: (v) => ({ folder: v as string }),
    },
  ],
  views: {
    source: 'static',
    items: [
      { id: 'all', label: 'All' },
      { id: 'images', label: 'Images', query: { kind: 'image' } },
      { id: 'videos', label: 'Videos', query: { kind: 'video' } },
      { id: 'documents', label: 'Documents', query: { kind: 'document' } },
    ],
  },
  pageSize: 50,
  selection: { enabled: true },
  empty: {
    title: 'Your library is empty',
    body: 'Upload images, videos and documents once and reuse them across products and pages.',
    action: 'library.addFromUrl',
  },
};

export const library = defineResource<Library, LibraryListItem, LibraryInput>({
  name: 'library',
  label: { singular: 'Asset', plural: 'Content library' },
  icon: 'content',
  title: (a) => a.title,
  service: 'media-apps',
  schema: { detail: LibrarySchema, item: LibraryListItemSchema, input: LibraryInputSchema },
  data: {
    cache: 'list',
    getList: (p, o) => api.mediaApps.listAssets(queryFromParams(list, p), o),
    getOne: (id, o) => api.mediaApps.getAsset(id, o),
    search: (q, limit, o) => api.mediaApps.searchAssets(q, limit, o),
  },
  keys: keysFor('library'),
  routes: { list: '/library', detail: '/library/$id' },
  list,
  editor: {
    toInput: (a) => ({ id: a.id, title: a.title, altText: a.altText, tags: a.tags, folder: a.folder }),
    layout: {
      main: [
        { id: 'preview', title: 'File', component: 'assetPreview' },
        {
          id: 'details',
          title: 'Details',
          fields: [
            { path: 'title', label: 'Title', type: 'text' },
            { path: 'altText', label: 'Alt text', type: 'textarea', help: 'Describes the image for screen readers and search engines' },
          ],
        },
      ],
      aside: [
        {
          id: 'organise',
          title: 'Organisation',
          fields: [
            {
              path: 'folder',
              label: 'Folder',
              type: 'select',
              options: [
                { value: 'Products', label: 'Products' },
                { value: 'Campaigns', label: 'Campaigns' },
                { value: 'Brand', label: 'Brand' },
                { value: 'Documents', label: 'Documents' },
              ],
            },
            { path: 'tags', label: 'Tags', type: 'tags' },
          ],
        },
        { id: 'usage', title: 'Used in', component: 'assetUsage' },
      ],
    },
    save: 'library.update',
  },
  commands: {
    page: ['library.addFromUrl'],
    bulk: ['library.bulkDelete'],
    more: () => ['library.copyLink', 'library.delete'],
  },
  search: { enabled: true, limit: 4 },
  nav: { group: 'Content', position: 6 },
  permissions: { read: 'read_content', write: 'write_content' },
  assistant: {
    description: 'Media assets: images, videos and documents the store uploaded.',
    readableFields: ['title', 'kind', 'sizeBytes', 'folder', 'usedIn'],
  },
});

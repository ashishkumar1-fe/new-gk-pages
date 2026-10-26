import { z } from 'zod';
import { defineCommand } from './define';
import { LibraryInputSchema, type Library, type LibraryInput } from '@/domain/library/schema';
import { deleteBlockReason } from '@/domain/library/rules';
import { keysFor } from '@/resources/define';

const keys = keysFor('library');
const record = (ctx: { record?: unknown }) => ctx.record as Library | undefined;

/** Add an asset the store already hosts. The form asks for the URL; the service reads the metadata. */
export const addFromUrl = defineCommand<{ url: string; title?: string; folder?: string }, Library>({
  id: 'library.addFromUrl',
  resource: 'library',
  label: 'Add asset',
  description: 'Add an image, video or document to the content library from a URL.',
  icon: 'plus',
  keywords: ['upload', 'media', 'image'],
  input: z.object({ url: z.string().url('Enter a valid URL'), title: z.string().optional(), folder: z.string().optional() }),
  form: [
    { path: 'url', label: 'File URL', type: 'text', help: 'https://… to an image, video or PDF' },
    { path: 'title', label: 'Title', type: 'text', help: 'Optional; defaults to the file name' },
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
  ],
  scope: 'page',
  permission: 'write_content',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [{ id: 'add', onFailure: 'abort', run: (i, _p, d) => d.api.mediaApps.addAssetFromUrl(i, { signal: d.signal }) }],
  invalidates: () => [keys.lists()],
  updates: (_i, a) => [{ key: keys.detail(a.id), update: () => a }],
  onSuccess: { toast: () => 'Asset added', navigate: (a) => `/library/${a.id}` },
  expose: { palette: true, assistant: { topic: 'content' }, extensions: false },
});

export const update = defineCommand<LibraryInput & { id: string }, Library>({
  id: 'library.update',
  resource: 'library',
  label: 'Save',
  description: 'Save the asset title, alt text, folder and tags.',
  shortcut: 'mod+s',
  input: LibraryInputSchema.extend({ id: z.string() }),
  scope: 'record',
  permission: 'write_content',
  effect: { readOnly: false, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [{ id: 'update', onFailure: 'abort', run: (i, _p, d) => d.api.mediaApps.updateAsset(i, { signal: d.signal }) }],
  invalidates: (i) => [keys.detail(i.id), keys.lists()],
  updates: (_i, a) => [{ key: keys.detail(a.id), update: () => a }],
  onSuccess: { toast: () => 'Asset saved' },
  expose: { palette: false, assistant: { topic: 'content' }, extensions: false },
});

/** Copies the public URL. Read-only, so no confirm and no invalidation. */
export const copyLink = defineCommand<{ id: string; url: string }, void>({
  id: 'library.copyLink',
  resource: 'library',
  label: 'Copy link',
  description: 'Copy the public URL of this asset.',
  icon: 'link',
  input: z.object({ id: z.string(), url: z.string() }),
  fromContext: (ctx) => ({ id: record(ctx)?.id, url: record(ctx)?.url }),
  scope: 'record',
  permission: 'read_content',
  effect: { readOnly: true, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [{ id: 'copy', onFailure: 'abort', run: (i, _p, d) => d.copy(i.url) }],
  invalidates: () => [],
  onSuccess: { toast: () => 'Link copied' },
  expose: { palette: true, assistant: false, extensions: { targets: ['record'] } },
});

/** Delete is blocked while the asset is referenced; the reason sits on the button (domain rule). */
export const del = defineCommand<{ id: string }, void>({
  id: 'library.delete',
  resource: 'library',
  label: 'Delete asset',
  description: 'Delete this asset permanently.',
  icon: 'trash',
  input: z.object({ id: z.string() }),
  fromContext: (ctx) => ({ id: record(ctx)?.id }),
  scope: 'record',
  enabled: (ctx) => {
    const a = record(ctx);
    return a ? (deleteBlockReason(a) ?? true) : true;
  },
  permission: 'write_content',
  effect: { readOnly: false, destructive: true, idempotent: true, external: false },
  confirm: (_i, ctx) => ({
    title: `Delete ${record(ctx)?.title ?? 'this asset'}?`,
    body: 'The file is removed from storage. This can’t be undone.',
    confirmLabel: 'Delete',
    tone: 'critical',
  }),
  mode: 'pessimistic',
  steps: [{ id: 'delete', onFailure: 'abort', run: (i, _p, d) => d.api.mediaApps.deleteAsset(i.id, { signal: d.signal }) }],
  invalidates: () => [keys.lists()],
  onSuccess: { toast: () => 'Asset deleted', navigate: () => '/library' },
  expose: { palette: true, assistant: false, extensions: false },
});

/** One call with every id; assets still in use come back in `failed`, so the result is partial, never a silent skip. */
export const bulkDelete = defineCommand<{ ids: string[] }, { deleted: number; failed: { id: string; reason: string }[] }>({
  id: 'library.bulkDelete',
  resource: 'library',
  label: 'Delete',
  description: 'Delete the selected assets. Assets still in use are kept and listed.',
  icon: 'trash',
  input: z.object({ ids: z.array(z.string()).min(1) }),
  fromContext: (ctx) => ({ ids: ctx.selection?.ids }),
  scope: 'selection',
  permission: 'write_content',
  effect: { readOnly: false, destructive: true, idempotent: true, external: false },
  confirm: (i) => ({
    title: `Delete ${i.ids.length} asset${i.ids.length === 1 ? '' : 's'}?`,
    body: 'Assets still used by a product or page are kept.',
    confirmLabel: 'Delete',
    tone: 'critical',
  }),
  mode: 'pessimistic',
  bulk: { maxItems: 100, toItems: (i) => i.ids },
  steps: [{ id: 'delete', onFailure: 'abort', run: (i, _p, d) => d.api.mediaApps.bulkDeleteAssets(i.ids, { signal: d.signal }) }],
  invalidates: () => [keys.lists()],
  onSuccess: { toast: (r) => `${r.deleted} asset${r.deleted === 1 ? '' : 's'} deleted` },
  expose: { palette: false, assistant: false, extensions: { targets: ['selection'] } },
});

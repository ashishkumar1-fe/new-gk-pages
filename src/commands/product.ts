import { z } from 'zod';
import { defineCommand, type CommandDeps, type JobSpec } from './define';
import {
  ProductInputSchema,
  ProductStatus,
  type Product,
  type ProductInput,
  type ProductListItem,
  type Variant,
} from '@/domain/product/schema';
import { canDelete } from '@/domain/product/rules';
import { buildStorefrontUrl } from '@/domain/store/rules';
import { ExportInput, type ExportPreview, type ImportPreview } from '@/domain/job/schema';
import { MoneySchema } from '@/domain/shared/money';
import { polls } from '@/platform/query/pollPolicy';
import { keysFor } from '@/resources/define';
import { api } from '@/api';

// Target spec: docs/architecture/commands/defs/catalog.md (product) and defs/bulk-ops.md (import / export).

const keys = keysFor('product');
const record = (ctx: { record?: unknown }) => ctx.record as Product | ProductListItem | undefined;
const requester = (d: CommandDeps) => ({ email: d.session.staff.email, name: d.session.staff.name, storeId: d.session.storeId });
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

/** A bulk-ops job, followed by the Jobs machine. Progress every 5 s, no attempt limit today (pollPolicy.ts bulkOpsJob). */
const bulkOpsJob: JobSpec<{ jobId: string }> = {
  jobId: (r) => r.jobId,
  policy: polls.bulkOpsJob,
  poll: async (jobId, { signal }) => {
    const p = await api.bulkOps.getJobProgress(jobId, { signal });
    const status = p.status;
    if (status === 'failed') return { state: 'failed', error: 'The job failed' };
    if (status === 'cancelled') return { state: 'cancelled' };
    if (p.isCompleted) return { state: 'completed', result: { jobId } };
    return {
      state: status === 'pending' ? 'queued' : 'running',
      progress: p.totalRows ? { done: p.completedRows ?? 0, total: p.totalRows } : undefined,
    };
  },
  cancel: async (jobId, { signal }) => {
    await api.bulkOps.cancelJob(jobId, { signal });
  },
};

export const create = defineCommand<ProductInput, Product>({
  id: 'product.create',
  resource: 'product',
  label: 'Add product',
  description: 'Create a new product.',
  icon: 'plus',
  keywords: ['new', 'add'],
  input: ProductInputSchema,
  scope: 'page',
  permission: 'write_products',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [{ id: 'create', onFailure: 'abort', run: (i, _p, d) => d.api.item.createProduct(i, { signal: d.signal }) }],
  invalidates: () => [keys.lists()],
  updates: (_i, p) => [{ key: keys.detail(p.id), update: () => p }],
  onSuccess: { toast: () => 'Product created', navigate: (p) => `/products/${p.id}` },
  expose: { palette: true, assistant: { topic: 'catalog' }, extensions: false },
});

export const update = defineCommand<ProductInput & { id: string }, Product>({
  id: 'product.update',
  resource: 'product',
  label: 'Save',
  description: 'Save changes to this product.',
  shortcut: 'mod+s',
  input: ProductInputSchema.extend({ id: z.string() }),
  scope: 'record',
  permission: 'write_products',
  effect: { readOnly: false, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [{ id: 'update', onFailure: 'abort', run: (i, _p, d) => d.api.item.updateProduct(i, { signal: d.signal }) }],
  invalidates: () => [keys.lists(), keysFor('inventory').lists()],
  updates: (i, p) => [{ key: keys.detail(i.id), update: () => p }],
  onSuccess: { toast: () => 'Product saved' },
  expose: { palette: true, assistant: { topic: 'catalog' }, extensions: { targets: ['record'] } },
});

/** The variants page keeps its own save, as today: tracking, policy, price, SKU, weight. Per-location stock is inventory.adjust. */
const VariantUpdateSchema = z.object({
  id: z.string(),
  productId: z.string(),
  title: z.string(),
  price: MoneySchema,
  compareAtPrice: MoneySchema.optional(),
  costPerItem: MoneySchema.optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  taxable: z.boolean(),
  inventoryTracked: z.boolean(),
  inventoryPolicy: z.enum(['deny', 'continue']),
  selectedOptions: z.array(z.object({ name: z.string(), value: z.string() })),
  weight: z.object({ value: z.number(), unit: z.string() }).optional(),
});
export const updateVariant = defineCommand<z.infer<typeof VariantUpdateSchema>, Variant>({
  id: 'product.updateVariant',
  resource: 'product',
  label: 'Save variant',
  description: 'Save changes to one variant.',
  input: VariantUpdateSchema,
  fromContext: (ctx) => ctx.record as Partial<z.infer<typeof VariantUpdateSchema>>,
  scope: 'record',
  permission: 'write_products',
  effect: { readOnly: false, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [{ id: 'updateVariant', onFailure: 'abort', run: (i, _p, d) => d.api.item.updateVariant(i, { signal: d.signal }) }],
  invalidates: (i) => [keys.detail(i.productId), keys.lists()],
  onSuccess: { toast: () => 'Variant saved' },
  expose: { palette: true, assistant: { topic: 'catalog' }, extensions: { targets: ['record'] } },
});

export const del = defineCommand<{ id: string }, void>({
  id: 'product.delete',
  resource: 'product',
  label: 'Delete product',
  description: 'Delete this product permanently.',
  input: z.object({ id: z.string() }),
  fromContext: (ctx) => ({ id: record(ctx)?.id }),
  scope: 'record',
  visible: (ctx) => {
    const r = record(ctx);
    return !!r && canDelete(r);
  },
  permission: 'write_products',
  effect: { readOnly: false, destructive: true, idempotent: true, external: false },
  confirm: (_i, ctx) => ({
    title: `Delete ${record(ctx)?.title ?? 'this product'}?`,
    body: 'This can’t be undone.',
    confirmLabel: 'Delete',
    tone: 'critical',
  }),
  mode: 'pessimistic',
  steps: [{ id: 'delete', onFailure: 'abort', run: (i, _p, d) => d.api.item.deleteProduct(i.id, { signal: d.signal }) }],
  invalidates: () => [keys.lists()],
  onSuccess: { toast: () => 'Product deleted', navigate: () => '/products' },
  expose: { palette: true, assistant: false, extensions: false },
});

export const bulkDelete = defineCommand<{ ids: string[] }, { deletedCount: number }>({
  id: 'product.bulkDelete',
  resource: 'product',
  label: (ctx) => `Delete ${ctx.selection?.ids.length ?? ''} products`,
  description: 'Delete the selected products.',
  input: z.object({ ids: z.array(z.string()).min(1) }),
  fromContext: (ctx) => ({ ids: ctx.selection?.ids }),
  scope: 'selection',
  permission: 'write_products',
  effect: { readOnly: false, destructive: true, idempotent: true, external: false },
  confirm: (i) => ({
    title: `Delete ${i.ids.length} products?`,
    body: 'This can’t be undone.',
    confirmLabel: `Delete ${i.ids.length} products`,
    tone: 'critical',
  }),
  mode: 'pessimistic',
  steps: [{ id: 'bulkDelete', onFailure: 'abort', run: (i, _p, d) => d.api.item.bulkDeleteProducts(i.ids, { signal: d.signal }) }],
  invalidates: () => [keys.lists()],
  onSuccess: { toast: (r) => `${r.deletedCount} products deleted` },
  expose: { palette: true, assistant: false, extensions: false },
});

/** One bulk-update call; each full product is built from its detail so no variant is dropped. Count only: all or nothing. */
export const setStatus = defineCommand<{ ids: string[]; status: ProductStatus }, { updated: number }>({
  id: 'product.setStatus',
  resource: 'product',
  label: 'Set status',
  description: 'Set the status of the selected products.',
  keywords: ['active', 'draft', 'archive'],
  input: z.object({ ids: z.array(z.string()).min(1), status: ProductStatus }),
  fromContext: (ctx) => ({ ids: ctx.selection?.ids }),
  form: [{ path: 'status', label: 'Status', type: 'select', options: statusOptions }],
  scope: 'selection',
  permission: 'write_products',
  effect: { readOnly: false, destructive: false, idempotent: true, external: false },
  confirm: 'never', // > 25 items confirms by default in runCommand
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'bulkUpdate',
      onFailure: 'abort',
      run: (i, _p, d) =>
        d.api.item.bulkUpdateProducts(
          i.ids.map((id) => ({ id, status: i.status })),
          { signal: d.signal, idempotencyKey: d.idempotencyKey },
        ),
    },
  ],
  invalidates: (i) => [keys.lists(), ...i.ids.map((id) => keys.detail(id))],
  onSuccess: { toast: (r) => `${r.updated} products updated` },
  expose: { palette: true, assistant: { topic: 'catalog' }, extensions: { targets: ['selection'] } },
});

/** Status, vendor and type for every selected product; price and SKU per variant. Blank fields keep each product's value. */
const BulkEditSchema = z
  .object({
    ids: z.array(z.string()).min(1),
    status: ProductStatus.optional().or(z.literal('').transform(() => undefined)),
    vendor: z.string().trim().optional(),
    productType: z.string().trim().optional(),
    variants: z
      .array(z.object({ productId: z.string(), id: z.string(), price: MoneySchema.optional(), sku: z.string().optional() }))
      .optional(),
  })
  .refine((i) => !!i.status || !!i.vendor || !!i.productType || (i.variants?.length ?? 0) > 0, {
    message: 'Nothing to apply — set at least one field above.',
    path: ['status'],
  });
export const bulkEdit = defineCommand<z.infer<typeof BulkEditSchema>, { updated: number }>({
  id: 'product.bulkEdit',
  resource: 'product',
  label: 'Bulk edit',
  description: 'Edit status, vendor, type, prices and SKUs of the selected products.',
  input: BulkEditSchema,
  fromContext: (ctx) => ({ ids: ctx.selection?.ids }),
  form: [
    { path: 'status', label: 'Status', type: 'select', options: statusOptions, help: 'Leave blank to keep each product’s status' },
    { path: 'vendor', label: 'Vendor', type: 'text', help: 'Leave blank to keep each product’s vendor' },
    { path: 'productType', label: 'Product type', type: 'text', help: 'Leave blank to keep each product’s type' },
  ],
  scope: 'selection',
  permission: 'write_products',
  effect: { readOnly: false, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  idempotencyKey: true,
  steps: [
    {
      id: 'bulkUpdate',
      onFailure: 'abort',
      run: (i, _p, d) =>
        d.api.item.bulkUpdateProducts(
          i.ids.map((id) => ({
            id,
            status: i.status || undefined,
            vendor: i.vendor || undefined,
            productType: i.productType || undefined,
            variants: i.variants?.filter((v) => v.productId === id).map(({ id: vid, price, sku }) => ({ id: vid, price, sku })),
          })),
          { signal: d.signal, idempotencyKey: d.idempotencyKey },
        ),
    },
  ],
  invalidates: (i) => [keys.lists(), ...i.ids.map((id) => keys.detail(id))],
  onSuccess: { toast: (r) => `Updated ${r.updated} products` },
  expose: { palette: true, assistant: { topic: 'catalog' }, extensions: { targets: ['selection'] } },
});

/** Opens create with this product as the source; the editor prefills "(Copy)", draft, "-copy" handle; saved with product.create. */
export const duplicate = defineCommand<{ id: string }, void>({
  id: 'product.duplicate',
  resource: 'product',
  label: 'Duplicate',
  description: 'Create a copy of this product as a draft.',
  keywords: ['copy', 'clone'],
  input: z.object({ id: z.string() }),
  fromContext: (ctx) => ({ id: record(ctx)?.id }),
  scope: 'record',
  permission: 'write_products',
  effect: { readOnly: true, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  steps: [{ id: 'navigate', onFailure: 'abort', run: async () => undefined }],
  invalidates: () => [],
  onSuccess: { navigate: (_r, i) => `/products/new?sourceId=${i.id}` },
  expose: { palette: true, assistant: { topic: 'catalog' }, extensions: { targets: ['record'] } },
});

/** `{storefront_url}/{productsRoute}/{handle}`, copied. Needs Storefront settings; without them the reason says so. */
export const copyLink = defineCommand<{ handle: string }, { url: string }>({
  id: 'product.copyLink',
  resource: 'product',
  label: 'Copy link',
  description: 'Copy the storefront link to this product.',
  keywords: ['share', 'url'],
  input: z.object({ handle: z.string().min(1, 'This product has no handle yet') }),
  fromContext: (ctx) => ({ handle: (ctx.record as Product | undefined)?.handle }),
  scope: 'record',
  visible: (ctx) => !!(ctx.record as Product | undefined)?.handle,
  permission: 'write_products',
  effect: { readOnly: true, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  steps: [
    { id: 'settings', onFailure: 'abort', run: (_i, _p, d) => d.api.item.getStorefrontSettings({ signal: d.signal }) },
    {
      id: 'copy',
      onFailure: 'abort',
      run: async (i, prev, d) => {
        const s = prev.settings as Awaited<ReturnType<CommandDeps['api']['item']['getStorefrontSettings']>>;
        const url = buildStorefrontUrl(s.storefrontUrl, s.routeForProducts, i.handle);
        if (!url) throw new Error('Set the storefront URL in Settings');
        await d.copy(url);
        return { url };
      },
    },
  ],
  invalidates: () => [],
  onSuccess: { toast: () => 'Link copied' },
  expose: { palette: true, assistant: { topic: 'catalog' }, extensions: { targets: ['record'] } },
});

/**
 * AI title and description. Fills the editor draft (`draftPatch`); does not save. Today only on create; v1 also on edit.
 * The apply call records which generation was used and never fails the command.
 */
export const generateContent = defineCommand<
  { productId?: string; descriptionLength: number; userDescription?: string },
  { draftPatch: Partial<ProductInput> }
>({
  id: 'product.generateContent',
  resource: 'product',
  label: 'Generate title and description',
  description: 'Write a title and description with AI; review before saving.',
  keywords: ['ai', 'write', 'description'],
  input: z.object({
    productId: z.string().optional(),
    descriptionLength: z.number().int().positive().default(120),
    userDescription: z.string().optional(),
  }),
  fromContext: (ctx) => ({ productId: record(ctx)?.id, descriptionLength: 120 }),
  scope: ['record', 'page'],
  permission: 'write_products',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'generate',
      onFailure: 'abort',
      run: (i, _p, d) =>
        d.api.item.generateContent(
          { productId: i.productId, descriptionLength: i.descriptionLength, userDescription: i.userDescription },
          { signal: d.signal },
        ),
    },
    {
      id: 'apply',
      onFailure: 'continue-with-warning',
      run: async (_i, prev, d) => {
        const g = prev.generate as Awaited<ReturnType<CommandDeps['api']['item']['generateContent']>>;
        await d.api.item.applyContent(g.requestId, { title: g.title, description: g.description }, { signal: d.signal });
        return { draftPatch: { title: g.title, descriptionHtml: g.description } };
      },
    },
  ],
  invalidates: () => [],
  onSuccess: { toast: () => 'Title and description generated. Review them, then save.' },
  expose: { palette: true, assistant: { topic: 'catalog' }, extensions: { targets: ['record'] } },
});

// ── Import and export (bulk-ops jobs, defs/bulk-ops.md) ───

export const importPreview = defineCommand<{ file: File }, ImportPreview>({
  id: 'product.importPreview',
  resource: 'product',
  label: 'Preview import',
  description: 'Validate a product CSV before importing it.',
  input: z.object({ file: z.instanceof(File) }),
  scope: 'page',
  permission: 'write_products',
  effect: { readOnly: false, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [
    {
      id: 'preview',
      onFailure: 'abort',
      run: (i, _p, d) => d.api.bulkOps.previewImport('product', i.file, requester(d), { signal: d.signal }),
    },
  ],
  invalidates: () => [],
  expose: { palette: true, assistant: false, extensions: false },
});

export const imp = defineCommand<{ jobId: string; rows?: number }, { jobId: string }>({
  id: 'product.import',
  resource: 'product',
  label: 'Import',
  description: 'Import products from a CSV.',
  icon: 'upload',
  input: z.object({ jobId: z.string().min(1), rows: z.number().int().optional() }),
  scope: 'page',
  permission: 'write_products',
  effect: { readOnly: false, destructive: false, idempotent: false, external: true },
  confirm: (i) => ({
    title: i.rows ? `Import ${i.rows} rows?` : 'Import products?',
    body: 'Existing products may be updated.',
    confirmLabel: 'Start import',
    tone: 'default',
  }),
  mode: 'pessimistic',
  steps: [{ id: 'import', onFailure: 'abort', run: (i, _p, d) => d.api.bulkOps.processImport(i.jobId, { signal: d.signal }) }],
  invalidates: () => [],
  job: bulkOpsJob,
  onSuccess: { toast: () => 'Import started' },
  expose: { palette: true, assistant: false, extensions: false },
});

export const exportPreview = defineCommand<ExportInput, ExportPreview>({
  id: 'product.exportPreview',
  resource: 'product',
  label: 'Preview export',
  description: 'Estimate a product export before starting it.',
  input: ExportInput.extend({ entity: z.literal('product').default('product') }),
  scope: 'page',
  permission: 'write_products',
  effect: { readOnly: true, destructive: false, idempotent: false, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [{ id: 'preview', onFailure: 'abort', run: (i, _p, d) => d.api.bulkOps.previewExport(i, requester(d), { signal: d.signal }) }],
  invalidates: () => [],
  expose: { palette: true, assistant: { topic: 'catalog' }, extensions: false },
});

export const exportCsv = defineCommand<{ jobId: string }, { jobId: string }>({
  id: 'product.export',
  resource: 'product',
  label: 'Export',
  description: 'Export products; the file is emailed to you.',
  icon: 'download',
  input: z.object({ jobId: z.string().min(1) }),
  scope: 'page',
  permission: 'write_products',
  effect: { readOnly: true, destructive: false, idempotent: true, external: false },
  confirm: 'never',
  mode: 'pessimistic',
  steps: [{ id: 'export', onFailure: 'abort', run: (i, _p, d) => d.api.bulkOps.processExport(i.jobId, { signal: d.signal }) }],
  invalidates: () => [],
  job: bulkOpsJob,
  onSuccess: { toast: (_r, _i, ctx) => `Export started. The file will be emailed to ${ctx.staff.email ?? 'you'}.` },
  expose: { palette: true, assistant: { topic: 'catalog' }, extensions: false },
});

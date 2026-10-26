import { defineResource, keysFor, queryFromParams, type CreateContext, type ListConfig, type Option } from './define';
import {
  ProductSchema,
  ProductListItemSchema,
  ProductInputSchema,
  type Product,
  type ProductListItem,
  type ProductInput,
} from '@/domain/product/schema';
import { isDefaultVariant, productDefaults } from '@/domain/product/rules';
import { statusLabel, statusTone, inventorySummary } from '@/domain/product/format';
import { money } from '@/domain/shared/money';
import { toInput } from '@/api/item/product.transformer';
import { api } from '@/api';

// Target spec: docs/architecture/resources/defs/product.md. The exemplar every recipe points at.

const lookup = (pick: 'vendors' | 'tags' | 'types') => async (): Promise<Option[]> =>
  (await api.item.listProductFilters())[pick].map((v) => ({ value: v, label: v }));
const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];
/** Pricing, SKU and inventory sections show only for a product without options (today's rule; defs/product.md). */
const noOptions = (d: ProductInput) => !d.hasOptions;
const channelsCount = (p: ProductListItem) =>
  p.channels.length ? `${p.channels.length} channel${p.channels.length === 1 ? '' : 's'}` : '—';

const list: ListConfig<ProductListItem> = {
  columns: [
    { id: 'product', header: 'Product', cell: (p) => ({ kind: 'image_title', value: p.title, image: p.imageUrl }) },
    { id: 'status', header: 'Status', cell: (p) => ({ kind: 'status', value: statusLabel(p.status), tone: statusTone(p.status) }) }, // active green, draft yellow, archived gray
    { id: 'inventory', header: 'Inventory', cell: (p) => ({ kind: 'text', value: inventorySummary(p) }) }, // "50 in stock for 5 variants"
    { id: 'category', header: 'Category', cell: (p) => ({ kind: 'text', value: p.category?.name }) },
    { id: 'channels', header: 'Channels', cell: (p) => ({ kind: 'text', value: channelsCount(p) }) },
    { id: 'type', header: 'Type', cell: (p) => ({ kind: 'text', value: p.productType }) },
    { id: 'vendor', header: 'Vendor', cell: (p) => ({ kind: 'text', value: p.vendor }) },
    { id: 'createdAt', header: 'Created at', cell: (p) => ({ kind: 'date', value: p.createdAt }), hidden: true },
    { id: 'updatedAt', header: 'Updated at', cell: (p) => ({ kind: 'date', value: p.updatedAt }), hidden: true },
  ],
  search: { placeholder: 'Search and filter', debounceMs: 500 }, // as today's shared toolbar
  filters: [
    { id: 'vendor', label: 'Vendor', type: 'multi_enum', options: lookup('vendors'), toQuery: (v) => ({ vendors: v as string[] }) },
    { id: 'tags', label: 'Tags', type: 'multi_enum', options: lookup('tags'), toQuery: (v) => ({ tags: v as string[] }) },
    { id: 'type', label: 'Type', type: 'enum', options: lookup('types'), toQuery: (v) => ({ productType: v as string }) },
  ],
  views: {
    source: 'static',
    items: [
      { id: 'all', label: 'All' },
      { id: 'active', label: 'Active', query: { status: 'active' } },
      { id: 'draft', label: 'Draft', query: { status: 'draft' } },
      { id: 'archived', label: 'Archived', query: { status: 'archived' } },
    ],
  },
  // no sort: the item API has none
  pageSize: 50,
  selection: { enabled: true },
  insights: { component: 'productInsights', capability: 'product-insights' }, // design strip; off (no backend)
  empty: { title: 'Add your first product', body: 'Products you add show up here.', action: 'product.create' },
};

/**
 * Create, or duplicate when the route has `?sourceId=`: title "{title} (Copy)", handle "{handle}-copy", status draft,
 * collections kept. (gk-pages CreateProductForm.tsx:282)
 */
const productInitial = (ctx: CreateContext): ProductInput => {
  const base: ProductInput = {
    title: '',
    descriptionHtml: '',
    status: productDefaults.status,
    tags: [],
    price: money(0),
    taxable: productDefaults.taxable,
    channels: ['online'],
    isPhysical: false,
    countryOfOrigin: productDefaults.countryOfOrigin,
    collectionIds: [],
  };
  const src = ctx.source as Product | undefined;
  if (!src) return base;
  const from = toInput(src);
  return { ...from, id: undefined, title: `${src.title} (Copy)`, handle: src.handle ? `${src.handle}-copy` : undefined, status: 'draft' };
};

export const product = defineResource<Product, ProductListItem, ProductInput>({
  name: 'product',
  label: { singular: 'Product', plural: 'Products' },
  icon: 'package',
  title: (p) => p.title,
  service: 'item',
  schema: { detail: ProductSchema, item: ProductListItemSchema, input: ProductInputSchema },
  data: {
    cache: 'list',
    getList: (p, o) => api.item.listProducts(queryFromParams(list, p), o),
    getOne: (id, o) => api.item.getProduct(id, o),
    search: (q, limit, o) => api.item.searchProducts(q, limit, o),
  },
  keys: keysFor('product'),
  routes: { list: '/products', detail: '/products/$id', create: '/products/new', sub: { variants: '/products/$id/variants' } },
  list,
  editor: {
    toInput: (p) => ({ ...toInput(p), hasOptions: !isDefaultVariant(p) }),
    header: { status: (d) => ({ label: statusLabel(d.status), tone: statusTone(d.status) }) },
    layout: {
      main: [
        {
          id: 'details',
          title: 'Product details',
          fields: [
            { path: 'title', label: 'Title', type: 'text' },
            { path: 'descriptionHtml', label: 'Description', type: 'rich_text' },
          ],
        },
        { id: 'sku', title: 'SKU', visibleWhen: noOptions, fields: [{ path: 'sku', label: 'SKU (Stock Keeping Unit)', type: 'text' }] },
        { id: 'variants', title: 'Variants', component: 'variantsCard' },
        {
          id: 'pricing',
          title: 'Pricing',
          visibleWhen: noOptions,
          fields: [
            { path: 'price', label: 'Price', type: 'money' },
            { path: 'compareAtPrice', label: 'Compare-at price', type: 'money' },
            { path: 'costPerItem', label: 'Cost per item', type: 'money', help: 'Customers won’t see this' },
          ],
        },
        { id: 'inventory', title: 'Inventory', component: 'inventorySection', visibleWhen: noOptions }, // v3 immediate adjust; not part of the draft
        {
          id: 'shipping',
          title: 'Shipping',
          fields: [
            { path: 'isPhysical', label: 'This is a physical product', type: 'boolean' },
            { path: 'countryOfOrigin', label: 'Country of origin', type: 'text', visibleWhen: (d) => d.isPhysical },
          ],
        },
        {
          id: 'tax',
          title: 'Tax',
          fields: [
            // own section: GST rate lands here later
            { path: 'taxable', label: 'Charge tax on this product', type: 'boolean' },
            { path: 'hsnCode', label: 'HSN code', type: 'text' },
          ],
        },
        { id: 'custom', title: 'Custom fields', component: 'customFields' },
        {
          id: 'seo',
          title: 'Search engine listing',
          collapsible: true,
          fields: [
            { path: 'seoTitle', label: 'Page title', type: 'text' },
            { path: 'seoDescription', label: 'Meta description', type: 'textarea' },
            { path: 'handle', label: 'URL handle', type: 'text', help: 'Leave empty to derive from the title' },
          ],
        },
        { id: 'ext-block', component: 'extension:admin.product-details.block.render' },
      ],
      aside: [
        { id: 'status', title: 'Status', fields: [{ path: 'status', label: 'Status', type: 'select', options: statusOptions }] },
        {
          id: 'channels',
          title: 'Sales channels',
          fields: [
            {
              path: 'channels',
              label: 'Channels',
              type: 'multi_select',
              options: [
                { value: 'online', label: 'Online store' },
                { value: 'pos', label: 'Point of sale' },
              ],
              help: 'online, pos',
            },
          ],
        },
        { id: 'template', title: 'Template', fields: [{ path: 'templateSuffix', label: 'Theme template', type: 'text' }] },
        {
          id: 'org',
          title: 'Organization',
          fields: [
            { path: 'productType', label: 'Product type', type: 'text' },
            { path: 'vendor', label: 'Vendor', type: 'text' },
            {
              path: 'collectionIds',
              label: 'Collections',
              type: 'multi_select',
              help: 'Collection ids, comma-separated (manual collections only)',
            },
            { path: 'tags', label: 'Tags', type: 'tags' },
          ],
        },
        { id: 'ext-side', component: 'extension:admin.product-details.sidebar.render' },
      ],
    },
    children: {
      variants: { path: 'variants', columns: [], editable: ['sku', 'price'], preview: 4, subRoute: '/products/$id/variants' },
    },
    save: 'product.update',
    create: { route: '/products/new', initial: productInitial, command: 'product.create' },
  },
  quickCreate: { fields: ['title', 'status', 'vendor'], command: 'product.create' },
  commands: {
    page: ['priceSchedule.create', 'product.export', 'product.import', 'product.create'],
    bulk: ['product.bulkEdit', 'product.setStatus', 'product.bulkDelete'],
    more: () => ['product.duplicate', 'product.copyLink', 'product.generateContent', 'product.delete'],
  },
  relations: { collections: { resource: 'collection', kind: 'many', via: 'collectionIds' } },
  search: { enabled: true, limit: 4 },
  nav: { group: 'Products', position: 1 },
  customFields: { ownerType: 'product', placement: 'main' },
  extensionTargets: ['admin.product-details.block.render', 'admin.product-details.sidebar.render', 'admin.product-details.action.render'],
  permissions: { read: 'read_products', write: 'write_products' },
  assistant: {
    description: 'Items the store sells, with variants, prices and stock.',
    readableFields: [
      'title',
      'status',
      'vendor',
      'productType',
      'tags',
      'category',
      'variants.sku',
      'variants.price',
      'variants.inventoryQuantity',
    ],
  },
});
